<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Card;
use App\Models\Order;
use App\Models\User;
use App\Services\CardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CardController extends Controller
{
    private const PAGE_SIZE = 10;

    public function index(Request $request, CardService $cardService): JsonResponse
    {
        $status = $request->query('status', '');
        $product = $request->query('product', '');
        $color = $request->query('color', '');
        $businessId = $request->query('businessId', '');
        $search = trim((string) $request->query('search', ''));
        $page = max((int) $request->query('page', 1), 1);

        $allCards = Card::orderByDesc('created_at')->get();

        $userIds = $allCards->pluck('user_id')->filter()->unique()->values()->all();
        $businessIds = $allCards->pluck('business_id')->filter()->unique()->values()->all();
        $orderIds = $allCards->pluck('order_id')->filter()->unique()->values()->all();

        $users = $userIds ? User::whereIn('id', $userIds)->get()->keyBy('id') : collect();
        $businesses = $businessIds ? Business::whereIn('id', $businessIds)->get()->keyBy('id') : collect();
        $orders = $orderIds ? Order::whereIn('id', $orderIds)->get()->keyBy('id') : collect();

        $tapStats = $cardService->getCardTapStats($allCards->pluck('code')->all());

        $enriched = $allCards->map(function (Card $c) use ($users, $businesses, $orders, $tapStats) {
            $user = $c->user_id ? $users->get($c->user_id) : null;
            $business = $c->business_id ? $businesses->get($c->business_id) : null;
            $order = $c->order_id ? $orders->get($c->order_id) : null;
            $stats = $tapStats->get($c->code) ?? ['taps30d' => 0, 'lastTap' => null];

            $arr = $c->toArray();
            $arr['user'] = $user ? ['id' => $user->id, 'username' => $user->username, 'displayName' => $user->name, 'jobTitle' => $user->job_title] : null;
            $arr['business'] = $business ? ['id' => $business->id, 'name' => $business->name] : null;
            $arr['order'] = $order ? ['id' => $order->id, 'orderNumber' => $order->order_number] : null;
            $arr['taps30d'] = $stats['taps30d'];
            $arr['lastTap'] = $stats['lastTap'];
            $arr['notActivated'] = $c->status === 'active' && $stats['taps30d'] === 0 && ! $stats['lastTap'];

            return $arr;
        });

        $stats = [
            'all' => $enriched->count(),
            'unassigned' => $enriched->where('status', 'unassigned')->count(),
            'reserved' => $enriched->where('status', 'reserved')->count(),
            'active' => $enriched->where('status', 'active')->count(),
            'notActivated' => $enriched->where('notActivated', true)->count(),
            'deactivated' => $enriched->where('status', 'deactivated')->count(),
        ];

        $filtered = $enriched;
        if ($status) {
            $filtered = $filtered->where('status', $status);
        }
        if ($product) {
            $filtered = $filtered->where('product', $product);
        }
        if ($color) {
            $filtered = $filtered->filter(fn ($c) => strtolower((string) $c['color']) === strtolower($color));
        }
        if ($businessId) {
            $filtered = $filtered->where('business_id', $businessId);
        }
        if ($search) {
            $q = strtolower($search);
            $filtered = $filtered->filter(function ($c) use ($q) {
                return str_contains(strtolower($c['code']), $q)
                    || str_contains(strtolower($c['user']['username'] ?? ''), $q)
                    || str_contains(strtolower($c['user']['displayName'] ?? ''), $q);
            });
        }
        $filtered = $filtered->values();

        $total = $filtered->count();
        $totalPages = max((int) ceil($total / self::PAGE_SIZE), 1);
        $currentPage = min($page, $totalPages);
        $pageItems = $filtered->slice(($currentPage - 1) * self::PAGE_SIZE, self::PAGE_SIZE)->values();

        return response()->json([
            'cards' => $pageItems,
            'total' => $total,
            'page' => $currentPage,
            'totalPages' => $totalPages,
            'pageSize' => self::PAGE_SIZE,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request, CardService $cardService): JsonResponse
    {
        $count = max(1, min((int) $request->input('count', 1), 1000));
        $product = $request->input('product', 'standard');
        $color = $request->input('color');
        $businessId = $request->input('businessId');
        $orderId = $request->input('orderId');
        $batchLabel = $request->input('batchLabel');

        $safeProduct = in_array($product, CardService::PRODUCTS, true) ? $product : 'standard';

        if ($businessId && ! Business::find($businessId)) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $cards = [];
        for ($i = 0; $i < $count; $i++) {
            $cards[] = Card::create([
                'code' => $cardService->generateUniqueCardCode(),
                'product' => $safeProduct,
                'color' => $color ?: null,
                'business_id' => $businessId ?: null,
                'order_id' => $orderId ?: null,
                'batch_label' => $batchLabel ?: null,
                'status' => $businessId ? 'reserved' : 'unassigned',
                'assigned_at' => $businessId ? now() : null,
            ]);
        }

        return response()->json(['cards' => $cards], 201);
    }

    public function show(string $code): JsonResponse
    {
        $card = Card::where('code', $code)->first();
        if (! $card) {
            return response()->json(['error' => 'Card not found'], 404);
        }

        $user = $card->user_id ? User::find($card->user_id) : null;
        $business = $card->business_id ? Business::find($card->business_id) : null;

        $arr = $card->toArray();
        $arr['user'] = $user ? ['id' => $user->id, 'username' => $user->username, 'displayName' => $user->name] : null;
        $arr['business'] = $business ? ['id' => $business->id, 'name' => $business->name] : null;

        return response()->json(['card' => $arr]);
    }

    public function update(Request $request, string $code, CardService $cardService): JsonResponse
    {
        $card = Card::where('code', $code)->first();
        if (! $card) {
            return response()->json(['error' => 'Card not found'], 404);
        }

        $action = $request->input('action');
        $data = [];

        switch ($action) {
            case 'assign':
                if (! $request->input('userId')) {
                    return response()->json(['error' => 'userId is required'], 400);
                }
                $data['user_id'] = $request->input('userId');
                $data['status'] = 'active';
                $data['assigned_at'] = now();
                break;
            case 'reserve':
                if (! $request->input('businessId')) {
                    return response()->json(['error' => 'businessId is required'], 400);
                }
                $data['business_id'] = $request->input('businessId');
                $data['user_id'] = null;
                $data['status'] = 'reserved';
                $data['assigned_at'] = now();
                break;
            case 'unassign':
                $data['user_id'] = null;
                $data['business_id'] = null;
                $data['status'] = 'unassigned';
                $data['assigned_at'] = null;
                break;
            case 'deactivate':
                $data['status'] = 'deactivated';
                break;
            case 'reactivate':
                $data['status'] = $card->user_id ? 'active' : ($card->business_id ? 'reserved' : 'unassigned');
                break;
            default:
                if ($request->has('product') && in_array($request->input('product'), CardService::PRODUCTS, true)) {
                    $data['product'] = $request->input('product');
                }
                if ($request->has('color')) {
                    $data['color'] = $request->input('color') ?: null;
                }
                if ($request->has('batchLabel')) {
                    $data['batch_label'] = $request->input('batchLabel') ?: null;
                }
                if (count($data) === 0) {
                    return response()->json(['error' => 'No recognized action or fields'], 400);
                }
        }

        $card->update($data);

        return response()->json(['card' => $card->fresh()]);
    }

    public function bulk(Request $request): JsonResponse
    {
        $codes = $request->input('codes');
        $action = $request->input('action');
        $businessId = $request->input('businessId');

        if (! is_array($codes) || count($codes) === 0) {
            return response()->json(['error' => 'codes is required'], 400);
        }

        $owned = Card::whereIn('code', $codes)->get();
        if ($owned->isEmpty()) {
            return response()->json(['error' => 'No matching cards'], 404);
        }

        switch ($action) {
            case 'reserve':
                if (! $businessId) {
                    return response()->json(['error' => 'businessId is required'], 400);
                }
                if (! Business::find($businessId)) {
                    return response()->json(['error' => 'Business not found'], 404);
                }
                $data = ['business_id' => $businessId, 'user_id' => null, 'status' => 'reserved', 'assigned_at' => now()];
                break;
            case 'deactivate':
                $data = ['status' => 'deactivated'];
                break;
            case 'unassign':
                $data = ['user_id' => null, 'business_id' => null, 'status' => 'unassigned', 'assigned_at' => null];
                break;
            default:
                return response()->json(['error' => 'Unknown action'], 400);
        }

        DB::transaction(function () use ($owned, $data) {
            foreach ($owned as $card) {
                $card->update($data);
            }
        });

        return response()->json(['updated' => $owned->count()]);
    }

    public function importOne(Request $request): JsonResponse
    {
        $normalized = strtoupper(trim((string) $request->input('code')));
        if (! $normalized) {
            return response()->json(['error' => 'code is required'], 400);
        }

        if (Card::where('code', $normalized)->exists()) {
            return response()->json(['error' => 'That code already exists'], 409);
        }

        $product = $request->input('product');

        $card = Card::create([
            'code' => $normalized,
            'product' => in_array($product, CardService::PRODUCTS, true) ? $product : 'standard',
            'color' => $request->input('color') ?: null,
        ]);

        return response()->json(['card' => $card], 201);
    }
}
