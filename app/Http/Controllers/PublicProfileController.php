<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\Profile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicProfileController extends Controller
{
    public function show(Request $request, string $user): Response
    {
        $profile = Profile::where('username', $user)->first();

        if (! $profile) {
            throw new NotFoundHttpException;
        }

        $profile->load([
            'links' => fn ($q) => $q->where('is_active', true)->orderBy('position'),
            'socialLinks' => fn ($q) => $q->orderBy('position'),
            'services' => fn ($q) => $q->orderBy('position'),
            'portfolioItems' => fn ($q) => $q->orderBy('position'),
            'testimonials' => fn ($q) => $q->orderBy('position'),
            'storeProducts' => fn ($q) => $q->where('availability', '!=', 'hidden')->orderBy('position'),
            'user.business',
        ]);

        AnalyticsEvent::create(['user_id' => $profile->user_id, 'profile_id' => $profile->id, 'type' => 'PROFILE_VIEW']);

        $organization = $profile->user->business?->name;
        $displayTitle = $profile->job_title && $organization
            ? "{$profile->job_title} at {$organization}"
            : ($profile->job_title ?: $organization);

        $portfolioItems = $profile->portfolioItems;

        return Inertia::render('profile', [
            'user' => array_merge($profile->toArray(), ['business' => $profile->user->business]),
            'organization' => $organization,
            'displayTitle' => $displayTitle,
            'isPro' => $profile->isProActive(),
            'portfolioProjects' => $portfolioItems->where('type', '!=', 'gallery')->values(),
            'galleryImages' => $portfolioItems->where('type', 'gallery')->values(),
            'src' => $request->query('src'),
        ]);
    }
}
