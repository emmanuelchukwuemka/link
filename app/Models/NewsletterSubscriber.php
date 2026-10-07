<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscriber extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['email'];
}
