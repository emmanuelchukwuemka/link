<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\ProfileTransfer;
use App\Models\User;
use App\Services\NotifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileTransferController extends Controller
{
    /**
     * Every profile-scoped content table also carries its own user_id
     * (owner_id for leads) column — mostly a legacy holdover now that
     * profile_id is the real scoping key, but it's still what cascadeOnDelete
     * on users.id acts on. Left pointing at the old owner, deleting their
     * account would silently cascade-delete the new owner's content even
     * though the profile itself correctly moved — so this has to be
     * repointed to the recipient as part of accepting a transfer.
     */
    // subscription_payments deliberately excluded: it's a financial record of
    // who actually paid, which should stay attributed to the original payer
    // even after the profile itself changes hands.
    private const CONTENT_TABLES = [
        'links', 'social_links', 'cards', 'analytics_events',
        'services', 'portfolio_items', 'testimonials', 'store_products',
        'categories',
    ];

    /**
     * Starts a transfer: the recipient must accept before anything actually
     * moves (see accept()) — this just records the offer and notifies them.
     */
    public function store(Request $request, NotifyService $notify): JsonResponse
    {
        $validated = $request->validate([
            'profileId' => ['required', 'integer'],
            'toUsername' => ['required', 'string'],
        ]);

        $user = $request->user();
        $profile = $user->profiles()->find($validated['profileId']);

        if (! $profile) {
            return response()->json(['error' => 'Profile not found'], 404);
        }

        if ($user->profiles()->count() <= 1) {
            return response()->json(['error' => "You can't transfer your only profile — you'd be left with none."], 422);
        }

        $toUsername = strtolower(ltrim($validated['toUsername'], '@'));
        $toProfile = Profile::where('username', $toUsername)->first();

        if (! $toProfile) {
            return response()->json(['error' => "No account found with username \"{$toUsername}\""], 404);
        }

        if ($toProfile->user_id === $user->id) {
            return response()->json(['error' => "That's your own account."], 422);
        }

        $toUser = $toProfile->user;

        if (in_array($toUser->account_type, ['admin', 'staff'], true)) {
            return response()->json(['error' => 'Cannot transfer a profile to an admin or staff account.'], 422);
        }

        if (ProfileTransfer::where('profile_id', $profile->id)->where('status', 'pending')->exists()) {
            return response()->json(['error' => 'This profile already has a pending transfer. Cancel it first to start a new one.'], 409);
        }

        $transfer = ProfileTransfer::create([
            'profile_id' => $profile->id,
            'from_user_id' => $user->id,
            'to_user_id' => $toUser->id,
            'status' => 'pending',
        ]);

        $notify->notify(
            $toUser->id,
            'PROFILE_TRANSFER_INCOMING',
            'Someone wants to transfer a profile to you',
            "@{$profile->username} (\"{$profile->name}\") has been offered to your account. Review it on your dashboard.",
            '/dashboard',
        );

        return response()->json(['transfer' => $transfer], 201);
    }

    public function outgoing(Request $request): JsonResponse
    {
        $transfers = ProfileTransfer::where('from_user_id', $request->user()->id)
            ->where('status', 'pending')
            ->with(['profile:id,username,name', 'toUser:id'])
            ->latest()
            ->get()
            ->map(fn (ProfileTransfer $t) => [
                'id' => $t->id,
                'profile' => ['id' => $t->profile->id, 'username' => $t->profile->username, 'name' => $t->profile->name],
                'toUsername' => Profile::where('user_id', $t->to_user_id)->value('username'),
                'createdAt' => $t->created_at,
            ]);

        return response()->json(['transfers' => $transfers]);
    }

    public function incoming(Request $request): JsonResponse
    {
        $transfers = ProfileTransfer::where('to_user_id', $request->user()->id)
            ->where('status', 'pending')
            ->with('profile:id,username,name,avatar_url')
            ->latest()
            ->get()
            ->map(fn (ProfileTransfer $t) => [
                'id' => $t->id,
                'profile' => [
                    'id' => $t->profile->id,
                    'username' => $t->profile->username,
                    'name' => $t->profile->name,
                    'avatarUrl' => $t->profile->avatar_url,
                ],
                'fromUsername' => Profile::where('user_id', $t->from_user_id)->value('username'),
                'createdAt' => $t->created_at,
            ]);

        return response()->json(['transfers' => $transfers]);
    }

    public function accept(Request $request, ProfileTransfer $transfer, NotifyService $notify): JsonResponse
    {
        if ($transfer->to_user_id !== $request->user()->id || $transfer->status !== 'pending') {
            return response()->json(['error' => 'Transfer not found'], 404);
        }

        DB::transaction(function () use ($transfer) {
            $transfer->profile()->update(['user_id' => $transfer->to_user_id]);

            foreach (self::CONTENT_TABLES as $table) {
                DB::table($table)->where('profile_id', $transfer->profile_id)->update(['user_id' => $transfer->to_user_id]);
            }
            // leads uses owner_id instead of user_id for its account-reference column.
            DB::table('leads')->where('profile_id', $transfer->profile_id)->update(['owner_id' => $transfer->to_user_id]);

            $transfer->update(['status' => 'accepted', 'responded_at' => now()]);
            session(['active_profile_id' => $transfer->profile_id]);
        });

        $profile = $transfer->profile()->first();
        $notify->notify(
            $transfer->from_user_id,
            'PROFILE_TRANSFER_ACCEPTED',
            'Your profile transfer was accepted',
            "@{$profile->username} is now owned by the recipient's account.",
            null,
        );

        return response()->json(['ok' => true]);
    }

    public function decline(Request $request, ProfileTransfer $transfer, NotifyService $notify): JsonResponse
    {
        if ($transfer->to_user_id !== $request->user()->id || $transfer->status !== 'pending') {
            return response()->json(['error' => 'Transfer not found'], 404);
        }

        $transfer->update(['status' => 'declined', 'responded_at' => now()]);

        $notify->notify(
            $transfer->from_user_id,
            'PROFILE_TRANSFER_DECLINED',
            'Your profile transfer was declined',
            "@{$transfer->profile->username} is still yours — the recipient declined the transfer.",
            null,
        );

        return response()->json(['ok' => true]);
    }

    public function cancel(Request $request, ProfileTransfer $transfer): JsonResponse
    {
        if ($transfer->from_user_id !== $request->user()->id || $transfer->status !== 'pending') {
            return response()->json(['error' => 'Transfer not found'], 404);
        }

        $transfer->update(['status' => 'cancelled', 'responded_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
