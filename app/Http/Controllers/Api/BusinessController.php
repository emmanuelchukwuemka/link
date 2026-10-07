<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    private const ALLOWED_FIELDS = [
        'name' => 'name',
        'logoUrl' => 'logo_url',
        'description' => 'description',
        'website' => 'website',
        'phone' => 'phone',
        'whatsapp' => 'whatsapp',
        'email' => 'email',
        'address' => 'address',
        'category' => 'category',
        'businessHours' => 'business_hours',
        'brandColor' => 'brand_color',
    ];

    public function show(Request $request): JsonResponse
    {
        $business = Business::where('owner_id', $request->user()->id)->first();

        return response()->json(['business' => $business]);
    }

    public function update(Request $request): JsonResponse
    {
        $business = Business::where('owner_id', $request->user()->id)->first();
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $updateData = [];
        foreach (self::ALLOWED_FIELDS as $wireField => $column) {
            if ($request->has($wireField)) {
                $updateData[$column] = $request->input($wireField);
            }
        }

        $business->update($updateData);

        return response()->json(['business' => $business->fresh()]);
    }
}
