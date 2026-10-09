<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Profile;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(): JsonResponse
    {
        $proProfiles = Profile::where('plan', 'pro')->orderByDesc('plan_expires_at')->get();
        $businessSubs = Business::where('plan', '!=', 'free')->orderByDesc('plan_expires_at')->get();
        $successfulPayments = SubscriptionPayment::where('status', 'success')->orderByDesc('created_at')->get();
        $payments = SubscriptionPayment::orderByDesc('created_at')->limit(100)->get();
        $totalRevenue = (float) SubscriptionPayment::where('status', 'success')->sum('amount');

        $usersById = User::whereIn('id', $proProfiles->pluck('user_id'))->get()->keyBy('id');

        $profileStartDates = [];
        $businessStartDates = [];
        foreach ($successfulPayments as $payment) {
            if ($payment->profile_id && ! isset($profileStartDates[$payment->profile_id])) {
                $profileStartDates[$payment->profile_id] = $payment->created_at;
            }
            if ($payment->business_id && ! isset($businessStartDates[$payment->business_id])) {
                $businessStartDates[$payment->business_id] = $payment->created_at;
            }
        }

        $proProfilesOut = $proProfiles->map(fn (Profile $p) => [
            'id' => $p->id,
            'username' => $p->username,
            'displayName' => $p->name,
            'email' => $usersById->get($p->user_id)?->email,
            'planExpiresAt' => $p->plan_expires_at,
            'active' => ! $p->plan_expires_at || $p->plan_expires_at->isFuture(),
            'startDate' => $profileStartDates[$p->id] ?? null,
        ]);

        $businessSubsOut = $businessSubs->map(fn (Business $b) => [
            'id' => $b->id,
            'name' => $b->name,
            'email' => $b->email,
            'plan' => $b->plan,
            'planExpiresAt' => $b->plan_expires_at,
            'active' => ! $b->plan_expires_at || $b->plan_expires_at->isFuture(),
            'startDate' => $businessStartDates[$b->id] ?? null,
        ]);

        $profileIds = $payments->pluck('profile_id')->filter()->unique();
        $businessIds = $payments->pluck('business_id')->filter()->unique();
        $profilesById = $profileIds->isNotEmpty() ? Profile::whereIn('id', $profileIds)->get()->keyBy('id') : collect();
        $businessesById = $businessIds->isNotEmpty() ? Business::whereIn('id', $businessIds)->get()->keyBy('id') : collect();

        $paymentsOut = $payments->map(fn (SubscriptionPayment $p) => [
            'id' => $p->id,
            'plan' => $p->plan,
            'amount' => (float) $p->amount,
            'reference' => $p->reference,
            'status' => $p->status,
            'createdAt' => $p->created_at,
            'user' => $p->profile_id && $profilesById->has($p->profile_id) ? ['username' => $profilesById->get($p->profile_id)->username] : null,
            'business' => $p->business_id && $businessesById->has($p->business_id) ? ['name' => $businessesById->get($p->business_id)->name] : null,
        ]);

        return response()->json([
            'proUsers' => $proProfilesOut,
            'businessSubs' => $businessSubsOut,
            'payments' => $paymentsOut,
            'totalRevenue' => $totalRevenue,
        ]);
    }

    public function updateIndividual(Request $request, string $profileId): JsonResponse
    {
        $plan = $request->input('plan');
        if (! in_array($plan, ['free', 'pro'], true)) {
            return response()->json(['error' => 'plan must be free or pro'], 400);
        }

        $profile = Profile::find($profileId);
        if (! $profile) {
            return response()->json(['error' => 'Profile not found'], 404);
        }

        $planExpiresAt = $plan === 'free' ? null : ($request->input('planExpiresAt') ? $request->input('planExpiresAt') : null);

        $profile->update(['plan' => $plan, 'plan_expires_at' => $planExpiresAt]);

        return response()->json(['user' => [
            'id' => $profile->id,
            'username' => $profile->username,
            'displayName' => $profile->name,
            'email' => $profile->user?->email,
            'plan' => $profile->plan,
            'planExpiresAt' => $profile->plan_expires_at,
        ]]);
    }

    public function updateBusiness(Request $request, string $businessId): JsonResponse
    {
        $plan = $request->input('plan');
        if (! array_key_exists($plan, config('plans.business_plans'))) {
            return response()->json(['error' => 'Invalid business plan'], 400);
        }

        $business = Business::find($businessId);
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $planExpiresAt = $plan === 'free' ? null : ($request->input('planExpiresAt') ? $request->input('planExpiresAt') : null);

        $business->update(['plan' => $plan, 'plan_expires_at' => $planExpiresAt]);

        return response()->json(['business' => [
            'id' => $business->id,
            'name' => $business->name,
            'email' => $business->email,
            'plan' => $business->plan,
            'planExpiresAt' => $business->plan_expires_at,
        ]]);
    }
}
