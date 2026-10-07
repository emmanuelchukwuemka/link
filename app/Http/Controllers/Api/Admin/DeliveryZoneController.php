<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryZoneController extends Controller
{
    public function index(): JsonResponse
    {
        $zones = DeliveryZone::orderBy('name')->get();

        return response()->json(['zones' => $zones]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = $request->input('name');
        $fee = $request->input('fee');

        if (! $name || $fee === null) {
            return response()->json(['error' => 'Name and fee are required'], 400);
        }

        $zone = DeliveryZone::create(['name' => $name, 'fee' => (float) $fee]);

        return response()->json(['zone' => $zone], 201);
    }

    public function update(Request $request, DeliveryZone $deliveryZone): JsonResponse
    {
        $data = [];
        if ($request->has('name')) {
            $data['name'] = $request->input('name');
        }
        if ($request->has('fee')) {
            $data['fee'] = (float) $request->input('fee');
        }

        $deliveryZone->update($data);

        return response()->json(['zone' => $deliveryZone->fresh()]);
    }

    public function destroy(DeliveryZone $deliveryZone): JsonResponse
    {
        $deliveryZone->delete();

        return response()->json(['success' => true]);
    }
}
