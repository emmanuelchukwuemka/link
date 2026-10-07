<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Card;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessEmployeeController extends Controller
{
    private function employeeLimit(string $plan): int
    {
        $tier = config('plans.business_plans')[$plan] ?? config('plans.business_plans.free');

        return $tier['employee_limit'] ?? PHP_INT_MAX;
    }

    private function myBusiness(Request $request): ?Business
    {
        return Business::where('owner_id', $request->user()->id)->first();
    }

    public function index(Request $request): JsonResponse
    {
        $business = $this->myBusiness($request);
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $employees = User::where('business_id', $business->id)
            ->orderByDesc('created_at')
            ->with('cards:id,code,user_id')
            ->get()
            ->map(fn (User $e) => [
                'id' => $e->id,
                'username' => $e->username,
                'email' => $e->email,
                'displayName' => $e->name,
                'jobTitle' => $e->job_title,
                'department' => $e->department,
                'createdAt' => $e->created_at,
                'cards' => $e->cards->map(fn (Card $c) => ['id' => $c->id, 'code' => $c->code])->values(),
            ]);

        return response()->json(['employees' => $employees]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->myBusiness($request);
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $email = $request->input('email');
        $username = $request->input('username');
        $password = $request->input('password');
        if (! $email || ! $username || ! $password) {
            return response()->json(['error' => 'Email, username and password are required'], 400);
        }

        $currentCount = User::where('business_id', $business->id)->count();
        $limit = $this->employeeLimit($business->plan);
        if ($currentCount >= $limit) {
            return response()->json(['error' => "Your {$business->plan} plan supports up to {$limit} team members. Upgrade to add more."], 403);
        }

        if (User::where('email', $email)->orWhere('username', $username)->exists()) {
            return response()->json(['error' => 'A user with this email or username already exists'], 409);
        }

        $employee = User::create([
            'email' => $email,
            'username' => $username,
            'password' => $password,
            'name' => $request->input('displayName') ?: $username,
            'job_title' => $request->input('jobTitle'),
            'department' => $request->input('department'),
            'account_type' => 'employee',
            'business_id' => $business->id,
        ]);

        return response()->json(['employee' => [
            'id' => $employee->id,
            'username' => $employee->username,
            'email' => $employee->email,
            'displayName' => $employee->name,
            'jobTitle' => $employee->job_title,
            'department' => $employee->department,
            'createdAt' => $employee->created_at,
        ]], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $business = $this->myBusiness($request);
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $employee = User::find($id);
        if (! $employee || $employee->business_id !== $business->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $employee->update([
            'name' => $request->input('displayName'),
            'job_title' => $request->input('jobTitle'),
            'department' => $request->input('department'),
        ]);

        return response()->json(['employee' => [
            'id' => $employee->id,
            'username' => $employee->username,
            'displayName' => $employee->name,
            'jobTitle' => $employee->job_title,
            'department' => $employee->department,
        ]]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $business = $this->myBusiness($request);
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $employee = User::find($id);
        if (! $employee || $employee->business_id !== $business->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $employee->update(['business_id' => null, 'account_type' => 'individual']);
        Card::where('user_id', $id)->where('business_id', $business->id)
            ->update(['user_id' => null, 'status' => 'unassigned', 'assigned_at' => null]);

        return response()->json(['success' => true]);
    }

    private function slugifyUsername(string $email, string $name): string
    {
        $base = preg_replace('/[^a-z0-9]+/', '', strtolower(strtok($email, '@') ?: $name));

        return $base ?: 'employee';
    }

    public function bulk(Request $request): JsonResponse
    {
        $business = $this->myBusiness($request);
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $csv = $request->input('csv');
        if (! $csv || ! is_string($csv)) {
            return response()->json(['error' => 'CSV text is required'], 400);
        }

        $rows = array_values(array_filter(
            array_map(fn ($line) => str_getcsv($line), preg_split('/\r\n|\r|\n/', trim($csv))),
            fn ($row) => count(array_filter($row, fn ($c) => trim((string) $c) !== '')) > 0,
        ));

        if (count($rows) < 2) {
            return response()->json(['error' => 'CSV must have a header row and at least one data row'], 400);
        }

        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $rows[0]);
        $col = function (string $needle) use ($header) {
            foreach ($header as $i => $h) {
                if (str_contains($h, $needle)) {
                    return $i;
                }
            }

            return -1;
        };

        $nameIdx = $col('name');
        $emailIdx = $col('email');
        $phoneIdx = $col('phone');
        $jobIdx = $col('job') !== -1 ? $col('job') : $col('title');
        $deptIdx = $col('department') !== -1 ? $col('department') : $col('dept');
        $photoIdx = $col('photo') !== -1 ? $col('photo') : $col('avatar');
        $cardIdx = $col('card');

        if ($nameIdx === -1 || $emailIdx === -1) {
            return response()->json(['error' => 'CSV must include at least "Full name" and "Email" columns'], 400);
        }

        $dataRows = array_slice($rows, 1);
        $currentCount = User::where('business_id', $business->id)->count();
        $limit = $this->employeeLimit($business->plan);
        if ($currentCount + count($dataRows) > $limit) {
            return response()->json(['error' => "Your {$business->plan} plan supports up to {$limit} team members (currently {$currentCount}). This upload would exceed that — upgrade your plan or reduce the list."], 403);
        }

        $created = [];
        $skipped = [];

        foreach ($dataRows as $i => $cols) {
            $displayName = trim((string) ($cols[$nameIdx] ?? ''));
            $email = trim((string) ($cols[$emailIdx] ?? ''));
            $phone = $phoneIdx !== -1 ? trim((string) ($cols[$phoneIdx] ?? '')) : null;
            $jobTitle = $jobIdx !== -1 ? trim((string) ($cols[$jobIdx] ?? '')) : null;
            $department = $deptIdx !== -1 ? trim((string) ($cols[$deptIdx] ?? '')) : null;
            $avatarUrl = $photoIdx !== -1 ? (trim((string) ($cols[$photoIdx] ?? '')) ?: null) : null;
            $cardCode = $cardIdx !== -1 ? strtoupper(trim((string) ($cols[$cardIdx] ?? ''))) : null;

            if (! $displayName || ! $email) {
                $skipped[] = ['row' => $i + 2, 'reason' => 'Missing name or email'];

                continue;
            }

            if (User::where('email', $email)->exists()) {
                $skipped[] = ['row' => $i + 2, 'reason' => "Email {$email} already registered"];

                continue;
            }

            $username = $this->slugifyUsername($email, $displayName);
            $suffix = 1;
            while (User::where('username', $username)->exists()) {
                $username = $this->slugifyUsername($email, $displayName).($suffix++);
            }

            $tempPassword = substr(bin2hex(random_bytes(6)), 0, 8);

            $employee = User::create([
                'email' => $email,
                'username' => $username,
                'password' => $tempPassword,
                'name' => $displayName,
                'phone' => $phone ?: null,
                'job_title' => $jobTitle ?: null,
                'department' => $department ?: null,
                'avatar_url' => $avatarUrl,
                'account_type' => 'employee',
                'business_id' => $business->id,
            ]);

            if ($cardCode) {
                $card = Card::where('code', $cardCode)->first();
                if ($card && ($card->business_id === $business->id || (! $card->business_id && ! $card->user_id))) {
                    $card->update(['user_id' => $employee->id, 'business_id' => $business->id, 'status' => 'active', 'assigned_at' => now()]);
                }
            }

            $created[] = ['displayName' => $displayName, 'username' => $username, 'email' => $email, 'tempPassword' => $tempPassword];
        }

        return response()->json(['created' => $created, 'skipped' => $skipped], 201);
    }
}
