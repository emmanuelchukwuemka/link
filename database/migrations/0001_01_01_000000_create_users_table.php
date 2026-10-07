<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();

            $table->string('account_type')->default('individual');
            $table->boolean('is_active')->default(true);

            // Profile content
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->text('bio')->nullable();
            $table->text('about_text')->nullable();
            $table->string('avatar_url')->nullable();
            $table->boolean('show_avatar')->default(true);
            $table->string('social_position')->default('top');
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('website')->nullable();
            $table->string('address')->nullable();
            $table->string('business_hours')->nullable();
            $table->boolean('lead_form_enabled')->default(false);

            // Appearance (profile theming)
            $table->string('theme')->default('default');
            $table->string('template')->default('minimal');
            $table->string('bg_type')->default('solid');
            $table->string('bg_color')->default('#f3f3f1');
            $table->string('bg_gradient')->nullable();
            $table->string('bg_image')->nullable();
            $table->string('button_style')->default('rounded');
            $table->string('button_size')->default('medium');
            $table->string('button_color')->default('#ffffff');
            $table->string('button_text_color')->default('#000000');
            $table->string('font_family')->default('Inter');
            $table->string('text_color')->default('#000000');

            // Subscription
            $table->string('plan')->default('free');
            $table->timestamp('plan_expires_at')->nullable();

            // business_id FK added later in add_cross_references_to_users_and_businesses
            // (circular FK with the businesses table, which doesn't exist yet at this point).
            $table->foreignId('business_id')->nullable();

            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
