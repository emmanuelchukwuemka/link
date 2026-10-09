<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'username',
        'name',
        'job_title',
        'department',
        'bio',
        'about_text',
        'avatar_url',
        'show_avatar',
        'social_position',
        'phone',
        'whatsapp',
        'website',
        'address',
        'business_hours',
        'lead_form_enabled',
        'theme',
        'template',
        'bg_type',
        'bg_color',
        'bg_gradient',
        'bg_image',
        'button_style',
        'button_size',
        'button_color',
        'button_text_color',
        'font_family',
        'text_color',
        'plan',
        'plan_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'show_avatar' => 'boolean',
            'lead_form_enabled' => 'boolean',
            'plan_expires_at' => 'datetime',
        ];
    }

    /**
     * Public profile URLs (e.g. /{username}) resolve on username, not the numeric id.
     */
    public function getRouteKeyName(): string
    {
        return 'username';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Resolves which of the account's profiles the dashboard is currently
     * "pointed at" — set by switching profiles (stored in session), falling
     * back to the oldest/first profile for accounts that have never switched
     * or only ever had one. Dashboard API controllers scope all reads/writes
     * through this instead of the raw authenticated user id, since one
     * account can own several profiles.
     */
    public static function active(User $user): self
    {
        $requestedId = session('active_profile_id');

        if ($requestedId) {
            $profile = $user->profiles()->find($requestedId);
            if ($profile) {
                return $profile;
            }
        }

        $profile = $user->profiles()->oldest()->firstOrFail();
        session(['active_profile_id' => $profile->id]);

        return $profile;
    }

    public function cards(): HasMany
    {
        return $this->hasMany(Card::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(Link::class);
    }

    public function socialLinks(): HasMany
    {
        return $this->hasMany(SocialLink::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(PortfolioItem::class);
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class);
    }

    public function storeProducts(): HasMany
    {
        return $this->hasMany(StoreProduct::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function analyticsEvents(): HasMany
    {
        return $this->hasMany(AnalyticsEvent::class);
    }

    public function subscriptionPayments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class);
    }

    /**
     * Mirrors the old Next.js app's isProActive(plan, planExpiresAt) — Pro features
     * gate on live expiry, not a static flag, so this must be checked dynamically.
     */
    public function isProActive(): bool
    {
        return $this->plan === 'pro'
            && (! $this->plan_expires_at || $this->plan_expires_at->isFuture());
    }
}
