<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $testimonials = Testimonial::where('profile_id', Profile::active($request->user())->id)->orderBy('position')->get();

        return response()->json(['testimonials' => $testimonials]);
    }

    public function store(Request $request): JsonResponse
    {
        $profile = Profile::active($request->user());
        $lastPosition = Testimonial::where('profile_id', $profile->id)->max('position');

        $testimonial = Testimonial::create([
            'author_name' => $request->input('authorName') ?: 'Anonymous',
            'content' => $request->input('content') ?: '',
            'rating' => $request->input('rating') ?? 5,
            'position' => $lastPosition === null ? 0 : $lastPosition + 1,
            'user_id' => $profile->user_id,
            'profile_id' => $profile->id,
        ]);

        return response()->json(['testimonial' => $testimonial], 201);
    }

    public function update(Request $request, Testimonial $testimonial): JsonResponse
    {
        if ($testimonial->profile_id !== Profile::active($request->user())->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $testimonial->update([
            'author_name' => $request->input('authorName'),
            'content' => $request->input('content'),
            'rating' => $request->input('rating'),
        ]);

        return response()->json(['testimonial' => $testimonial]);
    }

    public function destroy(Request $request, Testimonial $testimonial): JsonResponse
    {
        if ($testimonial->profile_id !== Profile::active($request->user())->id) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $testimonial->delete();

        return response()->json(['success' => true]);
    }
}
