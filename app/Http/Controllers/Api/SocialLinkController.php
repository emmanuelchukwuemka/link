<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\SocialLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialLinkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = Profile::active($request->user());
        $socialLinks = SocialLink::where('profile_id', $profile->id)->orderBy('position')->get();

        return response()->json(['socialLinks' => $socialLinks]);
    }

    public function store(Request $request): JsonResponse
    {
        $platform = $request->input('platform');
        $url = $request->input('url');

        if (! $platform || ! $url) {
            return response()->json(['error' => 'Platform and URL are required'], 400);
        }

        $profile = Profile::active($request->user());
        $lastPosition = SocialLink::where('profile_id', $profile->id)->max('position');

        $socialLink = SocialLink::create([
            'platform' => $platform,
            'url' => $url,
            'position' => $lastPosition === null ? 0 : $lastPosition + 1,
            'user_id' => $profile->user_id,
            'profile_id' => $profile->id,
        ]);

        return response()->json(['socialLink' => $socialLink], 201);
    }

    public function update(Request $request, SocialLink $socialLink): JsonResponse
    {
        if ($socialLink->profile_id !== Profile::active($request->user())->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $platform = $request->input('platform');
        $url = $request->input('url');

        if (! $platform || ! $url) {
            return response()->json(['error' => 'platform and url are required'], 400);
        }

        $socialLink->update(['platform' => $platform, 'url' => $url]);

        return response()->json(['socialLink' => $socialLink]);
    }

    public function destroy(Request $request, SocialLink $socialLink): JsonResponse
    {
        if ($socialLink->profile_id !== Profile::active($request->user())->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $socialLink->delete();

        return response()->json(['success' => true]);
    }
}
