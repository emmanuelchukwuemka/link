<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusinessAdmin
{
    /**
     * Mirrors the old app's requireRole('business_admin') — these are JSON
     * endpoints, so unlike EnsureAdmin (page routes) this returns a 403
     * instead of redirecting.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->account_type !== 'business_admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
