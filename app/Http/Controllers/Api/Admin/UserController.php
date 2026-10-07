<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::orderByDesc('created_at');
        if ($type = $request->query('type')) {
            $query->where('account_type', $type);
        }
        $users = $query->get();

        $userIds = $users->pluck('id');
        $businessIds = $users->pluck('business_id')->filter()->unique();

        $businessesById = $businessIds->isNotEmpty() ? Business::whereIn('id', $businessIds)->get()->keyBy('id') : collect();
        $ownedBusinesses = Business::whereIn('owner_id', $userIds)->get()->keyBy('owner_id');

        $result = $users->map(function (User $u) use ($businessesById, $ownedBusinesses) {
            return [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'displayName' => $u->name,
                'accountType' => $u->account_type,
                'plan' => $u->plan,
                'planExpiresAt' => $u->plan_expires_at,
                'businessId' => $u->business_id,
                'createdAt' => $u->created_at,
                'isActive' => $u->is_active,
                'business' => $u->business_id && $businessesById->has($u->business_id) ? ['name' => $businessesById->get($u->business_id)->name] : null,
                'ownedBusiness' => $ownedBusinesses->has($u->id) ? ['name' => $ownedBusinesses->get($u->id)->name] : null,
            ];
        });

        return response()->json(['users' => $result]);
    }

    public function store(Request $request): JsonResponse
    {
        $email = $request->input('email');
        $username = $request->input('username');
        $password = $request->input('password');
        $accountType = $request->input('accountType');
        $businessId = $request->input('businessId');

        if (! $email || ! $username || ! $password) {
            return response()->json(['error' => 'Email, username and password are required'], 400);
        }
        if (! in_array($accountType, ['individual', 'employee'], true)) {
            return response()->json(['error' => 'accountType must be individual or employee'], 400);
        }
        if ($accountType === 'employee' && ! $businessId) {
            return response()->json(['error' => 'businessId is required for employee accounts'], 400);
        }

        if (User::where('email', $email)->orWhere('username', $username)->exists()) {
            return response()->json(['error' => 'A user with this email or username already exists'], 409);
        }

        $user = User::create([
            'email' => $email,
            'username' => $username,
            'password' => $password,
            'name' => $request->input('displayName') ?: $username,
            'account_type' => $accountType,
            'business_id' => $accountType === 'employee' ? $businessId : null,
        ]);

        return response()->json(['user' => [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'accountType' => $user->account_type,
        ]], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $isActive = $request->input('isActive');
        if (! is_bool($isActive)) {
            return response()->json(['error' => 'isActive must be a boolean'], 400);
        }
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'You cannot suspend your own account'], 400);
        }

        $user->update(['is_active' => $isActive]);

        return response()->json(['user' => ['id' => $user->id, 'isActive' => $user->is_active]]);
    }
}
