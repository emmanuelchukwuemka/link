<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportMessage extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['user_id', 'sender', 'body', 'read'];

    protected function casts(): array
    {
        return ['read' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
