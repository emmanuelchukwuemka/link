<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'description',
        'website',
        'phone',
        'whatsapp',
        'email',
        'address',
        'category',
        'business_hours',
        'brand_color',
        'plan',
        'plan_expires_at',
        'owner_id',
    ];

    protected function casts(): array
    {
        return [
            'plan_expires_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Employees + the business_admin owner, all linked via users.business_id.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(User::class, 'business_id');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(Card::class);
    }

    public function subscriptionPayments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class);
    }
}
