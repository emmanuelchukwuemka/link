<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\NotifyService;
use App\Services\PaystackClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaystackClient $paystack,
        private readonly NotifyService $notify,
    ) {}

    /**
     * Paystack redirects the browser here after checkout. The frontend result
     * is never trusted — payment success is only recorded once verified
     * server-side against Paystack's API directly.
     */
    public function verify(Request $request): RedirectResponse
    {
        $reference = $request->query('reference') ?: $request->query('trxref');

        if (! $reference) {
            return redirect(config('app.url').'/marketplace');
        }

        $payment = Payment::where('reference', $reference)->first();
        if (! $payment) {
            return redirect(config('app.url').'/marketplace');
        }

        try {
            $result = $this->paystack->verifyTransaction($reference);

            if ($result['status'] === 'success') {
                $updatedOrder = DB::transaction(function () use ($reference, $result, $payment) {
                    $payment->update(['status' => 'success', 'raw_response' => json_encode($result)]);
                    Order::where('id', $payment->order_id)->update(['payment_status' => 'paid', 'status' => 'profile_setup_required']);

                    return Order::find($payment->order_id);
                });

                if ($updatedOrder?->user_id) {
                    $this->notify->notify(
                        $updatedOrder->user_id,
                        'ORDER_PAID',
                        'Payment confirmed',
                        "Your TapConnect order #{$updatedOrder->order_number} has been paid for. Set up your profile to continue.",
                        "/orders/{$updatedOrder->order_number}",
                    );
                }
            } else {
                $payment->update(['status' => 'failed', 'raw_response' => json_encode($result)]);
                $failedOrder = Order::find($payment->order_id);
                if ($failedOrder?->user_id) {
                    $this->notify->notify(
                        $failedOrder->user_id,
                        'PAYMENT_FAILED',
                        'Payment failed',
                        "We couldn't confirm payment for order #{$failedOrder->order_number}. Please try again.",
                        "/orders/{$failedOrder->order_number}",
                    );
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }

        $orderRow = Order::find($payment->order_id);
        $orderNumber = $orderRow?->order_number ?? $reference;

        return redirect(config('app.url')."/orders/{$orderNumber}");
    }
}
