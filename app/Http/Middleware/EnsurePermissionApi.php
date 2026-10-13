<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermissionApi
{
    /**
     * JSON counterpart to EnsurePermission, mirroring how EnsureAdminApi
     * relates to EnsureAdmin — same check, 403 instead of a redirect.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! $request->user()->hasPermission($permission)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
