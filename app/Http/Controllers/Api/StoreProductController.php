<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\StoreProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = StoreProduct::where('profile_id', Profile::active($request->user())->id)->orderBy('position')->get();

        return response()->json(['products' => $products]);
    }

    public function store(Request $request): JsonResponse
    {
        $profile = Profile::active($request->user());

        if (! $profile->isProActive()) {
            return response()->json(['error' => 'Adding products to your shop is a Pro feature. Upgrade to start selling.'], 403);
        }

        $lastPosition = StoreProduct::where('profile_id', $profile->id)->max('position');

        $product = StoreProduct::create([
            'name' => $request->input('name') ?: 'New Product',
            'description' => $request->input('description'),
            'image_url' => $request->input('imageUrl'),
            'price' => is_numeric($request->input('price')) ? (float) $request->input('price') : 0,
            'discount_price' => $request->input('discountPrice') ? (float) $request->input('discountPrice') : null,
            'category' => $request->input('category'),
            'availability' => $request->input('availability') ?: 'available',
            'position' => $lastPosition === null ? 0 : $lastPosition + 1,
            'user_id' => $profile->user_id,
            'profile_id' => $profile->id,
        ]);

        return response()->json(['product' => $product], 201);
    }

    public function update(Request $request, StoreProduct $storeProduct): JsonResponse
    {
        if ($storeProduct->profile_id !== Profile::active($request->user())->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $updateData = array_filter([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'image_url' => $request->input('imageUrl'),
            'category' => $request->input('category'),
            'availability' => $request->input('availability'),
            'variants' => $request->input('variants'),
        ], fn ($v) => $v !== null);

        if ($request->has('price')) {
            $updateData['price'] = is_numeric($request->input('price')) ? (float) $request->input('price') : 0;
        }
        if ($request->has('discountPrice')) {
            $updateData['discount_price'] = $request->input('discountPrice') ? (float) $request->input('discountPrice') : null;
        }

        $storeProduct->update($updateData);

        return response()->json(['product' => $storeProduct]);
    }

    public function destroy(Request $request, StoreProduct $storeProduct): JsonResponse
    {
        if ($storeProduct->profile_id !== Profile::active($request->user())->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $storeProduct->delete();

        return response()->json(['success' => true]);
    }
}
