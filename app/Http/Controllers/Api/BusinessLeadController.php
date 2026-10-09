<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Lead;
use App\Models\Profile;
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
            ->with('owner:id,name')
            ->get();

        $profilesByUser = Profile::whereIn('user_id', $employeeIds)->oldest()->get()->unique('user_id')->keyBy('user_id');

        $leadsOut = $leads->map(function (Lead $l) use ($profilesByUser) {
            $arr = $l->toArray();
            $profile = $profilesByUser->get($l->owner_id);
            $arr['owner'] = $l->owner ? ['username' => $profile?->username, 'displayName' => $l->owner->name] : null;

            return $arr;
        });

        return response()->json(['leads' => $leadsOut]);
    }
}
