<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'customer_name', 'customer_email', 'customer_phone',
        'state', 'city', 'address', 'delivery_instructions', 'delivery_fee', 'subtotal',
        'total', 'status', 'payment_status', 'profile_setup_required', 'courier_name',
        'tracking_number', 'shipped_at', 'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'profile_setup_required' => 'boolean',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'order_number';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
