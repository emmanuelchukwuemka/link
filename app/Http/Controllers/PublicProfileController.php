<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicProfileController extends Controller
{
    public function show(Request $request, string $user): Response
    {
        $userRow = User::where('username', $user)->first();

        if (! $userRow) {
            throw new NotFoundHttpException;
        }

        $userRow->load([
            'links' => fn ($q) => $q->where('is_active', true)->orderBy('position'),
            'socialLinks' => fn ($q) => $q->orderBy('position'),
            'services' => fn ($q) => $q->orderBy('position'),
            'portfolioItems' => fn ($q) => $q->orderBy('position'),
            'testimonials' => fn ($q) => $q->orderBy('position'),
            'storeProducts' => fn ($q) => $q->where('availability', '!=', 'hidden')->orderBy('position'),
            'business',
        ]);

        AnalyticsEvent::create(['user_id' => $userRow->id, 'type' => 'PROFILE_VIEW']);

        $organization = $userRow->business?->name;
        $displayTitle = $userRow->job_title && $organization
            ? "{$userRow->job_title} at {$organization}"
            : ($userRow->job_title ?: $organization);

        $portfolioItems = $userRow->portfolioItems;

        return Inertia::render('profile', [
            'user' => $userRow->makeHidden(['password', 'remember_token']),
            'organization' => $organization,
            'displayTitle' => $displayTitle,
            'isPro' => $userRow->isProActive(),
            'portfolioProjects' => $portfolioItems->where('type', '!=', 'gallery')->values(),
            'galleryImages' => $portfolioItems->where('type', 'gallery')->values(),
            'src' => $request->query('src'),
        ]);
    }
}
