<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonateController extends Controller
{
    /**
     * Lets an admin (or a staff member with manage_profiles) "become" a
     * regular user to build out their profile/links/appearance/etc. using
     * the exact same dashboard a real user would use — rather than
     * duplicating that whole editor behind a separate admin-only UI.
     * Blocks impersonating other admin/staff accounts, to avoid turning this
     * into a privilege-escalation path between admin-panel personnel.
     */
    public function start(Request $request, User $user): JsonResponse
    {
        if (in_array($user->account_type, ['admin', 'staff'], true)) {
            return response()->json(['error' => 'Cannot impersonate an admin or staff account'], 403);
        }

        $request->session()->put('impersonator_id', $request->user()->id);
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['ok' => true]);
    }

    public function stop(Request $request): RedirectResponse
    {
        $impersonatorId = $request->session()->pull('impersonator_id');

        if ($impersonatorId) {
            Auth::loginUsingId($impersonatorId);
            $request->session()->regenerate();
        }

        return redirect('/admin');
    }
}
