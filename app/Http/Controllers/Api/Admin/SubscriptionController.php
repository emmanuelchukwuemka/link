<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(): JsonResponse
    {
        $proUsers = User::where('plan', 'pro')->orderByDesc('plan_expires_at')->get();
        $businessSubs = Business::where('plan', '!=', 'free')->orderByDesc('plan_expires_at')->get();
        $successfulPayments = SubscriptionPayment::where('status', 'success')->orderByDesc('created_at')->get();
        $payments = SubscriptionPayment::orderByDesc('created_at')->limit(100)->get();
        $totalRevenue = (float) SubscriptionPayment::where('status', 'success')->sum('amount');

        $now = now();

        $userStartDates = [];
        $businessStartDates = [];
        foreach ($successfulPayments as $payment) {
            if ($payment->user_id && ! isset($userStartDates[$payment->user_id])) {
                $userStartDates[$payment->user_id] = $payment->created_at;
            }
            if ($payment->business_id && ! isset($businessStartDates[$payment->business_id])) {
                $businessStartDates[$payment->business_id] = $payment->created_at;
            }
        }

        $proUsersOut = $proUsers->map(fn (User $u) => [
            'id' => $u->id,
            'username' => $u->username,
            'displayName' => $u->name,
            'email' => $u->email,
            'planExpiresAt' => $u->plan_expires_at,
            'active' => ! $u->plan_expires_at || $u->plan_expires_at->isFuture(),
            'startDate' => $userStartDates[$u->id] ?? null,
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

        $userIds = $payments->pluck('user_id')->filter()->unique();
        $businessIds = $payments->pluck('business_id')->filter()->unique();
        $usersById = $userIds->isNotEmpty() ? User::whereIn('id', $userIds)->get()->keyBy('id') : collect();
        $businessesById = $businessIds->isNotEmpty() ? Business::whereIn('id', $businessIds)->get()->keyBy('id') : collect();

        $paymentsOut = $payments->map(fn (SubscriptionPayment $p) => [
            'id' => $p->id,
            'plan' => $p->plan,
            'amount' => (float) $p->amount,
            'reference' => $p->reference,
            'status' => $p->status,
            'createdAt' => $p->created_at,
            'user' => $p->user_id && $usersById->has($p->user_id) ? ['username' => $usersById->get($p->user_id)->username] : null,
            'business' => $p->business_id && $businessesById->has($p->business_id) ? ['name' => $businessesById->get($p->business_id)->name] : null,
        ]);

        return response()->json([
            'proUsers' => $proUsersOut,
            'businessSubs' => $businessSubsOut,
            'payments' => $paymentsOut,
            'totalRevenue' => $totalRevenue,
        ]);
    }

    public function updateIndividual(Request $request, string $userId): JsonResponse
    {
        $plan = $request->input('plan');
        if (! in_array($plan, ['free', 'pro'], true)) {
            return response()->json(['error' => 'plan must be free or pro'], 400);
        }

        $user = User::find($userId);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }
        if ($user->account_type !== 'individual') {
            return response()->json(['error' => 'Only individual accounts can have a Pro subscription'], 400);
        }

        $planExpiresAt = $plan === 'free' ? null : ($request->input('planExpiresAt') ? $request->input('planExpiresAt') : null);

        $user->update(['plan' => $plan, 'plan_expires_at' => $planExpiresAt]);

        return response()->json(['user' => [
            'id' => $user->id,
            'username' => $user->username,
            'displayName' => $user->name,
            'email' => $user->email,
            'plan' => $user->plan,
            'planExpiresAt' => $user->plan_expires_at,
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
