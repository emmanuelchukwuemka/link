<?php

namespace App\Console\Commands;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BootstrapAdmin extends Command
{
    /**
     * Create or promote a user to admin. Replaces the old Next.js app's
     * secret-gated, no-role-check /api/admin/bootstrap HTTP endpoint (needed there
     * only because that host has no shell access) — this one is local/CLI-only
     * and never reachable over HTTP.
     *
     * @var string
     */
    protected $signature = 'app:bootstrap-admin {email} {--password=} {--force : Promote even if another admin already exists}';

    protected $description = 'Create or promote a user to admin';

    public function handle(): int
    {
        $email = $this->argument('email');

        $existingAdmin = User::where('account_type', 'admin')->where('email', '!=', $email)->first();

        if ($existingAdmin && ! $this->option('force')) {
            $this->error("An admin already exists ({$existingAdmin->email}). Pass --force to add another.");

            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->update(['account_type' => 'admin', 'is_active' => true]);
            $this->info("Promoted existing user {$email} to admin.");

            return self::SUCCESS;
        }

        $password = $this->option('password') ?: Str::random(16);

        $username = Str::slug(Str::before($email, '@'), '');
        $suffix = 1;
        $base = $username;
        while (Profile::where('username', $username)->exists()) {
            $username = $base.$suffix++;
        }

        $user = User::create([
            'name' => 'Admin',
            'email' => $email,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
            'account_type' => 'admin',
        ]);

        Profile::create([
            'user_id' => $user->id,
            'username' => $username,
            'name' => 'Admin',
        ]);

        $this->info("Created admin {$email} (username: {$username}).");

        if (! $this->option('password')) {
            $this->warn("Generated password: {$password}");
        }

        return self::SUCCESS;
    }
}
