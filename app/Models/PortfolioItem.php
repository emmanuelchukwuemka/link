<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioItem extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'title', 'description', 'image_url', 'video_url', 'type', 'position'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
