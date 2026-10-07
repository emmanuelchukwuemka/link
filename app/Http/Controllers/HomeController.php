<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $products = Product::where('availability', '!=', 'hidden')
            ->orderBy('price_regular')
            ->limit(3)
            ->get()
            ->map(function (Product $p) {
                return [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name' => $p->name,
                    'category' => $p->category,
                    'colors' => $p->colors ? json_decode($p->colors, true) : [],
                    'images' => $p->images ? json_decode($p->images, true) : [],
                    'priceRegular' => (float) $p->price_regular,
                    'priceSale' => $p->price_sale ? (float) $p->price_sale : null,
                    'customizationPrice' => (float) ($p->customization_price ?: 0),
                    'length' => $p->length,
                    'width' => $p->width,
                ];
            });

        return Inertia::render('welcome', ['products' => $products]);
    }
}
