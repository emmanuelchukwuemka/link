<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $notifications = Notification::where('user_id', $userId)->orderByDesc('created_at')->limit(30)->get();
        $unreadCount = Notification::where('user_id', $userId)->where('read', false)->count();

        return response()->json(['notifications' => $notifications, 'unreadCount' => $unreadCount]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $notification->update(['read' => true]);

        return response()->json(['notification' => $notification]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)->where('read', false)->update(['read' => true]);

        return response()->json(['success' => true]);
    }
}
