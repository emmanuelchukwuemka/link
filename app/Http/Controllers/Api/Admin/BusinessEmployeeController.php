<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class BusinessEmployeeController extends Controller
{
    public function index(string $businessId): JsonResponse
    {
        $employeeUsers = User::where('business_id', $businessId)->orderBy('name')->get();
        $profiles = Profile::whereIn('user_id', $employeeUsers->pluck('id'))->oldest()->get()->unique('user_id')->keyBy('user_id');

        $employees = $employeeUsers->map(fn (User $u) => [
            'id' => $u->id,
            'username' => $profiles->get($u->id)?->username,
            'displayName' => $profiles->get($u->id)?->name ?? $u->name,
            'jobTitle' => $profiles->get($u->id)?->job_title,
        ]);

        return response()->json(['employees' => $employees]);
    }
}
