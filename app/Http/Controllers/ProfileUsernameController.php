<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProfileUsernameController extends Controller
{
    private const USERNAME_RE = '/^[a-z0-9][a-z0-9-]{2,29}$/';

    /**
     * Change the current user's username. Mirrors the old PUT
     * /api/profile/username exactly — used both at registration (claim your
     * URL step) and later from account settings.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $normalized = Str::lower(trim((string) $request->input('username')));

        if (! preg_match(self::USERNAME_RE, $normalized)) {
            return response()->json(['error' => 'Username must be 3-30 characters: lowercase letters, numbers and hyphens only.'], 400);
        }

        $existing = User::where('username', $normalized)->first();
        if ($existing && $existing->id !== $request->user()->id) {
            return response()->json(['error' => 'That username is already taken.'], 409);
        }

        $request->user()->update(['username' => $normalized]);

        return response()->json(['user' => $request->user()->fresh()->makeHidden(['password', 'remember_token'])]);
    }
}
