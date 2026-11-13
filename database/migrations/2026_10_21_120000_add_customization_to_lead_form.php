<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('lead_form_heading')->nullable()->after('lead_form_enabled');
            $table->string('lead_form_subtext')->nullable()->after('lead_form_heading');
            // Comma-separated subset of: phone, email, social, message. Null means
            // the original default set (phone, email, message), for profiles that
            // enabled the form before this column existed.
            $table->string('lead_form_fields')->nullable()->after('lead_form_subtext');
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->string('social')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['lead_form_heading', 'lead_form_subtext', 'lead_form_fields']);
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('social');
        });
    }
};
