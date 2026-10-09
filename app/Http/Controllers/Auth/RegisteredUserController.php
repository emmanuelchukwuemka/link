<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Raw registration endpoint — kept for parity with the old app's own
     * /api/auth/register route, which likewise exists but is never called by
     * the real register page (that's the OTP wizard, see OtpController).
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['required', 'string', 'regex:/^[a-z0-9][a-z0-9-]{2,29}$/', 'unique:profiles,username'],
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        Profile::create([
            'user_id' => $user->id,
            'username' => $request->username,
            'name' => $request->name,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return to_route('dashboard');
    }
}
