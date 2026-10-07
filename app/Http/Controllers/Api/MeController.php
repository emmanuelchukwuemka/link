<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request, NotifyService $notify): JsonResponse
    {
        $user = $request->user()->load(['links' => fn ($q) => $q->orderBy('position'), 'socialLinks' => fn ($q) => $q->orderBy('position'), 'ownedBusiness']);

        $notify->checkSubscriptionExpiry($user);

        return response()->json(['user' => $user->makeHidden(['password', 'remember_token'])]);
    }
}
