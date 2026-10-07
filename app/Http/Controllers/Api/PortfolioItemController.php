<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = PortfolioItem::where('user_id', $request->user()->id)->orderBy('position')->get();

        return response()->json(['items' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->isProActive()) {
            return response()->json(['error' => 'Portfolio and gallery sections are a Pro feature. Upgrade to add them.'], 403);
        }

        $type = $request->input('type') === 'gallery' ? 'gallery' : 'project';
        $lastPosition = PortfolioItem::where('user_id', $user->id)->max('position');

        $item = PortfolioItem::create([
            'title' => $request->input('title') ?: ($type === 'gallery' ? 'New Image' : 'New Project'),
            'description' => $request->input('description'),
            'image_url' => $request->input('imageUrl'),
            'video_url' => $request->input('videoUrl'),
            'type' => $type,
            'position' => $lastPosition === null ? 0 : $lastPosition + 1,
            'user_id' => $user->id,
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function update(Request $request, PortfolioItem $portfolioItem): JsonResponse
    {
        if ($portfolioItem->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $portfolioItem->update([
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'image_url' => $request->input('imageUrl'),
            'video_url' => $request->input('videoUrl'),
        ]);

        return response()->json(['item' => $portfolioItem]);
    }

    public function destroy(Request $request, PortfolioItem $portfolioItem): JsonResponse
    {
        if ($portfolioItem->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $portfolioItem->delete();

        return response()->json(['success' => true]);
    }
}
