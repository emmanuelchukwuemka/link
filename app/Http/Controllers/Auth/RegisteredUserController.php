<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountRegistrar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Plain email+password signup — the other way to create an account,
     * alongside the OTP wizard and Google (see OtpController/GoogleController).
     * Mirrors OTP registration's contract (auto-generated username claimed
     * in a later step, optional business_name) so register.tsx's password
     * mode can reuse the same post-signup flow. Unlike OTP/Google, nothing
     * here proves the email is real, so email_verified_at stays null.
     */
    public function store(Request $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');
        $passwordConfirmation = (string) $request->input('password_confirmation');
        $businessName = trim((string) $request->input('business_name', ''));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please enter a valid email address.'], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with this email already exists. Please log in instead.'], 409);
        }

        if ($password === '' || $password !== $passwordConfirmation) {
            return response()->json(['error' => 'Passwords do not match.'], 400);
        }

        $validator = Validator::make(['password' => $password], ['password' => Rules\Password::defaults()]);
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first('password')], 400);
        }

        [$user, $profile] = AccountRegistrar::register($email, Hash::make($password), $businessName);

        Auth::login($user, remember: true);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $profile->username,
                'name' => $user->name,
                'accountType' => $user->account_type,
            ],
        ], 201);
    }
}
