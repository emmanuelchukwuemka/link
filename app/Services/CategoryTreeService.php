<?php

namespace App\Services;

use Illuminate\Support\Collection;

class CategoryTreeService
{
    /**
     * @param  Collection<int, \App\Models\Category>  $categories
     * @param  Collection<int, string>  $productCategoryNames
     * @return array<int, array<string, mixed>>
     */
    public function build(Collection $categories, Collection $productCategoryNames): array
    {
        $directCounts = [];
        foreach ($productCategoryNames as $name) {
            $directCounts[$name] = ($directCounts[$name] ?? 0) + 1;
        }

        $byId = [];
        foreach ($categories as $c) {
            $byId[$c->id] = [
                'id' => $c->id,
                'name' => $c->name,
                'position' => $c->position,
                'parentId' => $c->parent_id,
                'directCount' => $directCounts[$c->name] ?? 0,
                'totalCount' => 0,
                'children' => [],
            ];
        }

        $roots = [];
        $childrenOf = [];
        foreach ($categories as $c) {
            if ($c->parent_id && isset($byId[$c->parent_id])) {
                $childrenOf[$c->parent_id][] = $c->id;
            } else {
                $roots[] = $c->id;
            }
        }

        $computeTotal = function (int $id) use (&$computeTotal, &$byId, $childrenOf) {
            $total = $byId[$id]['directCount'];
            foreach ($childrenOf[$id] ?? [] as $childId) {
                $total += $computeTotal($childId);
                $byId[$id]['children'][] = $byId[$childId];
            }
            $byId[$id]['totalCount'] = $total;

            return $total;
        };

        foreach ($roots as $id) {
            $computeTotal($id);
        }

        return array_map(fn ($id) => $byId[$id], $roots);
    }
}
