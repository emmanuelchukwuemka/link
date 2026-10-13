<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    /**
     * Gates a page route behind a specific staff permission. Admins always
     * pass (see User::hasPermission()); staff need that exact permission
     * granted; everyone else is redirected, same failure path as EnsureAdmin.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user->is_active) {
            Auth::logout();

            return redirect()->route('login');
        }

        if (! $user->hasPermission($permission)) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
