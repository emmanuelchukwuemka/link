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
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_url')->nullable();
            $table->text('description')->nullable();
            $table->string('website')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('category')->nullable();
            $table->string('business_hours')->nullable();
            $table->string('brand_color')->default('#000000');
            $table->string('plan')->default('free');
            $table->timestamp('plan_expires_at')->nullable();

            // owner_id FK added later in add_cross_references_to_users_and_businesses
            // (circular FK — the users table already exists, but we add the constraint
            // in one place alongside users.business_id for clarity).
            $table->foreignId('owner_id')->unique();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
