<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DebugCleanup extends Command
{
    /**
     * Replaces the old Next.js app's secret-gated, no-role-check /api/admin/debug-cleanup
     * HTTP endpoint. No-op for now — there's nothing to clean up until Orders/Products
     * exist (Phase 5); add real cleanup steps here then, guarded by the same confirm().
     *
     * @var string
     */
    protected $signature = 'app:debug-cleanup {--force : Skip the confirmation prompt}';

    protected $description = 'One-off cleanup of test/placeholder data';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('This will delete test/placeholder data. Continue?')) {
            return self::FAILURE;
        }

        $this->info('Nothing to clean up yet — no cleanup targets exist in Phase 1.');

        return self::SUCCESS;
    }
}
