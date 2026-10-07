<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'email_verified_at',
        'password',
        'account_type',
        'is_active',
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
        'business_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
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

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function ownedBusiness(): HasOne
    {
        return $this->hasOne(Business::class, 'owner_id');
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

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'owner_id');
    }

    public function analyticsEvents(): HasMany
    {
        return $this->hasMany(AnalyticsEvent::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function supportMessages(): HasMany
    {
        return $this->hasMany(SupportMessage::class);
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
