<?php

namespace App\Services;

class OrderNumberGenerator
{
    public static function generate(): string
    {
        $stamp = strtoupper(dechex((int) round(microtime(true) * 1000)));
        $rand = strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));

        return "TC{$stamp}{$rand}";
    }
}
