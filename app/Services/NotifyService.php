<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;

class NotifyService
{
    /**
     * Creates a real, persisted in-app notification (shown in the dashboard
     * bell). Email/WhatsApp/SMS delivery isn't wired to a provider for
     * general notifications yet, mirroring the old app — only OTP codes
     * actually send real email (via Mail::to()->send(), see OtpController).
     */
    public function notify(int $userId, string $type, string $title, string $message, ?string $link = null): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ]);
    }

    /**
     * No cron/scheduler exists yet, so expiry notifications are checked
     * lazily whenever the user's session is loaded (GET /api/auth/me).
     * De-duped by only creating one of each type while the previous one is
     * still unread.
     */
    public function checkSubscriptionExpiry(User $user): void
    {
        if ($user->plan !== 'pro' || ! $user->plan_expires_at) {
            return;
        }

        $daysLeft = Carbon::now()->diffInDays($user->plan_expires_at, false);

        if ($daysLeft < 0) {
            $exists = Notification::where('user_id', $user->id)->where('type', 'SUBSCRIPTION_EXPIRED')->where('read', false)->exists();
            if (! $exists) {
                $this->notify(
                    $user->id,
                    'SUBSCRIPTION_EXPIRED',
                    'Your Pro subscription has expired',
                    'Renew to restore premium features. Your basic profile, NFC and QR code stay active.',
                    '/dashboard/subscription',
                );
            }
        } elseif ($daysLeft <= 7) {
            $exists = Notification::where('user_id', $user->id)->where('type', 'SUBSCRIPTION_EXPIRING')->where('read', false)->exists();
            if (! $exists) {
                $this->notify(
                    $user->id,
                    'SUBSCRIPTION_EXPIRING',
                    'Your Pro subscription is expiring soon',
                    'Renews/expires on '.$user->plan_expires_at->format('M j, Y').'.',
                    '/dashboard/subscription',
                );
            }
        }
    }
}
