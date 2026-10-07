<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UsernameGenerator;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        if (! config('services.google.client_id') || ! config('services.google.client_secret')) {
            return $this->loginFailure('google_not_configured');
        }

        // Stashed in the session (survives the OAuth round trip) so the
        // callback can send the user back where they started.
        session(['google_oauth_next' => $request->query('next', '')]);

        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        if (! config('services.google.client_id') || ! config('services.google.client_secret')) {
            return $this->loginFailure('google_not_configured');
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable) {
            return $this->loginFailure('google_failed');
        }

        // getRaw()['email_verified'] is how Socialite's Google driver surfaces
        // Google's own email_verified claim.
        if (! ($googleUser->user['email_verified'] ?? true)) {
            return $this->loginFailure('google_email_unverified');
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if (! $user) {
            $username = UsernameGenerator::fromEmail($googleUser->getEmail());

            $user = User::create([
                'email' => $googleUser->getEmail(),
                'username' => $username,
                // Google already verified this email; no password is ever
                // collected for this flow, so a random, never-surfaced hash
                // stands in (matches the OTP signup pattern).
                'password' => Hash::make(Str::random(32)),
                'name' => $googleUser->getName() ?: $username,
                'avatar_url' => $googleUser->getAvatar(),
                'account_type' => 'individual',
                'email_verified_at' => now(),
            ]);
        }

        if (! $user->is_active) {
            return $this->loginFailure('account_suspended');
        }

        Auth::login($user, remember: true);

        $next = session()->pull('google_oauth_next');
        $destination = $next ?: ($user->account_type === 'admin' ? route('admin.dashboard') : route('dashboard'));

        return redirect($destination);
    }

    private function loginFailure(string $reason): RedirectResponse
    {
        return redirect()->route('login', ['error' => $reason]);
    }
}
