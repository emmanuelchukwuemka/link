<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request. Assumes the 'auth' middleware already ran
     * (registered first in the route group), so $request->user() is present.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user->is_active) {
            Auth::logout();

            return redirect()->route('login');
        }

        if ($user->account_type !== 'admin') {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
