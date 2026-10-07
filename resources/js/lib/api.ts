// Several auth pages (login/register OTP wizards) are ported near-verbatim from
// the old Next.js app's plain fetch()-based flow rather than Inertia's
// useForm()/post() helpers, since they need multi-step client-side state
// (step 1 -> step 2 -> step 3) without a full page visit between steps. This
// starter kit has no axios/bootstrap.js, so XSRF has to be attached by hand.
function xsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export async function apiFetch(
    url: string,
    body?: unknown,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    return { ok: res.ok, status: res.status, data };
}
