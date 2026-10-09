<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\Profile;
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
        $profile = Profile::where('username', $username)->first();

        if (! $profile) {
            return redirect()->route('home');
        }

        AnalyticsEvent::create(['user_id' => $profile->user_id, 'profile_id' => $profile->id, 'type' => 'QR_SCAN']);

        return redirect()->route('profile.show', ['user' => $username, 'src' => 'qr']);
    }
}
