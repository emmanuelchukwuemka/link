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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // 'marketplace' (platform catalog, admin-managed) or 'store' (per-user mini-shop).
            $table->string('scope')->default('marketplace');
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->cascadeOnDelete();
            $table->integer('position')->default(0);
            $table->timestamp('created_at')->useCurrent();

            // NULLs in user_id/parent_id aren't treated as equal by MySQL's unique
            // index, so this doesn't fully prevent duplicates when either is
            // null — app code double-checks before insert (matches the old schema).
            $table->unique(['scope', 'user_id', 'parent_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
