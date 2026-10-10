<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $columns = [
        'username', 'job_title', 'department', 'bio', 'about_text',
        'avatar_url', 'show_avatar', 'social_position', 'phone', 'whatsapp',
        'website', 'address', 'business_hours', 'lead_form_enabled',
        'theme', 'template', 'bg_type', 'bg_color', 'bg_gradient', 'bg_image',
        'button_style', 'button_size', 'button_color', 'button_text_color',
        'font_family', 'text_color', 'plan', 'plan_expires_at',
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn($this->columns);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->text('bio')->nullable();
            $table->text('about_text')->nullable();
            $table->string('avatar_url')->nullable();
            $table->boolean('show_avatar')->default(true);
            $table->string('social_position')->default('top');
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('website')->nullable();
            $table->string('address')->nullable();
            $table->string('business_hours')->nullable();
            $table->boolean('lead_form_enabled')->default(false);
            $table->string('theme')->default('default');
            $table->string('template')->default('minimal');
            $table->string('bg_type')->default('solid');
            $table->string('bg_color')->default('#f3f3f1');
            $table->string('bg_gradient')->nullable();
            $table->string('bg_image')->nullable();
            $table->string('button_style')->default('rounded');
            $table->string('button_size')->default('medium');
            $table->string('button_color')->default('#ffffff');
            $table->string('button_text_color')->default('#000000');
            $table->string('font_family')->default('Inter');
            $table->string('text_color')->default('#000000');
            $table->string('plan')->default('free');
            $table->timestamp('plan_expires_at')->nullable();
        });
    }
};
