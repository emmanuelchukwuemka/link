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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // RESTRICT — can't delete a product that's part of order history.
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('color')->nullable();
            $table->boolean('customization')->default(false);
            $table->text('customization_notes')->nullable();
            $table->string('customization_file_url')->nullable();
            $table->integer('quantity');
            $table->double('unit_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
