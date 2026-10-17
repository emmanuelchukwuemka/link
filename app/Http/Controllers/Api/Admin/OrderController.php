<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private const VALID_STATUSES = [
        'order_placed', 'payment_confirmed', 'profile_setup_required', 'profile_completed',
        'preparing', 'in_production', 'quality_check', 'shipped', 'out_for_delivery',
        'delivered', 'activated',
    ];

    private const PRODUCTION_STATUSES = [
        'preparing', 'in_production', 'quality_check', 'shipped', 'out_for_delivery', 'delivered', 'activated',
    ];

    public function index(): JsonResponse
    {
        $orders = Order::orderByDesc('created_at')->with(['items.product', 'payments'])->get();

        return response()->json(['orders' => $orders]);
    }

    public function update(Request $request, string $orderNumber, NotifyService $notify): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->first();
        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $data = [];
        $status = $request->input('status');

        if ($status !== null) {
            if (! in_array($status, self::VALID_STATUSES, true)) {
                return response()->json(['error' => 'Invalid status'], 400);
            }
            if (in_array($status, self::PRODUCTION_STATUSES, true) && $order->profile_setup_required) {
                return response()->json(['error' => 'This order cannot move into production until the customer completes their profile setup.'], 409);
            }
            $data['status'] = $status;
            if ($status === 'shipped') {
                $data['shipped_at'] = now();
            }
            if ($status === 'delivered') {
                $data['delivered_at'] = now();
            }
        }

        if ($request->has('courierName')) {
            $data['courier_name'] = $request->input('courierName');
        }
        if ($request->has('trackingNumber')) {
            $data['tracking_number'] = $request->input('trackingNumber');
        }

        $order->update($data);

        if ($status !== null && $order->user_id) {
            $notify->notify(
                $order->user_id,
                'ORDER_STATUS_CHANGED',
                "Order #{$order->order_number} update",
                'Your TapConnect order is now: '.str_replace('_', ' ', $status).'.',
                "/orders/{$order->order_number}",
            );
        }

        return response()->json(['order' => $order->fresh()]);
    }

    /**
     * Bulk (or single, via a 1-item array) permanent delete. payments.order_id
     * is restrictOnDelete, so those rows have to go first; order_items cascades
     * on its own. cards.order_id has no FK constraint at all (by design, matching
     * the old schema), so a claimed card just keeps a now-dangling order_id -
     * harmless, nothing reads through that reference.
     */
    public function destroy(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (! is_array($ids) || empty($ids)) {
            return response()->json(['error' => 'No orders selected'], 400);
        }

        $orders = Order::whereIn('id', $ids)->get();

        DB::transaction(function () use ($orders) {
            foreach ($orders as $order) {
                Payment::where('order_id', $order->id)->delete();
                $order->delete();
            }
        });

        return response()->json(['deleted' => $orders->count()]);
    }
}
