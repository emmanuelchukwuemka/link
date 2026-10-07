<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotifyService;
use App\Services\PaystackClient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly PaystackClient $paystack,
        private readonly NotifyService $notify,
    ) {}

    public function checkout(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $this->paystack->isConfigured()) {
            return response()->json(['error' => 'Payment processing is not available right now. Please try again later.'], 503);
        }

        $reference = "SUB-{$user->id}-".round(microtime(true) * 1000);

        try {
            $tx = $this->paystack->initializeTransaction(
                $user->email,
                (float) config('plans.pro_plan_price_naira'),
                $reference,
                config('app.url').'/api/subscriptions/verify',
            );

            return response()->json(['authorizationUrl' => $tx['authorization_url']]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function verify(Request $request): RedirectResponse
    {
        $reference = $request->query('reference') ?: $request->query('trxref');
        $dashboardUrl = config('app.url').'/dashboard/subscription';

        if (! $reference || ! str_starts_with($reference, 'SUB-')) {
            return redirect($dashboardUrl);
        }

        $userId = (int) explode('-', $reference)[1];

        try {
            $result = $this->paystack->verifyTransaction($reference);

            if ($result['status'] === 'success') {
                $user = \App\Models\User::find($userId);
                if ($user) {
                    $base = ($user->plan_expires_at && $user->plan_expires_at->isFuture()) ? $user->plan_expires_at : Carbon::now();
                    $newExpiry = $base->copy()->addYear();

                    $user->update(['plan' => 'pro', 'plan_expires_at' => $newExpiry]);

                    try {
                        \App\Models\SubscriptionPayment::create([
                            'user_id' => $userId,
                            'plan' => 'pro',
                            'amount' => config('plans.pro_plan_price_naira'),
                            'reference' => $reference,
                            'status' => 'success',
                            'raw_response' => json_encode($result),
                        ]);
                    } catch (\Throwable) {
                        // Non-fatal — mirrors the old app's best-effort payment-log insert.
                    }

                    $this->notify->notify(
                        $userId,
                        'SUBSCRIPTION_ACTIVATED',
                        'You are now on Pro',
                        'Your TapConnect Pro subscription is active. Enjoy the extra customization, analytics and lead capture.',
                        '/dashboard/subscription',
                    );

                    return redirect($dashboardUrl.'?upgraded=1');
                }
            }

            $this->notify->notify(
                $userId,
                'PAYMENT_FAILED',
                'Payment failed',
                'We could not confirm your Pro subscription payment. Please try again.',
                '/dashboard/subscription',
            );

            return redirect($dashboardUrl.'?failed=1');
        } catch (\Throwable $e) {
            report($e);

            return redirect($dashboardUrl.'?failed=1');
        }
    }
}
