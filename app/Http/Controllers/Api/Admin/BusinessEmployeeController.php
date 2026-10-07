<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class BusinessEmployeeController extends Controller
{
    public function index(string $businessId): JsonResponse
    {
        $employees = User::where('business_id', $businessId)
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'username' => $u->username,
                'displayName' => $u->name,
                'jobTitle' => $u->job_title,
            ]);

        return response()->json(['employees' => $employees]);
    }
}
