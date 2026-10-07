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
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // PROFILE_VIEW, NFC_TAP, QR_SCAN, CONTACT_SAVE, PHONE_CLICK, WHATSAPP_CLICK,
            // EMAIL_CLICK, WEBSITE_CLICK, SOCIAL_CLICK, PRODUCT_VIEW, ADD_TO_CART,
            // CHECKOUT_STARTED, ORDER_CREATED, LEAD_CREATED, BOOKING_REQUEST,
            // SERVICE_REQUEST — validated in app code, not a DB-level enum.
            $table->string('type');
            $table->text('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
