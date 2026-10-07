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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            // Nullable — guest checkout is supported; the order survives account deletion.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->string('state');
            $table->string('city');
            $table->text('address');
            $table->text('delivery_instructions')->nullable();
            $table->double('delivery_fee')->default(0);
            $table->double('subtotal');
            $table->double('total');
            // Full lifecycle: order_placed -> payment_confirmed -> profile_setup_required
            // -> profile_completed -> preparing -> in_production -> quality_check ->
            // shipped -> out_for_delivery -> delivered -> activated.
            $table->string('status')->default('order_placed');
            $table->string('payment_status')->default('pending');
            $table->boolean('profile_setup_required')->default(true);
            $table->string('courier_name')->nullable();
            $table->string('tracking_number')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
