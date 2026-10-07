<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\OtpCodeMail;
use App\Models\Business;
use App\Models\User;
use App\Services\OtpService;
use App\Services\UsernameGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OtpController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    public function createRegister(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Request a code to create a brand-new account. Mirrors the old
     * /api/auth/otp/request route: only email (+ optional business name) is
     * collected here — username is auto-generated and can be claimed/changed
     * in a later step, after the account already exists.
     */
    public function requestRegister(Request $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->input('email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please enter a valid email address.'], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with this email already exists. Please log in instead.'], 409);
        }

        return $this->sendCode($email, 'register');
    }

    /**
     * Verify a registration code and create + sign in the new account.
     * Mirrors /api/auth/otp/verify exactly: auto-generates a username from
     * the email, creates a Business too when a business name was supplied.
     */
    public function verifyRegister(Request $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->input('email')));
        $code = trim((string) $request->input('code'));
        $businessName = trim((string) $request->input('business_name', ''));

        if ($email === '' || $code === '') {
            return response()->json(['error' => 'Missing email or code'], 400);
        }

        $verifyError = $this->verifyOrError($email, 'register', $code);
        if ($verifyError) {
            return $verifyError;
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with this email already exists. Please log in instead.'], 409);
        }

        $username = UsernameGenerator::fromEmail($email);

        $user = DB::transaction(function () use ($email, $username, $businessName) {
            $user = User::create([
                'email' => $email,
                'username' => $username,
                // OTP verification proves email ownership, so no password is
                // collected up front — a random, never-shared hash satisfies
                // the column's NOT NULL constraint (matches the old app).
                'password' => Hash::make(Str::random(32)),
                'name' => $businessName !== '' ? $businessName : $username,
                'account_type' => $businessName !== '' ? 'business_admin' : 'individual',
                'email_verified_at' => now(),
            ]);

            if ($businessName !== '') {
                $business = Business::create([
                    'name' => $businessName,
                    'slug' => $this->uniqueSlugFor($businessName),
                    'owner_id' => $user->id,
                ]);
                $user->update(['business_id' => $business->id]);
            }

            return $user;
        });

        Auth::login($user, remember: true);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'name' => $user->name,
                'accountType' => $user->account_type,
            ],
        ], 201);
    }

    /**
     * Request a code for signing in to an existing account. Mirrors
     * /api/auth/otp/login/request.
     */
    public function requestLogin(Request $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->input('email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please enter a valid email address.'], 400);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json(['error' => 'No account found with this email. Please sign up instead.'], 404);
        }

        if (! $user->is_active) {
            return response()->json(['error' => 'This account has been suspended. Contact support if you believe this is a mistake.'], 403);
        }

        return $this->sendCode($email, 'login');
    }

    /**
     * Verify a login code and sign the user in. Mirrors /api/auth/otp/login/verify.
     */
    public function verifyLogin(Request $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->input('email')));
        $code = trim((string) $request->input('code'));

        if ($email === '' || $code === '') {
            return response()->json(['error' => 'Missing email or code'], 400);
        }

        $verifyError = $this->verifyOrError($email, 'login', $code);
        if ($verifyError) {
            return $verifyError;
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json(['error' => 'No account found with this email.'], 404);
        }

        if (! $user->is_active) {
            return response()->json(['error' => 'This account has been suspended. Contact support if you believe this is a mistake.'], 403);
        }

        Auth::login($user, remember: true);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'name' => $user->name,
                'accountType' => $user->account_type,
            ],
        ]);
    }

    private function sendCode(string $email, string $purpose): JsonResponse
    {
        $result = $this->otp->generate($email, $purpose);

        if ($result === null) {
            return response()->json(['error' => 'Please wait before requesting another code.'], 429);
        }

        Mail::to($email)->send(new OtpCodeMail($result['code']));

        return response()->json(['ok' => true]);
    }

    /**
     * @return JsonResponse|null null means verification succeeded.
     */
    private function verifyOrError(string $email, string $purpose, string $code): ?JsonResponse
    {
        $error = $this->otp->verifyWithError($email, $purpose, $code);

        return $error ? response()->json(['error' => $error], 400) : null;
    }

    private function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'business';
        $slug = $base;
        $suffix = 1;
        while (Business::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
