<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\CategoryTreeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::where('scope', 'marketplace')->orderBy('position')->get();
        $productCategoryNames = Product::pluck('category');

        $tree = (new CategoryTreeService)->build($categories, $productCategoryNames);

        return response()->json(['categories' => $tree]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name'));
        if (! $name) {
            return response()->json(['error' => 'Category name is required'], 400);
        }

        $parentId = $request->input('parentId') ?: null;

        if ($parentId) {
            $parent = Category::where('id', $parentId)->where('scope', 'marketplace')->first();
            if (! $parent) {
                return response()->json(['error' => 'Parent category not found'], 404);
            }
            if ($parent->parent_id) {
                return response()->json(['error' => 'Subcategories cannot be nested more than one level deep'], 400);
            }
        }

        $exists = Category::where('scope', 'marketplace')->where('parent_id', $parentId)->where('name', $name)->exists();
        if ($exists) {
            return response()->json(['error' => 'That category already exists'], 409);
        }

        $lastPosition = Category::where('scope', 'marketplace')->where('parent_id', $parentId)->max('position');
        $position = $lastPosition !== null ? $lastPosition + 1 : 0;

        $category = Category::create([
            'name' => $name,
            'scope' => 'marketplace',
            'parent_id' => $parentId,
            'position' => $position,
        ]);

        return response()->json(['category' => $category], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $name = trim((string) $request->input('name'));
        if (! $name) {
            return response()->json(['error' => 'Category name is required'], 400);
        }
        if ($category->scope !== 'marketplace') {
            return response()->json(['error' => 'Category not found'], 404);
        }

        $clash = Category::where('id', '!=', $category->id)
            ->where('scope', 'marketplace')
            ->where('parent_id', $category->parent_id)
            ->where('name', $name)
            ->exists();
        if ($clash) {
            return response()->json(['error' => 'That category already exists'], 409);
        }

        $category->update(['name' => $name]);

        return response()->json(['category' => $category->fresh()]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->scope !== 'marketplace') {
            return response()->json(['error' => 'Category not found'], 404);
        }

        $category->delete();

        return response()->json(['success' => true]);
    }

    public function reorder(Request $request): JsonResponse
    {
        $parentId = $request->input('parentId') ?: null;
        $orderedIds = $request->input('orderedIds');

        if (! is_array($orderedIds) || count($orderedIds) === 0) {
            return response()->json(['error' => 'orderedIds must be a non-empty array'], 400);
        }

        $categories = Category::whereIn('id', $orderedIds)->where('scope', 'marketplace')->get();

        if ($categories->count() !== count($orderedIds) || $categories->contains(fn (Category $c) => $c->parent_id !== $parentId)) {
            return response()->json(['error' => 'Invalid category set for reorder'], 400);
        }

        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $index => $id) {
                Category::where('id', $id)->update(['position' => $index]);
            }
        });

        return response()->json(['success' => true]);
    }
}
