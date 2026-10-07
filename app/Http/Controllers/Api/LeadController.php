<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\Lead;
use App\Models\User;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    private const VALID_STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost'];

    public function index(Request $request): JsonResponse
    {
        $leads = Lead::where('owner_id', $request->user()->id)->orderByDesc('created_at')->get();

        return response()->json(['leads' => $leads]);
    }

    public function updateStatus(Request $request, Lead $lead): JsonResponse
    {
        $status = $request->input('status');
        if (! in_array($status, self::VALID_STATUSES, true)) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        if ($lead->owner_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $lead->update(['status' => $status]);

        return response()->json(['lead' => $lead]);
    }

    /**
     * Public: a visitor submits the lead capture form on someone's profile.
     */
    public function store(Request $request, NotifyService $notify): JsonResponse
    {
        $username = $request->input('username');
        $name = $request->input('name');

        if (! $username || ! $name) {
            return response()->json(['error' => 'Name is required'], 400);
        }

        $owner = User::where('username', $username)->first();
        if (! $owner || ! $owner->lead_form_enabled) {
            return response()->json(['error' => 'Lead form is not available for this profile'], 404);
        }

        $lead = Lead::create([
            'owner_id' => $owner->id,
            'name' => substr((string) $name, 0, 200),
            'phone' => $request->input('phone') ? substr((string) $request->input('phone'), 0, 50) : null,
            'email' => $request->input('email') ? substr((string) $request->input('email'), 0, 200) : null,
            'message' => $request->input('message') ? substr((string) $request->input('message'), 0, 2000) : null,
        ]);

        AnalyticsEvent::create(['user_id' => $owner->id, 'type' => 'LEAD_CREATED']);

        $notify->notify(
            $owner->id,
            'LEAD_RECEIVED',
            'New lead received',
            "{$name} sent you a message through your TapConnect profile.",
            '/dashboard/leads',
        );

        return response()->json(['lead' => ['id' => $lead->id]], 201);
    }
}
