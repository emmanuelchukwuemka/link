<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\User;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function __construct(private readonly NotifyService $notify) {}

    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name'));
        $email = trim((string) $request->input('email'));
        $phone = trim((string) ($request->input('phone') ?? ''));
        $message = trim((string) $request->input('message'));

        if (! $name) {
            return response()->json(['error' => 'Please enter your name'], 400);
        }
        if (! preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
            return response()->json(['error' => 'Enter a valid email address'], 400);
        }
        if (! $message) {
            return response()->json(['error' => 'Please enter a message'], 400);
        }

        try {
            $contactMessage = ContactMessage::create([
                'name' => $name,
                'email' => $email,
                'phone' => $phone ?: null,
                'message' => $message,
            ]);

            $admins = User::where('account_type', 'admin')->get();
            foreach ($admins as $admin) {
                $this->notify->notify(
                    $admin->id,
                    'CONTACT_MESSAGE',
                    "New contact message from {$name}",
                    mb_substr($message, 0, 140),
                    "/admin/messages/{$contactMessage->id}",
                );
            }

            return response()->json(['ok' => true], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
