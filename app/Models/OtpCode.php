<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    use HasFactory;

    // No updated_at column — codes are created once and later marked consumed,
    // never otherwise updated.
    const UPDATED_AT = null;

    protected $fillable = [
        'email',
        'code',
        'purpose',
        'attempts',
        'consumed_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'consumed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
