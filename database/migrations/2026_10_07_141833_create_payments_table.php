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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            // RESTRICT — a payment record must never outlive the order it belongs to.
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->string('provider')->default('paystack');
            $table->string('reference')->unique();
            $table->double('amount');
            $table->string('status')->default('pending');
            $table->text('raw_response')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
