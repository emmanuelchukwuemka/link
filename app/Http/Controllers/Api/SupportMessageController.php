<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\User;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportMessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $messages = SupportMessage::where('user_id', $userId)->orderBy('created_at')->get();
        $unreadCount = SupportMessage::where('user_id', $userId)->where('sender', 'admin')->where('read', false)->count();

        return response()->json(['messages' => $messages, 'unreadCount' => $unreadCount]);
    }

    public function store(Request $request, NotifyService $notify): JsonResponse
    {
        $body = trim((string) $request->input('body'));
        if ($body === '') {
            return response()->json(['error' => 'Message cannot be empty'], 400);
        }

        $user = $request->user();

        $message = SupportMessage::create(['user_id' => $user->id, 'sender' => 'user', 'body' => $body]);

        User::where('account_type', 'admin')->get()->each(function (User $admin) use ($notify, $user, $body) {
            $notify->notify(
                $admin->id,
                'SUPPORT_MESSAGE',
                "New support message from {$user->name}",
                substr($body, 0, 140),
                "/admin/support/{$user->id}",
            );
        });

        return response()->json(['message' => $message], 201);
    }

    public function markRead(Request $request): JsonResponse
    {
        SupportMessage::where('user_id', $request->user()->id)
            ->where('sender', 'admin')
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['success' => true]);
    }
}
