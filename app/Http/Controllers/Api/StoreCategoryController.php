<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Profile;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::where('scope', 'store')
            ->where('profile_id', Profile::active($request->user())->id)
            ->orderBy('position')
            ->get();

        return response()->json(['categories' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name'));
        if ($name === '') {
            return response()->json(['error' => 'Category name is required'], 400);
        }

        $profile = Profile::active($request->user());
        $lastPosition = Category::where('scope', 'store')->where('profile_id', $profile->id)->max('position');

        try {
            $category = Category::create([
                'name' => $name,
                'scope' => 'store',
                'user_id' => $profile->user_id,
                'profile_id' => $profile->id,
                'position' => $lastPosition === null ? 0 : $lastPosition + 1,
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['error' => 'That category already exists'], 409);
            }
            throw $e;
        }

        return response()->json(['category' => $category], 201);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        if ($category->scope !== 'store' || $category->profile_id !== Profile::active($request->user())->id) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        $category->delete();

        return response()->json(['success' => true]);
    }
}
