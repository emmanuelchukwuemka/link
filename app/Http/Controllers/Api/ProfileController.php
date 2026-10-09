<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    // Maps the request's camelCase field names (matching the old app's API
    // contract, so the React pages' request bodies port over unchanged) to
    // this app's snake_case DB columns.
    private const ALLOWED_FIELDS = [
        'displayName' => 'name',
        'jobTitle' => 'job_title',
        'department' => 'department',
        'bio' => 'bio',
        'aboutText' => 'about_text',
        'avatarUrl' => 'avatar_url',
        'showAvatar' => 'show_avatar',
        'socialPosition' => 'social_position',
        'phone' => 'phone',
        'whatsapp' => 'whatsapp',
        'website' => 'website',
        'address' => 'address',
        'businessHours' => 'business_hours',
        'leadFormEnabled' => 'lead_form_enabled',
        'theme' => 'theme',
        'template' => 'template',
        'bgType' => 'bg_type',
        'bgColor' => 'bg_color',
        'bgGradient' => 'bg_gradient',
        'bgImage' => 'bg_image',
        'buttonStyle' => 'button_style',
        'buttonSize' => 'button_size',
        'buttonColor' => 'button_color',
        'buttonTextColor' => 'button_text_color',
        'fontFamily' => 'font_family',
        'textColor' => 'text_color',
    ];

    public function update(Request $request): JsonResponse
    {
        $profile = Profile::active($request->user());
        $data = $request->all();

        $updateData = [];
        foreach (self::ALLOWED_FIELDS as $jsKey => $column) {
            if (array_key_exists($jsKey, $data)) {
                $updateData[$column] = $data[$jsKey];
            }
        }

        $needsProCheck = ($updateData['lead_form_enabled'] ?? null) === true
            || (array_key_exists('font_family', $updateData) && ! in_array($updateData['font_family'], config('plans.free_fonts'), true));

        if ($needsProCheck && ! $profile->isProActive()) {
            if (($updateData['lead_form_enabled'] ?? null) === true) {
                return response()->json(['error' => 'Lead capture is a Pro feature. Upgrade to enable it.'], 403);
            }
            if (array_key_exists('font_family', $updateData)) {
                return response()->json(['error' => 'That font is a Pro feature. Upgrade to unlock more fonts.'], 403);
            }
        }

        $profile->update($updateData);

        return response()->json(['user' => $profile->fresh()]);
    }

    /**
     * List every profile the account owns, flagging which one is currently
     * active in the dashboard (per Profile::active's session resolution).
     */
    public function mine(Request $request): JsonResponse
    {
        $activeId = Profile::active($request->user())->id;

        $profiles = $request->user()->profiles()->oldest()->get()->map(fn (Profile $p) => [
            'id' => $p->id,
            'username' => $p->username,
            'name' => $p->name,
            'avatarUrl' => $p->avatar_url,
            'plan' => $p->plan,
            'active' => $p->id === $activeId,
        ]);

        return response()->json(['profiles' => $profiles]);
    }

    /**
     * Creates an additional profile under the same account. Free accounts
     * are capped; Pro/Business plans on at least one existing profile raise
     * the limit (mirrors how Pro gating works elsewhere in the dashboard).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $existing = $user->profiles();
        $limit = $existing->clone()->where('plan', '!=', 'free')->exists()
            ? config('plans.pro_profile_limit', 5)
            : config('plans.free_profile_limit', 1);

        if ($existing->count() >= $limit) {
            return response()->json(['error' => "You've reached the limit of {$limit} profile(s) for your plan."], 403);
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:30', 'regex:/^[a-z0-9_-]+$/i', 'unique:profiles,username'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $profile = Profile::create([
            'user_id' => $user->id,
            'username' => strtolower($validated['username']),
            'name' => $validated['name'],
        ]);

        session(['active_profile_id' => $profile->id]);

        return response()->json(['profile' => $profile], 201);
    }

    public function switch(Request $request): JsonResponse
    {
        $validated = $request->validate(['profileId' => ['required', 'integer']]);

        $profile = $request->user()->profiles()->find($validated['profileId']);
        if (! $profile) {
            return response()->json(['error' => 'Profile not found'], 404);
        }

        session(['active_profile_id' => $profile->id]);

        return response()->json(['ok' => true]);
    }
}
