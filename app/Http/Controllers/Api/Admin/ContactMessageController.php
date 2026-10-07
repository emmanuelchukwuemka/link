<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    private const VALID_STATUSES = ['new', 'read', 'responded'];

    public function index(): JsonResponse
    {
        $messages = ContactMessage::orderByDesc('created_at')->get();

        return response()->json(['messages' => $messages]);
    }

    public function show(ContactMessage $contactMessage): JsonResponse
    {
        if ($contactMessage->status === 'new') {
            $contactMessage->update(['status' => 'read']);
        }

        return response()->json(['message' => $contactMessage]);
    }

    public function update(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        $status = $request->input('status');
        if (! in_array($status, self::VALID_STATUSES, true)) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        $contactMessage->update(['status' => $status]);

        return response()->json(['message' => $contactMessage->fresh()]);
    }

    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->delete();

        return response()->json(['success' => true]);
    }
}
