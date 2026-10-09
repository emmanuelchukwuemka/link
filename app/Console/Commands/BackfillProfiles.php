<?php

namespace App\Console\Commands;

use App\Models\Profile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One-time backfill for multi-profile support: every existing user gets
 * exactly one Profile created from their current profile-ish fields
 * (username, bio, appearance, plan, etc.), and every row they own in a
 * profile-scoped table (links, social_links, cards, analytics_events,
 * leads, services, portfolio_items, testimonials, store_products,
 * categories, subscription_payments) gets profile_id backfilled to point
 * at that new profile. Existing public URLs keep working unchanged, since
 * each user's one profile inherits their current username.
 */
class BackfillProfiles extends Command
{
    protected $signature = 'app:backfill-profiles {--dry-run : Report counts without writing anything}';

    protected $description = 'Create one profile per existing user and backfill profile_id on their content';

    private array $contentTables = [
        'links', 'social_links', 'cards', 'analytics_events',
        'services', 'portfolio_items', 'testimonials', 'store_products',
        'categories', 'subscription_payments',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if (Profile::query()->exists()) {
            $this->error('profiles table is not empty — this command is meant to run exactly once. Aborting.');

            return self::FAILURE;
        }

        $this->info($dryRun ? 'DRY RUN — no writes will happen.' : 'Backfilling profiles...');

        try {
            DB::transaction(function () use ($dryRun) {
                $this->backfill($dryRun);

                if ($dryRun) {
                    throw new \RuntimeException('__dry_run_rollback__');
                }
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() !== '__dry_run_rollback__') {
                throw $e;
            }
        }

        $this->info('Done.');

        return self::SUCCESS;
    }

    private function backfill(bool $dryRun): void
    {
        // users still has the original profile columns at this point (the
        // migration that drops them runs separately, after this command and
        // a verification pass) - read them directly via query builder since
        // the User model's $fillable no longer lists them.
        $users = DB::table('users')->get();
        $this->line("users: {$users->count()} rows");

        foreach ($users as $u) {
            $profileId = DB::table('profiles')->insertGetId([
                'user_id' => $u->id,
                'username' => $u->username,
                'name' => $u->name,
                'job_title' => $u->job_title,
                'department' => $u->department,
                'bio' => $u->bio,
                'about_text' => $u->about_text,
                'avatar_url' => $u->avatar_url,
                'show_avatar' => $u->show_avatar,
                'social_position' => $u->social_position,
                'phone' => $u->phone,
                'whatsapp' => $u->whatsapp,
                'website' => $u->website,
                'address' => $u->address,
                'business_hours' => $u->business_hours,
                'lead_form_enabled' => $u->lead_form_enabled,
                'theme' => $u->theme,
                'template' => $u->template,
                'bg_type' => $u->bg_type,
                'bg_color' => $u->bg_color,
                'bg_gradient' => $u->bg_gradient,
                'bg_image' => $u->bg_image,
                'button_style' => $u->button_style,
                'button_size' => $u->button_size,
                'button_color' => $u->button_color,
                'button_text_color' => $u->button_text_color,
                'font_family' => $u->font_family,
                'text_color' => $u->text_color,
                'plan' => $u->plan,
                'plan_expires_at' => $u->plan_expires_at,
                'created_at' => $u->created_at,
                'updated_at' => $u->updated_at,
            ]);

            foreach ($this->contentTables as $table) {
                $n = DB::table($table)->where('user_id', $u->id)->update(['profile_id' => $profileId]);
                if ($n > 0) {
                    $this->line("  user {$u->id} -> profile {$profileId}: {$table} ({$n} rows)");
                }
            }

            // leads uses owner_id, not user_id
            $n = DB::table('leads')->where('owner_id', $u->id)->update(['profile_id' => $profileId]);
            if ($n > 0) {
                $this->line("  user {$u->id} -> profile {$profileId}: leads ({$n} rows)");
            }
        }
    }
}
