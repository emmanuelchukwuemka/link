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
        // users.business_id and businesses.owner_id reference each other, so neither
        // table can declare its FK inline at creation time — added here once both exist.
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('business_id')->references('id')->on('businesses')->nullOnDelete();
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->foreign('owner_id')->references('id')->on('users')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropForeign(['owner_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['business_id']);
        });
    }
};
