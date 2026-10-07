<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $user = $request->user();
        $data = $request->all();

        $updateData = [];
        foreach (self::ALLOWED_FIELDS as $jsKey => $column) {
            if (array_key_exists($jsKey, $data)) {
                $updateData[$column] = $data[$jsKey];
            }
        }

        $needsProCheck = ($updateData['lead_form_enabled'] ?? null) === true
            || (array_key_exists('font_family', $updateData) && ! in_array($updateData['font_family'], config('plans.free_fonts'), true));

        if ($needsProCheck && ! $user->isProActive()) {
            if (($updateData['lead_form_enabled'] ?? null) === true) {
                return response()->json(['error' => 'Lead capture is a Pro feature. Upgrade to enable it.'], 403);
            }
            if (array_key_exists('font_family', $updateData)) {
                return response()->json(['error' => 'That font is a Pro feature. Upgrade to unlock more fonts.'], 403);
            }
        }

        $user->update($updateData);

        return response()->json(['user' => $user->fresh()->makeHidden(['password', 'remember_token'])]);
    }
}
