<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $services = Service::where('user_id', $request->user()->id)->orderBy('position')->get();

        return response()->json(['services' => $services]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->isProActive()) {
            return response()->json(['error' => 'Services are a Pro feature. Upgrade to add service listings.'], 403);
        }

        $lastPosition = Service::where('user_id', $user->id)->max('position');

        $service = Service::create([
            'name' => $request->input('name') ?: 'New Service',
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'cta_type' => $request->input('ctaType') ?: 'contact',
            'position' => $lastPosition === null ? 0 : $lastPosition + 1,
            'user_id' => $user->id,
        ]);

        return response()->json(['service' => $service], 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        if ($service->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $service->update([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'cta_type' => $request->input('ctaType'),
        ]);

        return response()->json(['service' => $service]);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        if ($service->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $service->delete();

        return response()->json(['success' => true]);
    }
}
