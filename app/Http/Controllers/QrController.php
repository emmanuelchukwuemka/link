<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class QrController extends Controller
{
    /**
     * Public QR scan destination: printed QR codes point here instead of
     * directly at the profile, so a scan can be distinguished from a plain
     * link click.
     */
    public function __invoke(string $username): RedirectResponse
    {
        $user = User::where('username', $username)->first();

        if (! $user) {
            return redirect()->route('home');
        }

        AnalyticsEvent::create(['user_id' => $user->id, 'type' => 'QR_SCAN']);

        return redirect()->route('profile.show', ['user' => $username, 'src' => 'qr']);
    }
}
