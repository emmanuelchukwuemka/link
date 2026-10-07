<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Service extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['user_id', 'name', 'description', 'price', 'cta_type', 'position'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
