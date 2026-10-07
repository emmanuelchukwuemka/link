<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaystackClient
{
    private const BASE = 'https://api.paystack.co';

    public function isConfigured(): bool
    {
        $key = config('services.paystack.secret_key');

        return ! empty($key) && ! str_contains($key, 'replace_me');
    }

    /**
     * @return array{authorization_url: string, access_code: string, reference: string}
     */
    public function initializeTransaction(string $email, float $amountNaira, string $reference, string $callbackUrl): array
    {
        $res = Http::withToken(config('services.paystack.secret_key'))
            ->post(self::BASE.'/transaction/initialize', [
                'email' => $email,
                'amount' => (int) round($amountNaira * 100),
                'reference' => $reference,
                'callback_url' => $callbackUrl,
            ]);

        $data = $res->json();
        if (! $res->successful() || empty($data['status'])) {
            throw new RuntimeException($data['message'] ?? 'Failed to initialize Paystack transaction');
        }

        return $data['data'];
    }

    /**
     * @return array{status: string, reference: string, amount: int, gateway_response: string}
     */
    public function verifyTransaction(string $reference): array
    {
        $res = Http::withToken(config('services.paystack.secret_key'))
            ->get(self::BASE.'/transaction/verify/'.rawurlencode($reference));

        $data = $res->json();
        if (! $res->successful() || empty($data['status'])) {
            throw new RuntimeException($data['message'] ?? 'Failed to verify Paystack transaction');
        }

        return $data['data'];
    }
}
