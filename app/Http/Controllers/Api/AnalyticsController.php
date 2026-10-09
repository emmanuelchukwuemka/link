<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\Lead;
use App\Models\Profile;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    private const ALLOWED_TYPES = [
        'PROFILE_VIEW', 'NFC_TAP', 'QR_SCAN', 'CONTACT_SAVE', 'PHONE_CLICK',
        'WHATSAPP_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'SOCIAL_CLICK',
        'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_STARTED', 'ORDER_CREATED',
        'LEAD_CREATED', 'BOOKING_REQUEST', 'SERVICE_REQUEST',
    ];

    public function track(Request $request): JsonResponse
    {
        $username = $request->input('username');
        $type = $request->input('type');
        $meta = $request->input('meta');

        if (! $username || ! $type || ! in_array($type, self::ALLOWED_TYPES, true)) {
            return response()->json(['error' => 'Invalid event'], 400);
        }

        $profile = Profile::where('username', $username)->first();
        if (! $profile) {
            return response()->json(['error' => 'Profile not found'], 404);
        }

        AnalyticsEvent::create([
            'user_id' => $profile->user_id,
            'profile_id' => $profile->id,
            'type' => $type,
            'meta' => $meta ? substr(json_encode($meta), 0, 2000) : null,
        ]);

        return response()->json(['ok' => true], 201);
    }

    private function rangeStart(?string $range): ?Carbon
    {
        return match ($range) {
            'today' => Carbon::today(),
            '7d' => Carbon::now()->subDays(7),
            '30d' => Carbon::now()->subDays(30),
            default => null,
        };
    }

    public function summary(Request $request): JsonResponse
    {
        $profileId = Profile::active($request->user())->id;
        $range = $request->query('range');
        $since = $this->rangeStart($range);

        $query = AnalyticsEvent::where('profile_id', $profileId);
        if ($since) {
            $query->where('created_at', '>=', $since);
        }
        $counts = $query->selectRaw('type, COUNT(*) as c')->groupBy('type')->pluck('c', 'type');

        $leadQuery = Lead::where('profile_id', $profileId);
        if ($since) {
            $leadQuery->where('created_at', '>=', $since);
        }
        $leadCount = $leadQuery->count();

        $views = (int) ($counts['PROFILE_VIEW'] ?? 0);
        $clicks = collect(['CONTACT_SAVE', 'PHONE_CLICK', 'WHATSAPP_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'SOCIAL_CLICK'])
            ->sum(fn ($t) => (int) ($counts[$t] ?? 0));

        return response()->json([
            'range' => $range ?: 'lifetime',
            'views' => $views,
            'nfcTaps' => (int) ($counts['NFC_TAP'] ?? 0),
            'qrScans' => (int) ($counts['QR_SCAN'] ?? 0),
            'clicks' => $clicks,
            'contactSaves' => (int) ($counts['CONTACT_SAVE'] ?? 0),
            'whatsappClicks' => (int) ($counts['WHATSAPP_CLICK'] ?? 0),
            'phoneClicks' => (int) ($counts['PHONE_CLICK'] ?? 0),
            'emailClicks' => (int) ($counts['EMAIL_CLICK'] ?? 0),
            'websiteClicks' => (int) ($counts['WEBSITE_CLICK'] ?? 0),
            'socialClicks' => (int) ($counts['SOCIAL_CLICK'] ?? 0),
            'productViews' => (int) ($counts['PRODUCT_VIEW'] ?? 0),
            'addToCart' => (int) ($counts['ADD_TO_CART'] ?? 0),
            'leads' => $leadCount,
            'ctr' => $views > 0 ? round(($clicks / $views) * 1000) / 10 : 0,
        ]);
    }
}
