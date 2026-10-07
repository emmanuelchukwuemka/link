<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessController extends Controller
{
    public function index(): JsonResponse
    {
        $businesses = Business::orderBy('name')->get(['id', 'name', 'slug', 'plan']);

        return response()->json(['businesses' => $businesses]);
    }

    private function slugify(string $name): string
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');

        return $slug !== '' ? $slug : 'business';
    }

    private function uniqueSlug(string $name): string
    {
        $base = $this->slugify($name);
        $slug = $base;
        $i = 1;
        while (Business::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    public function store(Request $request): JsonResponse
    {
        $businessName = $request->input('businessName');
        $email = $request->input('email');
        $username = $request->input('username');
        $password = $request->input('password');
        $displayName = $request->input('displayName');

        if (! $businessName || ! $email || ! $username || ! $password) {
            return response()->json(['error' => 'Business name, owner email, username and password are required'], 400);
        }

        if (User::where('email', $email)->orWhere('username', $username)->exists()) {
            return response()->json(['error' => 'A user with this email or username already exists'], 409);
        }

        try {
            $business = DB::transaction(function () use ($businessName, $email, $username, $password, $displayName) {
                $owner = User::create([
                    'email' => $email,
                    'username' => $username,
                    'password' => $password,
                    'name' => $displayName ?: $username,
                    'account_type' => 'business_admin',
                ]);

                return Business::create([
                    'name' => $businessName,
                    'slug' => $this->uniqueSlug($businessName),
                    'owner_id' => $owner->id,
                ]);
            });

            return response()->json(['business' => ['id' => $business->id, 'name' => $business->name, 'slug' => $business->slug]], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
