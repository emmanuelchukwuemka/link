<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreProduct extends Model
{
    protected $fillable = [
        'user_id', 'name', 'description', 'image_url', 'price', 'discount_price',
        'category', 'variants', 'availability', 'position',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
