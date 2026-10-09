<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\Business;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Profile;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    private const ORDER_STATUS_GROUPS = [
        'order_placed' => 'pending',
        'payment_confirmed' => 'pending',
        'profile_setup_required' => 'pending',
        'profile_completed' => 'pending',
        'preparing' => 'processing',
        'in_production' => 'processing',
        'quality_check' => 'processing',
        'shipped' => 'shipped',
        'out_for_delivery' => 'shipped',
        'delivered' => 'delivered',
        'activated' => 'delivered',
    ];

    private function pctChange(float $current, float $previous): float
    {
        if ($previous == 0.0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 1000) / 10;
    }

    /** Groups a date-ranged query by calendar day, returning a [date-string => count/sum] map. */
    private function dailyMap(\Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder $query, Carbon $from, Carbon $to, string $column, string $agg = 'count'): array
    {
        $select = $agg === 'sum' ? "DATE(created_at) as d, SUM({$column}) as v" : 'DATE(created_at) as d, COUNT(*) as v';

        return $query->whereBetween('created_at', [$from, $to])
            ->selectRaw($select)
            ->groupBy('d')
            ->pluck('v', 'd')
            ->toArray();
    }

    private function seriesFromMap(array $dates, array $map): array
    {
        return array_map(fn ($d) => (float) ($map[$d] ?? 0), $dates);
    }

    public function __invoke(): JsonResponse
    {
        try {
            $now = Carbon::now();
            $periodStart = $now->copy()->subDays(30);
            $prevPeriodStart = $now->copy()->subDays(60);

            $totalUsers = User::count();
            $totalBusinesses = Business::count();
            $totalEmployees = User::where('account_type', 'employee')->count();
            $totalOrdersPaid = Order::where('payment_status', 'paid')->count();

            $cardsSoldSum = (int) OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.payment_status', 'paid')
                ->sum('order_items.quantity');

            $revenueOrdersSum = (float) Order::where('payment_status', 'paid')->sum('total');
            $revenueSubsSum = (float) SubscriptionPayment::where('status', 'success')->sum('amount');
            $totalRevenue = $revenueOrdersSum + $revenueSubsSum;

            $currentUsers = User::where('created_at', '>=', $periodStart)->count();
            $previousUsers = User::whereBetween('created_at', [$prevPeriodStart, $periodStart])->count();

            $currentBusinesses = Business::where('created_at', '>=', $periodStart)->count();
            $previousBusinesses = Business::whereBetween('created_at', [$prevPeriodStart, $periodStart])->count();

            $currentEmployees = User::where('account_type', 'employee')->where('created_at', '>=', $periodStart)->count();
            $previousEmployees = User::where('account_type', 'employee')->whereBetween('created_at', [$prevPeriodStart, $periodStart])->count();

            $currentOrders = Order::where('payment_status', 'paid')->where('created_at', '>=', $periodStart)->count();
            $previousOrders = Order::where('payment_status', 'paid')->whereBetween('created_at', [$prevPeriodStart, $periodStart])->count();

            $currentCards = (int) OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.payment_status', 'paid')->where('orders.created_at', '>=', $periodStart)
                ->sum('order_items.quantity');
            $previousCards = (int) OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.payment_status', 'paid')->whereBetween('orders.created_at', [$prevPeriodStart, $periodStart])
                ->sum('order_items.quantity');

            $currentOrderRevenue = (float) Order::where('payment_status', 'paid')->where('created_at', '>=', $periodStart)->sum('total');
            $previousOrderRevenue = (float) Order::where('payment_status', 'paid')->whereBetween('created_at', [$prevPeriodStart, $periodStart])->sum('total');
            $currentSubRevenue = (float) SubscriptionPayment::where('status', 'success')->where('created_at', '>=', $periodStart)->sum('amount');
            $previousSubRevenue = (float) SubscriptionPayment::where('status', 'success')->whereBetween('created_at', [$prevPeriodStart, $periodStart])->sum('amount');
            $currentRevenue = $currentOrderRevenue + $currentSubRevenue;
            $previousRevenue = $previousOrderRevenue + $previousSubRevenue;

            // 7-day daily buckets
            $days7 = [];
            for ($i = 6; $i >= 0; $i--) {
                $days7[] = $now->copy()->subDays($i)->toDateString();
            }
            $start7 = Carbon::parse($days7[0])->startOfDay();
            $end7 = $now->copy()->endOfDay();

            $usersMap = $this->dailyMap(User::query(), $start7, $end7, 'id');
            $individualsMap = $this->dailyMap(User::where('account_type', 'individual'), $start7, $end7, 'id');
            $businessesMap7 = $this->dailyMap(User::where('account_type', 'business_admin'), $start7, $end7, 'id');
            $employeesMap7 = $this->dailyMap(User::where('account_type', 'employee'), $start7, $end7, 'id');
            $ordersMap = $this->dailyMap(Order::where('payment_status', 'paid'), $start7, $end7, 'id');
            $cardsMap = $this->dailyMap(
                OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')->where('orders.payment_status', 'paid'),
                $start7, $end7, 'order_items.quantity', 'sum',
            );
            $paymentsMap7 = $this->dailyMap(Payment::where('status', 'success'), $start7, $end7, 'amount', 'sum');
            $subsMap7 = $this->dailyMap(SubscriptionPayment::where('status', 'success'), $start7, $end7, 'amount', 'sum');

            $usersSeries = $this->seriesFromMap($days7, $usersMap);
            $individualsSeries = $this->seriesFromMap($days7, $individualsMap);
            $businessesSeries = $this->seriesFromMap($days7, $businessesMap7);
            $employeesSeries = $this->seriesFromMap($days7, $employeesMap7);
            $ordersSeries = $this->seriesFromMap($days7, $ordersMap);
            $cardsSeries = $this->seriesFromMap($days7, $cardsMap);
            $revenueSeries7 = array_map(fn ($d) => (float) ($paymentsMap7[$d] ?? 0) + (float) ($subsMap7[$d] ?? 0), $days7);

            // 30-day daily buckets for revenue breakdown
            $days30 = [];
            for ($i = 29; $i >= 0; $i--) {
                $days30[] = $now->copy()->subDays($i)->toDateString();
            }
            $start30 = Carbon::parse($days30[0])->startOfDay();
            $end30 = $now->copy()->endOfDay();

            $paymentsMap30 = $this->dailyMap(Payment::where('status', 'success'), $start30, $end30, 'amount', 'sum');
            $subsMap30 = $this->dailyMap(SubscriptionPayment::where('status', 'success'), $start30, $end30, 'amount', 'sum');
            $productSalesBuckets30 = $this->seriesFromMap($days30, $paymentsMap30);
            $subsBuckets30 = $this->seriesFromMap($days30, $subsMap30);

            $recentUserModels = User::orderByDesc('created_at')->limit(5)->get();
            $recentUserProfiles = Profile::whereIn('user_id', $recentUserModels->pluck('id'))->oldest()->get()->unique('user_id')->keyBy('user_id');
            $recentUsers = $recentUserModels->map(function (User $u) use ($recentUserProfiles) {
                $username = $recentUserProfiles->get($u->id)?->username;

                return [
                    'id' => $u->id,
                    'name' => $u->name ?: $username,
                    'username' => $username,
                    'email' => $u->email,
                    'accountType' => $u->account_type,
                    'createdAt' => $u->created_at,
                    'isActive' => $u->is_active,
                ];
            });

            $recentOrders = Order::orderByDesc('created_at')->limit(5)->with('items.product')->get()->map(function (Order $o) {
                $names = $o->items->map(fn (OrderItem $i) => $i->product?->name)->filter()->values();
                $summary = '—';
                if ($names->count() === 1) {
                    $summary = $names[0];
                } elseif ($names->count() > 1) {
                    $summary = $names[0].' +'.($names->count() - 1).' more';
                }

                return [
                    'id' => $o->id,
                    'orderNumber' => $o->order_number,
                    'customerName' => $o->customer_name,
                    'total' => (float) $o->total,
                    'status' => $o->status,
                    'productSummary' => $summary,
                ];
            });

            $paidOrderItems = OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.payment_status', 'paid')
                ->select('order_items.product_id', 'order_items.quantity', 'order_items.unit_price')
                ->get();

            $productAgg = [];
            foreach ($paidOrderItems as $item) {
                $pid = $item->product_id;
                if (! isset($productAgg[$pid])) {
                    $productAgg[$pid] = ['unitsSold' => 0, 'revenue' => 0.0];
                }
                $productAgg[$pid]['unitsSold'] += (int) $item->quantity;
                $productAgg[$pid]['revenue'] += (float) $item->quantity * (float) $item->unit_price;
            }

            uasort($productAgg, fn ($a, $b) => $b['unitsSold'] <=> $a['unitsSold']);
            $topProductIds = array_slice(array_keys($productAgg), 0, 5);
            $topProductModels = Product::whereIn('id', $topProductIds)->get()->keyBy('id');

            $topProducts = collect($topProductIds)->map(function ($pid) use ($productAgg, $topProductModels) {
                $product = $topProductModels->get($pid);
                $images = $product?->images ? json_decode($product->images, true) : [];

                return [
                    'id' => $pid,
                    'name' => $product?->name,
                    'image' => $images[0] ?? null,
                    'unitsSold' => $productAgg[$pid]['unitsSold'],
                    'revenue' => $productAgg[$pid]['revenue'],
                ];
            })->values();

            $active = 0;
            $expiringSoon = 0;
            $expired = 0;
            $proUsers = Profile::where('plan', '!=', 'free')->get(['plan_expires_at']);
            $paidBusinesses = Business::where('plan', '!=', 'free')->get(['plan_expires_at']);
            /** @var Collection $allPaid */
            $allPaid = $proUsers->concat($paidBusinesses);
            foreach ($allPaid as $entity) {
                $expiresAt = $entity->plan_expires_at;
                if (! $expiresAt) {
                    $active++;
                } elseif ($expiresAt->lessThanOrEqualTo($now)) {
                    $expired++;
                } elseif ($expiresAt->lessThanOrEqualTo($now->copy()->addDays(14))) {
                    $expiringSoon++;
                } else {
                    $active++;
                }
            }

            $orderStatusOverview = ['pending' => 0, 'processing' => 0, 'shipped' => 0, 'delivered' => 0];
            $allOrderStatuses = Order::pluck('status');
            foreach ($allOrderStatuses as $status) {
                $group = self::ORDER_STATUS_GROUPS[$status] ?? null;
                if ($group) {
                    $orderStatusOverview[$group]++;
                }
            }

            $eventCounts = AnalyticsEvent::selectRaw('type, COUNT(*) as c')->groupBy('type')->pluck('c', 'type');
            $nfcTap = (int) ($eventCounts['NFC_TAP'] ?? 0);
            $qrCode = (int) ($eventCounts['QR_SCAN'] ?? 0);
            $profileViews = (int) ($eventCounts['PROFILE_VIEW'] ?? 0);
            $website = max($profileViews - $nfcTap - $qrCode, 0);

            return response()->json([
                'stats' => [
                    'users' => ['value' => $totalUsers, 'change' => $this->pctChange($currentUsers, $previousUsers), 'series' => $usersSeries],
                    'businesses' => ['value' => $totalBusinesses, 'change' => $this->pctChange($currentBusinesses, $previousBusinesses), 'series' => $businessesSeries],
                    'employees' => ['value' => $totalEmployees, 'change' => $this->pctChange($currentEmployees, $previousEmployees), 'series' => $employeesSeries],
                    'orders' => ['value' => $totalOrdersPaid, 'change' => $this->pctChange($currentOrders, $previousOrders), 'series' => $ordersSeries],
                    'cardsSold' => ['value' => $cardsSoldSum, 'change' => $this->pctChange($currentCards, $previousCards), 'series' => $cardsSeries],
                    'revenue' => ['value' => $totalRevenue, 'change' => $this->pctChange($currentRevenue, $previousRevenue), 'series' => $revenueSeries7],
                ],
                'revenueChart' => ['dates' => $days30, 'productSales' => $productSalesBuckets30, 'subscriptions' => $subsBuckets30],
                'userGrowthChart' => ['dates' => $days7, 'individuals' => $individualsSeries, 'businesses' => $businessesSeries, 'employees' => $employeesSeries],
                'recentUsers' => $recentUsers,
                'recentOrders' => $recentOrders,
                'topProducts' => $topProducts,
                'subscriptionOverview' => ['active' => $active, 'expiringSoon' => $expiringSoon, 'expired' => $expired, 'total' => $active + $expiringSoon + $expired],
                'orderStatusOverview' => $orderStatusOverview,
                'trafficSources' => ['nfcTap' => $nfcTap, 'qrCode' => $qrCode, 'website' => $website, 'total' => $nfcTap + $qrCode + $website],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
