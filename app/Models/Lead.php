<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['owner_id', 'profile_id', 'name', 'phone', 'email', 'message', 'notes', 'source', 'status'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
