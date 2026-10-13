<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use App\Support\StaffPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staff = User::where('account_type', 'staff')->orderByDesc('created_at')->get();
        $profiles = Profile::whereIn('user_id', $staff->pluck('id'))->get()->keyBy('user_id');

        $result = $staff->map(fn (User $u) => [
            'id' => $u->id,
            'username' => $profiles->get($u->id)?->username,
            'displayName' => $profiles->get($u->id)?->name ?? $u->name,
            'email' => $u->email,
            'permissions' => $u->permissions ?? [],
            'isActive' => $u->is_active,
            'createdAt' => $u->created_at,
        ]);

        return response()->json(['staff' => $result]);
    }

    public function store(Request $request): JsonResponse
    {
        $email = $request->input('email');
        $username = $request->input('username');
        $password = $request->input('password');
        $displayName = $request->input('displayName') ?: $username;
        $permissions = array_values(array_intersect((array) $request->input('permissions', []), StaffPermissions::all()));

        if (! $email || ! $username || ! $password) {
            return response()->json(['error' => 'Email, username and password are required'], 400);
        }

        if (User::where('email', $email)->exists() || Profile::where('username', $username)->exists()) {
            return response()->json(['error' => 'A user with this email or username already exists'], 409);
        }

        $staff = DB::transaction(function () use ($email, $username, $password, $displayName, $permissions) {
            $staff = User::create([
                'email' => $email,
                'password' => $password,
                'name' => $displayName,
                'account_type' => 'staff',
                'permissions' => $permissions,
            ]);

            Profile::create([
                'user_id' => $staff->id,
                'username' => $username,
                'name' => $displayName,
            ]);

            return $staff;
        });

        return response()->json(['staff' => [
            'id' => $staff->id,
            'username' => $username,
            'displayName' => $displayName,
            'email' => $staff->email,
            'permissions' => $permissions,
        ]], 201);
    }

    public function update(Request $request, User $staff): JsonResponse
    {
        if ($staff->account_type !== 'staff') {
            return response()->json(['error' => 'Not a staff account'], 404);
        }

        if ($request->has('permissions')) {
            $permissions = array_values(array_intersect((array) $request->input('permissions'), StaffPermissions::all()));
            $staff->update(['permissions' => $permissions]);
        }

        if ($request->has('isActive')) {
            $staff->update(['is_active' => (bool) $request->input('isActive')]);
        }

        return response()->json(['staff' => [
            'id' => $staff->id,
            'permissions' => $staff->permissions ?? [],
            'isActive' => $staff->is_active,
        ]]);
    }
}
