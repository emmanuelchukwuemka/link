<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::orderByDesc('created_at')->get();

        return response()->json(['products' => $products]);
    }

    private function slugify(string $name): string
    {
        $slug = strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');

        return $slug !== '' ? $slug : 'product';
    }

    private function uniqueSlug(string $name): string
    {
        $base = $this->slugify($name);
        $slug = $base;
        $i = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    public function store(Request $request): JsonResponse
    {
        $name = $request->input('name');
        $priceRegular = $request->input('priceRegular');

        if (! $name || ! $priceRegular) {
            return response()->json(['error' => 'Name and regular price are required'], 400);
        }

        $product = Product::create([
            'name' => $name,
            'slug' => $this->uniqueSlug($name),
            'subtitle' => $request->input('subtitle') ?: null,
            'category' => $request->input('category') ?: 'TapConnect Cards',
            'sku' => $request->input('sku') ?: null,
            'stock' => (int) ($request->input('stock') ?? 0),
            'description' => $request->input('description'),
            'images' => $request->has('images') ? json_encode($request->input('images')) : null,
            'length' => $request->filled('length') ? (float) $request->input('length') : null,
            'width' => $request->filled('width') ? (float) $request->input('width') : null,
            'colors' => $request->has('colors') ? json_encode($request->input('colors')) : null,
            'price_regular' => (float) $priceRegular,
            'price_sale' => $request->filled('priceSale') ? (float) $request->input('priceSale') : null,
            'production_time' => $request->input('productionTime') ?: '3-5 business days',
            'availability' => $request->input('availability') ?: 'available',
            'customization_price' => $request->filled('customizationPrice') ? (float) $request->input('customizationPrice') : 5000,
        ]);

        return response()->json(['product' => $product], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = [];

        if ($request->has('name')) {
            $data['name'] = $request->input('name');
        }
        if ($request->has('subtitle')) {
            $data['subtitle'] = $request->input('subtitle') ?: null;
        }
        if ($request->has('category')) {
            $data['category'] = $request->input('category');
        }
        if ($request->has('sku')) {
            $data['sku'] = $request->input('sku') ?: null;
        }
        if ($request->has('stock')) {
            $data['stock'] = (int) $request->input('stock') ?: 0;
        }
        if ($request->has('description')) {
            $data['description'] = $request->input('description');
        }
        if ($request->has('images')) {
            $data['images'] = json_encode($request->input('images'));
        }
        if ($request->has('length')) {
            $data['length'] = $request->input('length') !== null && $request->input('length') !== '' ? (float) $request->input('length') : null;
        }
        if ($request->has('width')) {
            $data['width'] = $request->input('width') !== null && $request->input('width') !== '' ? (float) $request->input('width') : null;
        }
        if ($request->has('colors')) {
            $data['colors'] = json_encode($request->input('colors'));
        }
        if ($request->has('priceRegular')) {
            $data['price_regular'] = (float) $request->input('priceRegular');
        }
        if ($request->has('priceSale')) {
            $data['price_sale'] = $request->input('priceSale') !== null && $request->input('priceSale') !== '' ? (float) $request->input('priceSale') : null;
        }
        if ($request->has('productionTime')) {
            $data['production_time'] = $request->input('productionTime');
        }
        if ($request->has('availability')) {
            $data['availability'] = $request->input('availability');
        }
        if ($request->has('customizationPrice')) {
            $data['customization_price'] = $request->filled('customizationPrice') ? (float) $request->input('customizationPrice') : null;
        }

        $product->update($data);

        return response()->json(['product' => $product->fresh()]);
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $product->delete();
        } catch (\Throwable) {
            return response()->json(['error' => 'This product has existing orders and cannot be deleted. Hide it instead.'], 409);
        }

        return response()->json(['success' => true]);
    }
}
