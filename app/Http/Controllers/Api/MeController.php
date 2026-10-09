<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request, NotifyService $notify): JsonResponse
    {
        $user = $request->user()->load('ownedBusiness');
        $profile = Profile::active($user)->load(['links' => fn ($q) => $q->orderBy('position'), 'socialLinks' => fn ($q) => $q->orderBy('position')]);

        $notify->checkSubscriptionExpiry($profile);

        // Flattens account (id/email/accountType) and active-profile fields
        // (name/username/bio/appearance/plan/links/...) into one object —
        // every dashboard page already expects this single-object shape from
        // before multi-profile support existed, so this keeps that contract.
        $merged = array_merge($profile->toArray(), [
            'id' => $user->id,
            'email' => $user->email,
            'accountType' => $user->account_type,
            'isActive' => $user->is_active,
            'ownedBusiness' => $user->ownedBusiness,
            'profileId' => $profile->id,
        ]);

        return response()->json(['user' => $merged]);
    }
}
