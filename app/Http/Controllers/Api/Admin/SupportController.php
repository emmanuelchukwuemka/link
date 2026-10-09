<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\SupportMessage;
use App\Models\User;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function index(): JsonResponse
    {
        $messages = SupportMessage::orderByDesc('created_at')->get();

        $userIds = $messages->pluck('user_id')->unique();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');
        $profiles = Profile::whereIn('user_id', $userIds)->oldest()->get()->unique('user_id')->keyBy('user_id');
        $usersById = $users->map(fn (User $u) => [
            'id' => $u->id,
            'username' => $profiles->get($u->id)?->username,
            'displayName' => $profiles->get($u->id)?->name ?? $u->name,
            'avatarUrl' => $profiles->get($u->id)?->avatar_url,
            'accountType' => $u->account_type,
        ]);

        $grouped = $messages->groupBy('user_id');

        $conversations = $grouped->map(function ($msgs, $userId) use ($usersById) {
            $first = $msgs->first();

            return [
                'user' => $usersById->get($userId),
                'lastMessage' => $first->body,
                'lastSender' => $first->sender,
                'updatedAt' => $first->created_at,
                'unreadCount' => $msgs->where('sender', 'user')->where('read', false)->count(),
            ];
        })->sortByDesc('updatedAt')->values();

        return response()->json(['conversations' => $conversations]);
    }

    public function show(string $userId): JsonResponse
    {
        $user = User::find($userId);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $messages = SupportMessage::where('user_id', $userId)->orderBy('created_at')->get();
        $profile = Profile::where('user_id', $userId)->oldest()->first();

        return response()->json([
            'user' => ['id' => $user->id, 'username' => $profile?->username, 'displayName' => $profile?->name ?? $user->name, 'avatarUrl' => $profile?->avatar_url, 'accountType' => $user->account_type],
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, string $userId, NotifyService $notify): JsonResponse
    {
        $body = trim((string) $request->input('body'));
        if (! $body) {
            return response()->json(['error' => 'Message cannot be empty'], 400);
        }

        $user = User::find($userId);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $message = SupportMessage::create(['user_id' => $userId, 'sender' => 'admin', 'body' => $body]);

        $notify->notify($userId, 'SUPPORT_REPLY', 'New reply from support', mb_substr($body, 0, 140), '/dashboard');

        return response()->json(['message' => $message], 201);
    }

    public function markRead(string $userId): JsonResponse
    {
        SupportMessage::where('user_id', $userId)->where('sender', 'user')->where('read', false)->update(['read' => true]);

        return response()->json(['success' => true]);
    }
}
