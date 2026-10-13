<?php

namespace App\Support;

/**
 * The set of grantable staff permissions. Each key gates one admin-panel
 * section (route middleware + sidebar visibility); the main admin picks
 * which ones a given staff account has via Admin > Staff.
 */
class StaffPermissions
{
    public const MANAGE_PROFILES = 'manage_profiles';

    public const PROCESS_ORDERS = 'process_orders';

    public const LABELS = [
        self::MANAGE_PROFILES => 'Set up & manage user profiles',
        self::PROCESS_ORDERS => 'View & process orders',
    ];

    public static function all(): array
    {
        return array_keys(self::LABELS);
    }

    public static function isValid(string $key): bool
    {
        return array_key_exists($key, self::LABELS);
    }
}
