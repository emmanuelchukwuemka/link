<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonial extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'author_name', 'content', 'rating', 'position'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
