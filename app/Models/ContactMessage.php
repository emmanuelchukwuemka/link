<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['name', 'email', 'phone', 'message', 'status'];
}
