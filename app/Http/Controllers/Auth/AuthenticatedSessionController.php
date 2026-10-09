<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    /**
     * Handle an incoming authentication request. Returns JSON (not a
     * redirect) — mirrors the old /api/auth/login contract exactly, since
     * the login page itself drives the post-login redirect client-side.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        try {
            $request->ensureIsNotRateLimited();
        } catch (ValidationException) {
            return response()->json(['error' => 'Too many attempts. Please try again later.'], 429);
        }

        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Auth::validate(['email' => $request->string('email'), 'password' => $request->string('password')])) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['error' => 'This account has been suspended. Contact support if you believe this is a mistake.'], 403);
        }

        Auth::login($user, remember: $request->boolean('rememberMe'));
        $request->session()->regenerate();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => Profile::active($user)->username,
                'name' => $user->name,
                'accountType' => $user->account_type,
            ],
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
