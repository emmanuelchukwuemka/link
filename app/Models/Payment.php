<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['order_id', 'provider', 'reference', 'amount', 'status', 'raw_response'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
