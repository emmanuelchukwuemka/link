<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('username')->unique();
            $table->string('name');

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

            // Appearance
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

            // Subscription (per-profile)
            $table->string('plan')->default('free');
            $table->timestamp('plan_expires_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
