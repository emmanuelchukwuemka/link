<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $cards = Card::where('user_id', $request->user()->id)->orderByDesc('assigned_at')->get();

        return response()->json(['cards' => $cards]);
    }

    /**
     * Authenticated user connects a physical card to one of their profiles —
     * the currently active one (the dashboard's profile switcher), since a
     * card points at a single public page, not the whole account.
     */
    public function claim(Request $request): JsonResponse
    {
        $code = $request->input('code');
        if (! $code) {
            return response()->json(['error' => 'Card code is required'], 400);
        }

        $normalized = strtoupper(trim($code));
        $card = Card::where('code', $normalized)->first();

        if (! $card) {
            return response()->json(['error' => 'We could not find a card with that code'], 404);
        }
        if ($card->status === 'deactivated') {
            return response()->json(['error' => 'This card has been deactivated'], 409);
        }
        if ($card->user_id && $card->user_id !== $request->user()->id) {
            return response()->json(['error' => 'This card is already connected to another profile'], 409);
        }

        $profile = Profile::active($request->user());

        $card->update([
            'user_id' => $request->user()->id,
            'profile_id' => $profile->id,
            'business_id' => null,
            'status' => 'active',
            'assigned_at' => now(),
        ]);

        return response()->json(['card' => $card->fresh()]);
    }
}
