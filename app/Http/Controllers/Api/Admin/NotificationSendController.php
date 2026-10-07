<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationSendController extends Controller
{
    public function __invoke(Request $request, NotifyService $notify): JsonResponse
    {
        $username = $request->input('username');
        $broadcast = $request->boolean('broadcast');
        $title = $request->input('title');
        $message = $request->input('message');
        $link = $request->input('link');

        if (! $title || ! $message) {
            return response()->json(['error' => 'Title and message are required'], 400);
        }

        if ($broadcast) {
            $users = User::all();
            foreach ($users as $user) {
                $notify->notify($user->id, 'ADMIN_BROADCAST', $title, $message, $link);
            }

            return response()->json(['sent' => $users->count()]);
        }

        if (! $username) {
            return response()->json(['error' => 'A username or broadcast flag is required'], 400);
        }

        $user = User::where('username', $username)->first();
        if (! $user) {
            return response()->json(['error' => "No user found with username \"{$username}\""], 404);
        }

        $notify->notify($user->id, 'ADMIN_MESSAGE', $title, $message, $link);

        return response()->json(['sent' => 1]);
    }
}
