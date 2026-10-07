<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Link;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LinkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $links = Link::where('user_id', $request->user()->id)->orderBy('position')->get();

        return response()->json(['links' => $links]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $linkCount = Link::where('user_id', $user->id)->count();
        if (! $user->isProActive() && $linkCount >= config('plans.free_link_limit')) {
            $limit = config('plans.free_link_limit');

            return response()->json([
                'error' => "Free plans are limited to {$limit} links. Upgrade to Pro for unlimited links.",
            ], 403);
        }

        $lastPosition = Link::where('user_id', $user->id)->max('position');

        $link = Link::create([
            'title' => $request->input('title') ?: 'New Link',
            'url' => $request->input('url') ?: '',
            'thumbnail' => $request->input('thumbnail'),
            'icon_name' => $request->input('iconName'),
            'description' => $request->input('description'),
            'position' => $lastPosition === null ? 0 : $lastPosition + 1,
            'user_id' => $user->id,
        ]);

        return response()->json(['link' => $link], 201);
    }

    public function update(Request $request, Link $link): JsonResponse
    {
        if ($link->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $link->update([
            'title' => $request->input('title'),
            'url' => $request->input('url'),
            'thumbnail' => $request->input('thumbnail'),
            'is_active' => $request->input('isActive'),
            'icon_name' => $request->input('iconName'),
            'description' => $request->input('description'),
        ]);

        return response()->json(['link' => $link]);
    }

    public function destroy(Request $request, Link $link): JsonResponse
    {
        if ($link->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $link->delete();

        return response()->json(['success' => true]);
    }

    public function toggleActive(Request $request, Link $link): JsonResponse
    {
        if ($link->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $link->update(['is_active' => $request->input('isActive')]);

        return response()->json(['link' => $link]);
    }

    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->input('ids');
        if (! is_array($ids) || count($ids) === 0) {
            return response()->json(['error' => 'Missing ids'], 400);
        }

        $ownedIds = Link::where('user_id', $request->user()->id)->pluck('id')->all();
        if (count(array_diff($ids, $ownedIds)) > 0) {
            return response()->json(['error' => 'Not found'], 404);
        }

        DB::transaction(function () use ($ids) {
            foreach ($ids as $position => $id) {
                Link::where('id', $id)->update(['position' => $position]);
            }
        });

        return response()->json(['ok' => true]);
    }

    /**
     * Public: fired when a visitor clicks a profile link button. Link may not
     * exist — don't let click tracking break the visitor's navigation.
     */
    public function click(int $id): JsonResponse
    {
        Link::where('id', $id)->increment('clicks');

        return response()->json(['ok' => true]);
    }
}
