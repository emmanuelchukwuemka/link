<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    private const SOURCE_COLORS = [
        'Website' => '#3b82f6',
        'Referral' => '#16a34a',
        'Social Media' => '#ec4899',
        'Advertisement' => '#a855f7',
        'Other' => '#6b7280',
    ];

    private function pctChange(float $current, float $previous): float
    {
        if ($previous == 0.0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 1000) / 10;
    }

    public function __invoke(Request $request): JsonResponse
    {
        $fromParam = $request->query('from');
        $toParam = $request->query('to');

        $from = $fromParam ? Carbon::parse("{$fromParam}T00:00:00.000Z") : Carbon::now()->startOfMonth();
        $to = $toParam ? Carbon::parse("{$toParam}T23:59:59.999Z") : Carbon::now()->endOfMonth();

        $periodMs = $to->diffInMilliseconds($from);
        $priorTo = $from->copy()->subMillisecond();
        $priorFrom = $from->copy()->subMilliseconds($periodMs + 1);

        $bizTypes = ['business_admin', 'employee'];

        $totalUsers = User::count();
        $businessUsersCount = User::whereIn('account_type', $bizTypes)->count();
        $totalLeads = Lead::count();

        $newUsersThis = User::whereBetween('created_at', [$from, $to])->count();
        $newUsersPrior = User::whereBetween('created_at', [$priorFrom, $priorTo])->count();

        $newBizUsersThis = User::whereIn('account_type', $bizTypes)->whereBetween('created_at', [$from, $to])->count();
        $newBizUsersPrior = User::whereIn('account_type', $bizTypes)->whereBetween('created_at', [$priorFrom, $priorTo])->count();

        $newLeadsThis = Lead::whereBetween('created_at', [$from, $to])->count();
        $newLeadsPrior = Lead::whereBetween('created_at', [$priorFrom, $priorTo])->count();

        $newSubsThis = SubscriptionPayment::where('status', 'success')->whereBetween('created_at', [$from, $to])->count();
        $newSubsPrior = SubscriptionPayment::where('status', 'success')->whereBetween('created_at', [$priorFrom, $priorTo])->count();

        $now = Carbon::now();
        $proUsers = User::where('plan', '!=', 'free')->get(['plan_expires_at']);
        $paidBusinesses = Business::where('plan', '!=', 'free')->get(['plan', 'plan_expires_at']);

        $activeIndividualPro = $proUsers->filter(fn (User $u) => ! $u->plan_expires_at || $u->plan_expires_at->isFuture())->count();
        $activeBusinesses = $paidBusinesses->filter(fn (Business $b) => ! $b->plan_expires_at || $b->plan_expires_at->isFuture());
        $activeSubscriptions = $activeIndividualPro + $activeBusinesses->count();

        $dates = [];
        $cursor = $from->copy()->startOfDay();
        $endDay = $to->copy()->startOfDay();
        while ($cursor->lessThanOrEqualTo($endDay)) {
            $dates[] = $cursor->toDateString();
            $cursor->addDay();
        }

        $newUsersSeries = [];
        $leadsSeries = [];
        $subscriptionsSeries = [];
        $revenueSeries = [];
        $individualsGrowth = [];
        $businessesGrowth = [];
        $employeesGrowth = [];
        $productSalesTotal = 0.0;
        $subscriptionRevenueTotal = 0.0;

        foreach ($dates as $day) {
            $dayStart = Carbon::parse($day)->startOfDay();
            $dayEnd = Carbon::parse($day)->endOfDay();

            $newUsersSeries[] = User::whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $leadsSeries[] = Lead::whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $subscriptionsSeries[] = SubscriptionPayment::where('status', 'success')->whereBetween('created_at', [$dayStart, $dayEnd])->count();

            $dayPayments = (float) Payment::where('status', 'success')->whereBetween('created_at', [$dayStart, $dayEnd])->sum('amount');
            $daySubs = (float) SubscriptionPayment::where('status', 'success')->whereBetween('created_at', [$dayStart, $dayEnd])->sum('amount');
            $revenueSeries[] = $dayPayments + $daySubs;
            $productSalesTotal += $dayPayments;
            $subscriptionRevenueTotal += $daySubs;

            $individualsGrowth[] = User::where('account_type', 'individual')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $businessesGrowth[] = User::where('account_type', 'business_admin')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $employeesGrowth[] = User::where('account_type', 'employee')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
        }

        $usersBeforeRange = User::where('created_at', '<', $from)->count();
        $cumulativeUsersSeries = [];
        $running = $usersBeforeRange;
        foreach ($newUsersSeries as $n) {
            $running += $n;
            $cumulativeUsersSeries[] = $running;
        }

        $topLeadSources = Lead::whereBetween('created_at', [$from, $to])
            ->selectRaw('source, COUNT(*) as c')
            ->groupBy('source')
            ->orderByDesc('c')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->source,
                'value' => (int) $row->c,
                'color' => self::SOURCE_COLORS[$row->source] ?? '#6b7280',
            ]);

        $businessPlans = config('plans.business_plans');
        $subscriptionPlans = collect([['label' => 'Individual Pro', 'value' => $activeIndividualPro]]);
        foreach ($businessPlans as $key => $tier) {
            if ($key === 'free') {
                continue;
            }
            $count = $activeBusinesses->where('plan', $key)->count();
            $subscriptionPlans->push(['label' => $tier['label'], 'value' => $count]);
        }
        $subscriptionPlans = $subscriptionPlans->filter(fn ($p) => $p['value'] > 0)->values();

        return response()->json([
            'range' => ['from' => $from->toIso8601String(), 'to' => $to->toIso8601String()],
            'stats' => [
                'totalUsers' => ['value' => $totalUsers, 'change' => $this->pctChange($newUsersThis, $newUsersPrior), 'newThisPeriod' => $newUsersThis],
                'businessUsers' => ['value' => $businessUsersCount, 'change' => $this->pctChange($newBizUsersThis, $newBizUsersPrior), 'newThisPeriod' => $newBizUsersThis],
                'activeSubscriptions' => ['value' => $activeSubscriptions, 'change' => $this->pctChange($newSubsThis, $newSubsPrior), 'newThisPeriod' => $newSubsThis],
                'totalLeads' => ['value' => $totalLeads, 'change' => $this->pctChange($newLeadsThis, $newLeadsPrior), 'newThisPeriod' => $newLeadsThis],
            ],
            'dates' => $dates,
            'newUsersSeries' => $newUsersSeries,
            'leadsSeries' => $leadsSeries,
            'subscriptionsSeries' => $subscriptionsSeries,
            'revenueSeries' => $revenueSeries,
            'topLeadSources' => $topLeadSources,
            'subscriptionPlans' => $subscriptionPlans,
            'revenueBreakdown' => ['productSales' => $productSalesTotal, 'subscriptions' => $subscriptionRevenueTotal, 'total' => $productSalesTotal + $subscriptionRevenueTotal],
            'growth' => ['individuals' => $individualsGrowth, 'businesses' => $businessesGrowth, 'employees' => $employeesGrowth, 'cumulativeTotal' => $cumulativeUsersSeries],
        ]);
    }
}
