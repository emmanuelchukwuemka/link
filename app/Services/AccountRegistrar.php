<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Profile;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Shared "create a brand-new account" logic for every signup path that
 * doesn't collect a username up front (OTP and password registration both
 * auto-generate one from the email and let it be claimed/changed right
 * after). Google sign-up is close but distinct enough (no business
 * support, carries an avatar) that it stays separate in GoogleController.
 */
class AccountRegistrar
{
    /**
     * @return array{0: User, 1: Profile}
     */
    public static function register(string $email, string $hashedPassword, string $businessName = '', ?DateTimeInterface $emailVerifiedAt = null): array
    {
        $username = UsernameGenerator::fromEmail($email);

        return DB::transaction(function () use ($email, $hashedPassword, $businessName, $emailVerifiedAt, $username) {
            $name = $businessName !== '' ? $businessName : $username;

            $user = User::create([
                'email' => $email,
                'password' => $hashedPassword,
                'name' => $name,
                'account_type' => $businessName !== '' ? 'business_admin' : 'individual',
                'email_verified_at' => $emailVerifiedAt,
            ]);

            $profile = Profile::create([
                'user_id' => $user->id,
                'username' => $username,
                'name' => $name,
            ]);

            if ($businessName !== '') {
                $business = Business::create([
                    'name' => $businessName,
                    'slug' => self::uniqueSlugFor($businessName),
                    'owner_id' => $user->id,
                ]);
                $user->update(['business_id' => $business->id]);
            }

            return [$user, $profile];
        });
    }

    private static function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'business';
        $slug = $base;
        $suffix = 1;
        while (Business::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
