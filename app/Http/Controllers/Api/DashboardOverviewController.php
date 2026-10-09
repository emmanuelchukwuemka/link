<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\Card;
use App\Models\Lead;
use App\Models\Link;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Profile;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardOverviewController extends Controller
{
    private const CLICK_TYPES = ['CONTACT_SAVE', 'PHONE_CLICK', 'WHATSAPP_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'SOCIAL_CLICK'];

    private const ACTIVITY_LABELS = [
        'PROFILE_VIEW' => 'New profile view',
        'NFC_TAP' => 'NFC card tapped',
        'QR_SCAN' => 'QR code scanned',
        'CONTACT_SAVE' => 'Contact saved',
        'PHONE_CLICK' => 'Phone number clicked',
        'WHATSAPP_CLICK' => 'WhatsApp clicked',
        'EMAIL_CLICK' => 'Email clicked',
        'WEBSITE_CLICK' => 'Link clicked (Website)',
        'PRODUCT_VIEW' => 'Product viewed',
        'ADD_TO_CART' => 'Product order started',
        'LEAD_CREATED' => 'New lead received',
        'SERVICE_REQUEST' => 'Service enquiry received',
    ];

    private function pctChange(int $current, int $previous): float
    {
        if ($previous === 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 1000) / 10;
    }

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $profileId = Profile::active($user)->id;

        $now = Carbon::now();
        $sevenDaysAgo = $now->copy()->subDays(7);
        $fourteenDaysAgo = $now->copy()->subDays(14);

        $currentCounts = AnalyticsEvent::where('profile_id', $profileId)
            ->where('created_at', '>=', $sevenDaysAgo)
            ->selectRaw('type, COUNT(*) as c')
            ->groupBy('type')
            ->pluck('c', 'type');

        $previousCounts = AnalyticsEvent::where('profile_id', $profileId)
            ->whereBetween('created_at', [$fourteenDaysAgo, $sevenDaysAgo])
            ->selectRaw('type, COUNT(*) as c')
            ->groupBy('type')
            ->pluck('c', 'type');

        $currentLeads = Lead::where('profile_id', $profileId)->where('created_at', '>=', $sevenDaysAgo)->count();
        $previousLeads = Lead::where('profile_id', $profileId)->whereBetween('created_at', [$fourteenDaysAgo, $sevenDaysAgo])->count();

        $currClicks = collect(self::CLICK_TYPES)->sum(fn ($t) => (int) ($currentCounts[$t] ?? 0));
        $prevClicks = collect(self::CLICK_TYPES)->sum(fn ($t) => (int) ($previousCounts[$t] ?? 0));

        $stats = [
            'views' => ['value' => (int) ($currentCounts['PROFILE_VIEW'] ?? 0), 'change' => $this->pctChange((int) ($currentCounts['PROFILE_VIEW'] ?? 0), (int) ($previousCounts['PROFILE_VIEW'] ?? 0))],
            'nfcTaps' => ['value' => (int) ($currentCounts['NFC_TAP'] ?? 0), 'change' => $this->pctChange((int) ($currentCounts['NFC_TAP'] ?? 0), (int) ($previousCounts['NFC_TAP'] ?? 0))],
            'linkClicks' => ['value' => $currClicks, 'change' => $this->pctChange($currClicks, $prevClicks)],
            'leads' => ['value' => $currentLeads, 'change' => $this->pctChange($currentLeads, $previousLeads)],
        ];

        // 7-day daily series for each headline stat.
        $sevenDayEvents = AnalyticsEvent::where('profile_id', $profileId)->where('created_at', '>=', $sevenDaysAgo)->get(['type', 'created_at']);
        $sevenDayLeads = Lead::where('profile_id', $profileId)->where('created_at', '>=', $sevenDaysAgo)->get(['created_at']);

        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $days[] = $now->copy()->subDays($i)->toDateString();
        }
        $viewBuckets = array_fill_keys($days, 0);
        $nfcBuckets = array_fill_keys($days, 0);
        $clickBuckets = array_fill_keys($days, 0);
        $leadBuckets = array_fill_keys($days, 0);

        foreach ($sevenDayEvents as $e) {
            $key = $e->created_at->toDateString();
            if (! array_key_exists($key, $viewBuckets)) {
                continue;
            }
            if ($e->type === 'PROFILE_VIEW') {
                $viewBuckets[$key]++;
            } elseif ($e->type === 'NFC_TAP') {
                $nfcBuckets[$key]++;
            } elseif (in_array($e->type, self::CLICK_TYPES, true)) {
                $clickBuckets[$key]++;
            }
        }
        foreach ($sevenDayLeads as $l) {
            $key = $l->created_at->toDateString();
            if (array_key_exists($key, $leadBuckets)) {
                $leadBuckets[$key]++;
            }
        }

        $series = [
            'views' => array_values($viewBuckets),
            'nfcTaps' => array_values($nfcBuckets),
            'linkClicks' => array_values($clickBuckets),
            'leads' => array_values($leadBuckets),
            'dates' => $days,
        ];

        // Top links: blend of custom Link clicks and named contact-action types.
        $links = Link::where('profile_id', $profileId)->orderByDesc('clicks')->limit(5)->get();
        $topLinks = collect([
            ...$links->filter(fn ($l) => $l->clicks > 0)->map(fn ($l) => ['label' => $l->title ?: 'Untitled Link', 'value' => $l->clicks])->values()->all(),
            ['label' => 'WhatsApp', 'value' => (int) ($currentCounts['WHATSAPP_CLICK'] ?? 0)],
            ['label' => 'Website', 'value' => (int) ($currentCounts['WEBSITE_CLICK'] ?? 0)],
            ['label' => 'Products', 'value' => (int) ($currentCounts['PRODUCT_VIEW'] ?? 0)],
            ['label' => 'Email', 'value' => (int) ($currentCounts['EMAIL_CLICK'] ?? 0)],
            ['label' => 'Phone', 'value' => (int) ($currentCounts['PHONE_CLICK'] ?? 0)],
        ])
            ->filter(fn ($l) => $l['value'] > 0)
            ->sortByDesc('value')
            ->take(5)
            ->values();

        $recentEvents = AnalyticsEvent::where('profile_id', $profileId)->orderByDesc('created_at')->limit(8)->get();
        $recentLeads = Lead::where('profile_id', $profileId)->orderByDesc('created_at')->limit(3)->get();

        $activity = collect([
            ...$recentEvents->map(fn ($e) => [
                'id' => 'event-'.$e->id,
                'label' => self::ACTIVITY_LABELS[$e->type] ?? $e->type,
                'createdAt' => $e->created_at,
            ]),
            ...$recentLeads->map(fn ($l) => ['id' => 'lead-'.$l->id, 'label' => 'New lead received', 'createdAt' => $l->created_at]),
        ])
            ->sortByDesc('createdAt')
            ->take(6)
            ->values();

        $recentOrders = Order::where('user_id', $user->id)->orderByDesc('created_at')->limit(3)->get();
        $orderItems = $recentOrders->isNotEmpty()
            ? OrderItem::with('product')->whereIn('order_id', $recentOrders->pluck('id'))->get()
            : collect();

        return response()->json([
            'stats' => $stats,
            'series' => $series,
            'topLinks' => $topLinks,
            'activity' => $activity,
            'orders' => $recentOrders->map(fn ($o) => [
                'id' => $o->id,
                'orderNumber' => $o->order_number,
                'status' => $o->status,
                'createdAt' => $o->created_at,
                'items' => $orderItems->where('order_id', $o->id)->map(fn ($i) => ['name' => $i->product?->name, 'quantity' => $i->quantity])->values(),
            ]),
            'cardCount' => Card::where('profile_id', $profileId)->count(),
        ]);
    }
}
