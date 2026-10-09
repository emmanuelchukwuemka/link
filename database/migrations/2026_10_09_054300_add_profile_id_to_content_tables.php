<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tables whose rows belong to a specific public profile, not just the account. */
    private array $tables = [
        'links', 'social_links', 'cards', 'analytics_events', 'leads',
        'services', 'portfolio_items', 'testimonials', 'store_products',
        'categories', 'subscription_payments',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            // leads uses owner_id instead of user_id for its account-reference column.
            $after = $table === 'leads' ? 'owner_id' : 'user_id';
            Schema::table($table, function (Blueprint $blueprint) use ($after) {
                $blueprint->foreignId('profile_id')->nullable()->after($after)->constrained()->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropConstrainedForeignId('profile_id');
            });
        }
    }
};
