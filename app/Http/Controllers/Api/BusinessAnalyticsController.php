<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\Business;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessAnalyticsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $business = Business::where('owner_id', $request->user()->id)->first();
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $employees = User::where('business_id', $business->id)->get();
        $employeeIds = $employees->pluck('id');

        if ($employeeIds->isEmpty()) {
            return response()->json(['employees' => [], 'totals' => ['views' => 0, 'nfcTaps' => 0, 'qrScans' => 0, 'leads' => 0]]);
        }

        $events = AnalyticsEvent::whereIn('user_id', $employeeIds)
            ->selectRaw('user_id, type, COUNT(*) as c')
            ->groupBy('user_id', 'type')
            ->get();

        $leadCounts = Lead::whereIn('owner_id', $employeeIds)
            ->selectRaw('owner_id, COUNT(*) as c')
            ->groupBy('owner_id')
            ->pluck('c', 'owner_id');

        $perEmployee = $employees->map(function (User $emp) use ($events, $leadCounts) {
            $empEvents = $events->where('user_id', $emp->id);
            $get = fn (string $type) => (int) ($empEvents->firstWhere('type', $type)->c ?? 0);

            return [
                'id' => $emp->id,
                'username' => $emp->username,
                'displayName' => $emp->name,
                'jobTitle' => $emp->job_title,
                'views' => $get('PROFILE_VIEW'),
                'nfcTaps' => $get('NFC_TAP'),
                'qrScans' => $get('QR_SCAN'),
                'leads' => (int) ($leadCounts[$emp->id] ?? 0),
            ];
        });

        $totals = [
            'views' => $perEmployee->sum('views'),
            'nfcTaps' => $perEmployee->sum('nfcTaps'),
            'qrScans' => $perEmployee->sum('qrScans'),
            'leads' => $perEmployee->sum('leads'),
        ];

        return response()->json(['employees' => $perEmployee->values(), 'totals' => $totals]);
    }
}
