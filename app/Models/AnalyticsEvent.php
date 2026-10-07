<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsEvent extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['user_id', 'type', 'meta'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
