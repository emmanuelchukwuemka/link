<?php

namespace App\Services;

use App\Models\AnalyticsEvent;
use App\Models\Card;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CardService
{
    public const PRODUCTS = ['mini', 'standard', 'wristband'];

    private const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private function randomCode(int $length = 6): string
    {
        $out = '';
        $max = strlen(self::CODE_CHARS) - 1;
        for ($i = 0; $i < $length; $i++) {
            $out .= self::CODE_CHARS[random_int(0, $max)];
        }

        return $out;
    }

    public function generateUniqueCardCode(): string
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $code = 'TC-'.$this->randomCode();
            if (! Card::where('code', $code)->exists()) {
                return $code;
            }
        }

        throw new \RuntimeException('Could not generate a unique card code');
    }

    /**
     * Reuses the NFC_TAP analytics events already written by the /c/{code}
     * redirect handler — no separate counter to keep in sync.
     *
     * @param  array<int, string>  $codes
     * @return Collection<string, array{taps30d: int, lastTap: ?Carbon}>
     */
    public function getCardTapStats(array $codes): Collection
    {
        $stats = collect();
        if (count($codes) === 0) {
            return $stats;
        }

        $since = Carbon::now()->subDays(90);
        $rows = AnalyticsEvent::where('type', 'NFC_TAP')->where('created_at', '>=', $since)->get(['meta', 'created_at']);

        $thirtyDaysAgo = Carbon::now()->subDays(30);

        foreach ($rows as $row) {
            $decoded = json_decode((string) $row->meta, true);
            $code = $decoded['cardCode'] ?? null;
            if (! $code || ! in_array($code, $codes, true)) {
                continue;
            }

            $entry = $stats->get($code) ?? ['taps30d' => 0, 'lastTap' => null];
            if ($row->created_at->greaterThanOrEqualTo($thirtyDaysAgo)) {
                $entry['taps30d']++;
            }
            if (! $entry['lastTap'] || $row->created_at->greaterThan($entry['lastTap'])) {
                $entry['lastTap'] = $row->created_at;
            }
            $stats->put($code, $entry);
        }

        return $stats;
    }
}
