<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\Card;
use Illuminate\Http\RedirectResponse;

class NfcController extends Controller
{
    /**
     * Public NFC tap destination: what a TapConnect card's NFC chip is
     * programmed to open. Unlike the old Next.js app, no APP_URL workaround
     * is needed here — plain PHP request handling has no reverse-proxy
     * origin confusion, so normal relative redirects just work.
     */
    public function __invoke(string $code): RedirectResponse
    {
        $normalized = strtoupper(trim($code));
        $card = Card::where('code', $normalized)->first();

        if (! $card || $card->status === 'deactivated') {
            return redirect()->route('card-not-active');
        }

        if ($card->user_id) {
            $cardUser = $card->user;

            AnalyticsEvent::create([
                'user_id' => $cardUser->id,
                'type' => 'NFC_TAP',
                'meta' => json_encode(['cardCode' => $normalized]),
            ]);

            return redirect()->route('profile.show', ['user' => $cardUser->username, 'src' => 'nfc']);
        }

        return redirect()->route('activate-card', ['code' => $normalized]);
    }
}
