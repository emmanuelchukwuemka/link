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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('subtitle')->nullable();
            $table->string('category')->default('NFC Cards');
            $table->string('sku')->nullable();
            $table->integer('stock')->default(0);
            $table->text('description')->nullable();
            $table->text('images')->nullable();
            $table->double('length')->nullable();
            $table->double('width')->nullable();
            $table->string('colors')->nullable();
            $table->double('price_regular');
            $table->double('price_sale')->nullable();
            $table->string('production_time')->default('3-5 business days');
            $table->string('availability')->default('available');
            $table->double('customization_price')->default(5000);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
