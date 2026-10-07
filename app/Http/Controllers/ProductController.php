<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\CategoryTreeService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function apiIndex(): JsonResponse
    {
        $products = Product::where('availability', '!=', 'hidden')->orderBy('price_regular')->get();

        return response()->json(['products' => $products]);
    }

    private function toGridProduct(Product $p, ?string $topSellerId, Carbon $dayAgo): array
    {
        $colors = $p->colors ? (is_string($p->colors) ? json_decode($p->colors, true) : $p->colors) : [];
        $images = $p->images ? (is_string($p->images) ? json_decode($p->images, true) : $p->images) : [];

        $priceRegular = (float) ($p->price_regular ?: 15000);
        $priceSale = $p->price_sale ? (float) $p->price_sale : null;
        $discountPct = $priceSale ? (int) round((1 - $priceSale / $priceRegular) * 100) : 0;

        return [
            'id' => $p->id,
            'slug' => $p->slug,
            'name' => $p->name,
            'subtitle' => $p->subtitle,
            'category' => $p->category,
            'brand' => 'TapConnect',
            'image' => $images[0] ?? null,
            'colors' => $colors ?: [],
            'priceRegular' => $priceRegular,
            'priceSale' => $priceSale,
            'customizationPrice' => (float) ($p->customization_price ?: 0),
            'discountPct' => $discountPct,
            'isBestSeller' => $topSellerId !== null && (string) $p->id === $topSellerId,
            'isNew' => $p->created_at->greaterThanOrEqualTo($dayAgo),
            'stock' => $p->stock ?? 0,
            'createdAt' => $p->created_at->getTimestamp() * 1000,
        ];
    }

    public function index(Request $request): Response
    {
        $products = Product::where('availability', '!=', 'hidden')->orderBy('price_regular')->get();

        $soldAgg = OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.payment_status', 'paid')
            ->selectRaw('order_items.product_id, SUM(order_items.quantity) as qty')
            ->groupBy('order_items.product_id')
            ->pluck('qty', 'product_id');

        $topSellerId = $soldAgg->isNotEmpty() ? (string) $soldAgg->sortDesc()->keys()->first() : null;

        $categories = Category::where('scope', 'marketplace')->orderBy('position')->get();

        $dayAgo = Carbon::now()->subDays(14);
        $gridProducts = $products->map(fn (Product $p) => $this->toGridProduct($p, $topSellerId, $dayAgo))->values();

        $categoryTree = (new CategoryTreeService)->build($categories, $products->pluck('category'));

        return Inertia::render('marketplace/index', [
            'products' => $gridProducts,
            'categories' => $categoryTree,
        ]);
    }

    public function show(Request $request, Product $product): Response
    {
        if ($product->availability === 'hidden') {
            abort(404);
        }

        $colors = $product->colors ? (is_string($product->colors) ? json_decode($product->colors, true) : $product->colors) : [];
        $images = $product->images ? (is_string($product->images) ? json_decode($product->images, true) : $product->images) : [];

        $priceRegular = (float) ($product->price_regular ?: 15000);
        $priceSale = $product->price_sale ? (float) $product->price_sale : null;
        $currentPrice = $priceSale ?? $priceRegular;
        $discountPct = $priceSale ? (int) round((1 - $priceSale / $priceRegular) * 100) : 0;

        $relatedProducts = Product::where('category', $product->category)
            ->where('slug', '!=', $product->slug)
            ->where('availability', '!=', 'hidden')
            ->limit(5)
            ->get();

        $dayAgo = Carbon::now()->subDays(14);
        $relatedGridProducts = $relatedProducts->map(function (Product $p) use ($dayAgo) {
            $grid = $this->toGridProduct($p, null, $dayAgo);
            $grid['isBestSeller'] = false;
            $grid['isNew'] = false;

            return $grid;
        })->values();

        return Inertia::render('marketplace/product', [
            'product' => [
                'id' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'subtitle' => $product->subtitle,
                'category' => $product->category,
                'description' => $product->description,
                'images' => $images ?: [],
                'colors' => $colors ?: [],
                'priceRegular' => $priceRegular,
                'priceSale' => $priceSale,
                'currentPrice' => $currentPrice,
                'discountPct' => $discountPct,
                'customizationPrice' => (float) ($product->customization_price ?: 0),
                'stock' => $product->stock ?? 0,
                'length' => $product->length,
                'width' => $product->width,
            ],
            'relatedProducts' => $relatedGridProducts,
        ]);
    }
}
