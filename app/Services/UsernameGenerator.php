<?php

namespace App\Services;

use App\Models\Profile;
use Illuminate\Support\Str;

class UsernameGenerator
{
    /**
     * Used by both OTP registration and Google sign-up, since neither
     * collects a username up front — it's derived from the email's local
     * part and can be changed afterward via the username-claim step.
     */
    public static function fromEmail(string $email): string
    {
        $base = Str::of(Str::before($email, '@'))
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '')
            ->substr(0, 24)
            ->toString();
        $base = $base !== '' ? $base : 'user';

        $candidate = $base;
        $suffix = 0;
        while (Profile::where('username', $candidate)->exists()) {
            $suffix++;
            $candidate = "{$base}{$suffix}";
        }

        return $candidate;
    }
}
