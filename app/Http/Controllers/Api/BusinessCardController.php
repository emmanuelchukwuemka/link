<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Card;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessCardController extends Controller
{
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

        $employeeIds = User::where('business_id', $business->id)->pluck('id');

        $cards = Card::where('business_id', $business->id)
            ->orWhereIn('user_id', $employeeIds)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Card $c) {
                $arr = $c->toArray();
                $arr['user'] = $c->user ? ['id' => $c->user->id, 'username' => $c->user->username, 'displayName' => $c->user->name] : null;

                return $arr;
            });

        return response()->json(['cards' => $cards]);
    }

    public function assign(Request $request, string $code): JsonResponse
    {
        $business = $this->myBusiness($request);
        if (! $business) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $employeeId = $request->input('employeeId');

        $card = Card::where('code', $code)->first();
        if (! $card || $card->business_id !== $business->id) {
            return response()->json(['error' => 'This card is not part of your business pool'], 404);
        }

        if ($employeeId) {
            $employee = User::find($employeeId);
            if (! $employee || $employee->business_id !== $business->id) {
                return response()->json(['error' => 'That employee is not on your team'], 400);
            }

            $card->update(['user_id' => $employeeId, 'status' => 'active', 'assigned_at' => now()]);
        } else {
            $card->update(['user_id' => null, 'status' => 'reserved', 'assigned_at' => null]);
        }

        return response()->json(['card' => $card->fresh()]);
    }
}
