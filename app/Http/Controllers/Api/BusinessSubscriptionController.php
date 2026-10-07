<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\SubscriptionPayment;
use App\Services\NotifyService;
use App\Services\PaystackClient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BusinessSubscriptionController extends Controller
{
    public function __construct(
        private readonly PaystackClient $paystack,
        private readonly NotifyService $notify,
    ) {}

    public function checkout(Request $request): JsonResponse
    {
        $business = Business::where('owner_id', $request->user()->id)->first();
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $plan = $request->input('plan');
        $planConfig = config('plans.business_plans')[$plan] ?? null;
        if (! $planConfig || $planConfig['price_naira'] === null) {
            return response()->json(['error' => 'Invalid plan. Contact sales for Enterprise.'], 400);
        }

        if (! $this->paystack->isConfigured()) {
            return response()->json(['error' => 'Payment processing is not available right now. Please try again later.'], 503);
        }

        $reference = 'BIZSUB-'.round(microtime(true) * 1000).'-'.bin2hex(random_bytes(3));

        try {
            $tx = $this->paystack->initializeTransaction(
                $request->user()->email,
                (float) $planConfig['price_naira'],
                $reference,
                config('app.url').'/api/business/subscriptions/verify',
            );

            SubscriptionPayment::create([
                'business_id' => $business->id,
                'plan' => $plan,
                'amount' => $planConfig['price_naira'],
                'reference' => $reference,
                'status' => 'pending',
            ]);

            return response()->json(['authorizationUrl' => $tx['authorization_url']]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function verify(Request $request): RedirectResponse
    {
        $reference = $request->query('reference') ?: $request->query('trxref');
        $dashboardUrl = config('app.url').'/dashboard/business';

        if (! $reference) {
            return redirect($dashboardUrl);
        }

        $pending = SubscriptionPayment::where('reference', $reference)->first();
        if (! $pending || ! $pending->business_id) {
            return redirect($dashboardUrl);
        }

        try {
            $result = $this->paystack->verifyTransaction($reference);

            if ($result['status'] === 'success') {
                $business = Business::find($pending->business_id);
                if ($business) {
                    $base = ($business->plan_expires_at && $business->plan_expires_at->isFuture()) ? $business->plan_expires_at : Carbon::now();
                    $business->update(['plan' => $pending->plan, 'plan_expires_at' => $base->copy()->addYear()]);
                    $pending->update(['status' => 'success', 'raw_response' => json_encode($result)]);

                    $this->notify->notify(
                        $business->owner_id,
                        'SUBSCRIPTION_ACTIVATED',
                        'Business plan upgraded',
                        "Your business is now on the {$pending->plan} plan.",
                        '/dashboard/business',
                    );

                    return redirect($dashboardUrl.'?upgraded=1');
                }
            }

            $pending->update(['status' => 'failed', 'raw_response' => json_encode($result)]);

            return redirect($dashboardUrl.'?failed=1');
        } catch (\Throwable $e) {
            report($e);

            return redirect($dashboardUrl.'?failed=1');
        }
    }
}
