<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    private const VALID_STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost'];

    private function withOwner(Lead $lead): array
    {
        $arr = $lead->toArray();
        $arr['owner'] = $lead->owner ? ['username' => $lead->owner->username, 'displayName' => $lead->owner->name] : null;

        return $arr;
    }

    public function index(): JsonResponse
    {
        $leads = Lead::orderByDesc('created_at')->limit(500)->with('owner')->get()->map(fn (Lead $l) => $this->withOwner($l));

        return response()->json(['leads' => $leads]);
    }

    public function store(Request $request): JsonResponse
    {
        $ownerId = $request->input('ownerId');
        $name = $request->input('name');

        if (! $ownerId || ! $name) {
            return response()->json(['error' => 'Owner and name are required'], 400);
        }
        if (! User::find($ownerId)) {
            return response()->json(['error' => 'Owner not found'], 404);
        }

        $lead = Lead::create([
            'owner_id' => $ownerId,
            'name' => $name,
            'email' => $request->input('email') ?: null,
            'phone' => $request->input('phone') ?: null,
            'message' => $request->input('message') ?: null,
            'source' => $request->input('source') ?: 'Other',
            'status' => $request->input('status') ?: 'new',
        ]);

        return response()->json(['lead' => $this->withOwner($lead->load('owner'))], 201);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $status = $request->input('status');
        if ($status !== null && ! in_array($status, self::VALID_STATUSES, true)) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        $data = [];
        foreach (['name', 'source', 'status', 'notes'] as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }
        foreach (['email', 'phone', 'message'] as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field) ?: null;
            }
        }

        $lead->update($data);

        return response()->json(['lead' => $this->withOwner($lead->fresh('owner'))]);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return response()->json(['success' => true]);
    }

    private function slugify(string $name): string
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);

        return trim($slug, '-') ?: 'business';
    }

    public function convert(Request $request, Lead $lead): JsonResponse
    {
        $type = $request->input('type');
        $username = $request->input('username');
        $password = $request->input('password');
        $businessName = $request->input('businessName');

        if (! in_array($type, ['individual', 'business'], true)) {
            return response()->json(['error' => 'type must be individual or business'], 400);
        }
        if (! $username || ! $password) {
            return response()->json(['error' => 'Username and temporary password are required'], 400);
        }
        if ($type === 'business' && ! $businessName) {
            return response()->json(['error' => 'Business name is required'], 400);
        }
        if (! $lead->email) {
            return response()->json(['error' => 'This lead has no email on file, so an account cannot be created'], 400);
        }
        if (User::where('email', $lead->email)->orWhere('username', $username)->exists()) {
            return response()->json(['error' => 'A user with this email or username already exists'], 409);
        }

        $account = DB::transaction(function () use ($type, $username, $password, $businessName, $lead) {
            if ($type === 'individual') {
                $user = User::create([
                    'email' => $lead->email,
                    'username' => $username,
                    'password' => $password,
                    'name' => $lead->name,
                    'phone' => $lead->phone ?: null,
                    'account_type' => 'individual',
                ]);

                return ['user' => ['id' => $user->id, 'username' => $user->username, 'email' => $user->email, 'displayName' => $user->name, 'accountType' => $user->account_type]];
            }

            $base = $this->slugify($businessName);
            $slug = $base;
            $i = 1;
            while (Business::where('slug', $slug)->exists()) {
                $slug = "{$base}-{$i}";
                $i++;
            }

            $owner = User::create([
                'email' => $lead->email,
                'username' => $username,
                'password' => $password,
                'name' => $lead->name,
                'phone' => $lead->phone ?: null,
                'account_type' => 'business_admin',
            ]);

            $business = Business::create([
                'name' => $businessName,
                'slug' => $slug,
                'owner_id' => $owner->id,
                'phone' => $lead->phone ?: null,
                'email' => $lead->email,
            ]);

            return ['business' => ['id' => $business->id, 'name' => $business->name, 'slug' => $business->slug], 'owner' => ['id' => $owner->id, 'username' => $owner->username, 'email' => $owner->email]];
        });

        $lead->update(['status' => 'converted']);

        return response()->json(['lead' => $this->withOwner($lead->fresh('owner')), 'account' => $account], 201);
    }
}
