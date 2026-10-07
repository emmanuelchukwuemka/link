<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    // The real register page is the OTP wizard (email -> code -> claim
    // username) — this matches the old app exactly, which never shows a
    // plain password signup form. RegisteredUserController::store() is kept
    // as a raw endpoint only, mirroring the old app's own unused-by-the-UI
    // /api/auth/register route.
    Route::get('register', [OtpController::class, 'createRegister'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::post('otp/request-login', [OtpController::class, 'requestLogin'])
        ->middleware('throttle:6,1')
        ->name('otp.request-login');

    Route::post('otp/verify-login', [OtpController::class, 'verifyLogin'])
        ->middleware('throttle:10,1')
        ->name('otp.verify-login');

    Route::post('otp/request-register', [OtpController::class, 'requestRegister'])
        ->middleware('throttle:6,1')
        ->name('otp.request-register');

    Route::post('otp/verify-register', [OtpController::class, 'verifyRegister'])
        ->middleware('throttle:10,1')
        ->name('otp.verify-register');

    Route::get('auth/google', [GoogleController::class, 'redirect'])
        ->name('google.redirect');

    Route::get('auth/google/callback', [GoogleController::class, 'callback'])
        ->name('google.callback');

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
