<?php

namespace App\Services;

use App\Models\OtpCode;
use Carbon\Carbon;

class OtpService
{
    private const TTL_MINUTES = 10;

    private const RESEND_COOLDOWN_SECONDS = 60;

    private const MAX_ATTEMPTS = 5;

    /**
     * @return array{code: string}|null null if still within the resend cooldown window.
     */
    public function generate(string $email, string $purpose): ?array
    {
        $recent = OtpCode::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if ($recent && $recent->created_at->diffInSeconds(now()) < self::RESEND_COOLDOWN_SECONDS) {
            return null;
        }

        // Only one active code per email+purpose — old unconsumed codes are superseded.
        OtpCode::where('email', $email)->where('purpose', $purpose)->delete();

        $code = (string) random_int(100000, 999999);

        OtpCode::create([
            'email' => $email,
            'code' => $code,
            'purpose' => $purpose,
            'expires_at' => Carbon::now()->addMinutes(self::TTL_MINUTES),
        ]);

        return ['code' => $code];
    }

    /**
     * @return string|null null means verification succeeded; otherwise the
     *                      exact user-facing error message for the failure reason.
     */
    public function verifyWithError(string $email, string $purpose, string $code): ?string
    {
        $otp = OtpCode::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (! $otp) {
            return 'No verification code found for this email. Please request a new one.';
        }

        if ($otp->expires_at->isPast()) {
            return 'This code has expired. Please request a new one.';
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            return 'Too many incorrect attempts. Please request a new code.';
        }

        if ($otp->code !== $code) {
            $otp->increment('attempts');

            return 'Incorrect code. Please try again.';
        }

        $otp->update(['consumed_at' => now()]);

        return null;
    }
}
