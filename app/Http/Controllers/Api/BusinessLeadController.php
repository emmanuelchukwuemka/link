<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessLeadController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $business = Business::where('owner_id', $request->user()->id)->first();
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $employeeIds = User::where('business_id', $business->id)->pluck('id')->push($request->user()->id);

        $leads = Lead::whereIn('owner_id', $employeeIds)
            ->orderByDesc('created_at')
            ->with('owner:id,username,name')
            ->get()
            ->map(function (Lead $l) {
                $arr = $l->toArray();
                $arr['owner'] = $l->owner ? ['username' => $l->owner->username, 'displayName' => $l->owner->name] : null;

                return $arr;
            });

        return response()->json(['leads' => $leads]);
    }
}
