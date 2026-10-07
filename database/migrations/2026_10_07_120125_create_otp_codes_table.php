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
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('code', 10);
            $table->enum('purpose', ['register', 'login'])->default('register');
            $table->unsignedInteger('attempts')->default(0);
            $table->dateTime('consumed_at')->nullable();
            $table->dateTime('expires_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['email', 'purpose']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
