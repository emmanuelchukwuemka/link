<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Profile;
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
        // One row per account — shows its primary (first-created) profile.
        // An account with several profiles only surfaces that one here;
        // the admin panel doesn't yet have a per-profile drill-down view.
        $primaryProfiles = Profile::whereIn('user_id', $userIds)->oldest()->get()->unique('user_id')->keyBy('user_id');

        $result = $users->map(function (User $u) use ($businessesById, $ownedBusinesses, $primaryProfiles) {
            $profile = $primaryProfiles->get($u->id);

            return [
                'id' => $u->id,
                'username' => $profile?->username,
                'email' => $u->email,
                'displayName' => $profile?->name ?? $u->name,
                'accountType' => $u->account_type,
                'plan' => $profile?->plan ?? 'free',
                'planExpiresAt' => $profile?->plan_expires_at,
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

        if (User::where('email', $email)->exists() || Profile::where('username', $username)->exists()) {
            return response()->json(['error' => 'A user with this email or username already exists'], 409);
        }

        $name = $request->input('displayName') ?: $username;

        $user = User::create([
            'email' => $email,
            'password' => $password,
            'name' => $name,
            'account_type' => $accountType,
            'business_id' => $accountType === 'employee' ? $businessId : null,
        ]);

        Profile::create([
            'user_id' => $user->id,
            'username' => $username,
            'name' => $name,
        ]);

        return response()->json(['user' => [
            'id' => $user->id,
            'username' => $username,
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
