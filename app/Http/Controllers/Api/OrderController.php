<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Services\OrderNumberGenerator;
use App\Services\PaystackClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with('items.product')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function store(Request $request, PaystackClient $paystack): JsonResponse
    {
        $items = $request->input('items');
        $customerName = $request->input('customerName');
        $customerEmail = $request->input('customerEmail');
        $customerPhone = $request->input('customerPhone');
        $state = $request->input('state');
        $city = $request->input('city');
        $address = $request->input('address');
        $deliveryInstructions = $request->input('deliveryInstructions');

        if (! $items || ! is_array($items) || count($items) === 0 || ! $customerName || ! $customerEmail || ! $customerPhone || ! $state || ! $city || ! $address) {
            return response()->json(['error' => 'Missing required fields'], 400);
        }

        $productIds = collect($items)->pluck('productId')->unique();
        $productMap = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $subtotal = 0;
        $orderItemsData = [];
        foreach ($items as $item) {
            $product = $productMap->get($item['productId'] ?? null);
            if (! $product) {
                return response()->json(['error' => "Product {$item['productId']} not found"], 400);
            }
            $qty = max(1, min(1000, (int) ($item['quantity'] ?? 1)));
            $customization = ! empty($item['customization']);
            $unitPrice = (float) ($product->price_sale ?? $product->price_regular) + ($customization ? (float) $product->customization_price : 0);
            $subtotal += $unitPrice * $qty;

            $orderItemsData[] = [
                'product_id' => $product->id,
                'color' => $item['color'] ?? null,
                'customization' => $customization,
                'customization_notes' => $customization ? mb_substr((string) ($item['customizationNotes'] ?? ''), 0, 2000) ?: null : null,
                'customization_file_url' => $customization ? ($item['customizationFileUrl'] ?? null) : null,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
            ];
        }

        $zone = DeliveryZone::where('name', $city)->first() ?? DeliveryZone::where('name', 'Other')->first();
        $deliveryFee = $zone ? (float) $zone->fee : ($subtotal >= 30000 ? 0 : 3500);
        $total = $subtotal + $deliveryFee;
        $orderNumber = OrderNumberGenerator::generate();

        $order = DB::transaction(function () use ($orderNumber, $request, $customerName, $customerEmail, $customerPhone, $state, $city, $address, $deliveryInstructions, $deliveryFee, $subtotal, $total, $orderItemsData) {
            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $request->user()?->id,
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
                'state' => $state,
                'city' => $city,
                'address' => $address,
                'delivery_instructions' => $deliveryInstructions,
                'delivery_fee' => $deliveryFee,
                'subtotal' => $subtotal,
                'total' => $total,
            ]);

            foreach ($orderItemsData as $itemData) {
                OrderItem::create([...$itemData, 'order_id' => $order->id]);
            }

            return $order;
        });

        if (! $paystack->isConfigured()) {
            return response()->json(['error' => 'Payment processing is not available right now. Please try again later.'], 503);
        }

        try {
            $tx = $paystack->initializeTransaction(
                $customerEmail,
                $total,
                $orderNumber,
                config('app.url').'/api/payments/verify',
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'Internal server error'], 500);
        }

        Payment::create(['order_id' => $order->id, 'reference' => $orderNumber, 'amount' => $total, 'status' => 'pending']);

        $orderWithItems = $order->load('items.product');

        return response()->json(['order' => $orderWithItems, 'authorizationUrl' => $tx['authorization_url']], 201);
    }

    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->with(['items.product', 'payments'])->first();
        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json(['order' => $order]);
    }

    public function completeProfile(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->first();
        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }
        if ($order->payment_status !== 'paid') {
            return response()->json(['error' => 'Order has not been paid for yet'], 409);
        }
        if ($order->user_id && $order->user_id !== $request->user()->id) {
            return response()->json(['error' => 'This order belongs to a different account'], 403);
        }

        $order->update(['user_id' => $request->user()->id, 'profile_setup_required' => false, 'status' => 'profile_completed']);

        return response()->json(['order' => $order->fresh()]);
    }
}
