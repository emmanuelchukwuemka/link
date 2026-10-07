<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name', 'slug', 'subtitle', 'category', 'sku', 'stock', 'description', 'images',
        'length', 'width', 'colors', 'price_regular', 'price_sale', 'production_time',
        'availability', 'customization_price',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
