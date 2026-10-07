<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NewsletterController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $email = $request->input('email');

        if (! is_string($email) || ! preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
            return response()->json(['error' => 'Enter a valid email address'], 400);
        }

        try {
            DB::statement('INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email', [$email]);

            return response()->json(['ok' => true], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
