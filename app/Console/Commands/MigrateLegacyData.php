<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One-time import of real data from the old Next.js/Prisma-style schema
 * (varchar(191) string ids) into the new Laravel schema (auto-increment
 * bigint ids). Reads from the 'legacy' connection, writes via the default
 * connection, mapping every old string id to its new bigint id in memory
 * as it goes so foreign keys land correctly on the other side.
 *
 * otp_codes and password_reset_tokens are intentionally NOT migrated —
 * both are short-lived verification codes, meaningless to carry forward.
 */
class MigrateLegacyData extends Command
{
    protected $signature = 'app:migrate-legacy-data {--dry-run : Report counts without writing anything}';

    protected $description = 'Import users/businesses/cards/orders/etc. from the old pre-Laravel schema';

    /** @var array<string, array<string, int>> old string id => new bigint id, per table */
    private array $idMap = [];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if (! DB::connection('legacy')->getSchemaBuilder()->hasTable('User')) {
            $this->error("Legacy connection has no 'User' table — check the 'legacy' DB connection in config/database.php / .env.");

            return self::FAILURE;
        }

        $this->info($dryRun ? 'DRY RUN — no writes will happen.' : 'Importing legacy data...');

        try {
            DB::transaction(function () use ($dryRun) {
                $this->migrateUsers($dryRun);
                $this->migrateBusinesses($dryRun);
                $this->linkUsersToBusinesses($dryRun);
                $this->migrateProducts($dryRun);
                $this->migrateCategories($dryRun);
                $this->migrateCards($dryRun);
                $this->migrateOrders($dryRun);
                $this->migrateOrderItems($dryRun);
                $this->migratePayments($dryRun);
                $this->migrateSubscriptionPayments($dryRun);
                $this->migrateLinks($dryRun);
                $this->migrateSocialLinks($dryRun);
                $this->migrateNotifications($dryRun);
                $this->migrateAnalyticsEvents($dryRun);
                $this->migrateDeliveryZones($dryRun);

                if ($dryRun) {
                    // Throwing inside DB::transaction()'s closure makes it roll back
                    // everything above automatically — dry-run leaves zero trace.
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

    private function migrateUsers(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('User')->get();
        $this->line("users: {$rows->count()} rows");

        foreach ($rows as $r) {
            $newId = DB::table('users')->insertGetId([
                'name' => $r->displayName ?: $r->username,
                'username' => $r->username,
                'email' => $r->email,
                'password' => $r->password,
                'account_type' => $r->accountType,
                'is_active' => (bool) $r->isActive,
                'job_title' => $r->jobTitle,
                'department' => $r->department,
                'bio' => $r->bio,
                'about_text' => $r->aboutText,
                'avatar_url' => $r->avatarUrl,
                'phone' => $r->phone,
                'whatsapp' => $r->whatsapp,
                'website' => $r->website,
                'address' => $r->address,
                'business_hours' => $r->businessHours,
                'lead_form_enabled' => (bool) $r->leadFormEnabled,
                'theme' => $r->theme,
                'template' => $r->template,
                'bg_type' => $r->bgType,
                'bg_color' => $r->bgColor,
                'bg_gradient' => $r->bgGradient,
                'bg_image' => $r->bgImage,
                'button_style' => $r->buttonStyle,
                'button_size' => $r->buttonSize,
                'button_color' => $r->buttonColor,
                'button_text_color' => $r->buttonTextColor,
                'font_family' => $r->fontFamily,
                'text_color' => $r->textColor,
                'plan' => $r->plan,
                'plan_expires_at' => $r->planExpiresAt,
                'business_id' => null, // linked after businesses are migrated
                'created_at' => $r->createdAt,
                'updated_at' => $r->updatedAt,
            ]);

            $this->idMap['user'][$r->id] = $newId;
        }
    }

    private function migrateBusinesses(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Business')->get();
        $this->line("businesses: {$rows->count()} rows");

        foreach ($rows as $r) {
            $ownerId = $this->idMap['user'][$r->ownerId] ?? null;

            if (! $ownerId) {
                $this->warn("business {$r->id}: owner {$r->ownerId} not found, skipping");

                continue;
            }

            $newId = DB::table('businesses')->insertGetId([
                'name' => $r->name,
                'slug' => $r->slug,
                'logo_url' => $r->logoUrl,
                'description' => $r->description,
                'website' => $r->website,
                'phone' => $r->phone,
                'whatsapp' => $r->whatsapp,
                'email' => $r->email,
                'address' => $r->address,
                'category' => $r->category,
                'business_hours' => $r->businessHours,
                'brand_color' => $r->brandColor,
                'plan' => $r->plan,
                'plan_expires_at' => $r->planExpiresAt,
                'owner_id' => $ownerId,
                'created_at' => $r->createdAt,
                'updated_at' => $r->updatedAt,
            ]);

            $this->idMap['business'][$r->id] = $newId;
        }
    }

    private function linkUsersToBusinesses(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('User')->whereNotNull('businessId')->get();

        foreach ($rows as $r) {
            $userId = $this->idMap['user'][$r->id] ?? null;
            $businessId = $this->idMap['business'][$r->businessId] ?? null;

            if ($userId && $businessId) {
                DB::table('users')->where('id', $userId)->update(['business_id' => $businessId]);
            }
        }
    }

    private function migrateProducts(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Product')->get();
        $this->line("products: {$rows->count()} rows");

        foreach ($rows as $r) {
            $newId = DB::table('products')->insertGetId([
                'name' => $r->name,
                'slug' => $r->slug,
                'subtitle' => $r->subtitle,
                'category' => $r->category,
                'sku' => $r->sku,
                'stock' => $r->stock,
                'description' => $r->description,
                'images' => $r->images,
                'length' => $r->length,
                'width' => $r->width,
                'colors' => $r->colors,
                'price_regular' => $r->priceRegular,
                'price_sale' => $r->priceSale,
                'production_time' => $r->productionTime,
                'availability' => $r->availability,
                'customization_price' => $r->customizationPrice,
                'created_at' => $r->createdAt,
                'updated_at' => $r->updatedAt,
            ]);

            $this->idMap['product'][$r->id] = $newId;
        }
    }

    private function migrateCategories(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Category')->orderByRaw('parentId IS NOT NULL')->get();
        $this->line("categories: {$rows->count()} rows");

        foreach ($rows as $r) {
            $newId = DB::table('categories')->insertGetId([
                'name' => $r->name,
                'scope' => $r->scope,
                'user_id' => $r->userId ? ($this->idMap['user'][$r->userId] ?? null) : null,
                'parent_id' => $r->parentId ? ($this->idMap['category'][$r->parentId] ?? null) : null,
                'position' => $r->position,
                'created_at' => $r->createdAt,
            ]);

            $this->idMap['category'][$r->id] = $newId;
        }
    }

    private function migrateCards(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Card')->get();
        $this->line("cards: {$rows->count()} rows");

        foreach ($rows as $r) {
            DB::table('cards')->insert([
                'code' => $r->code,
                'status' => $r->status,
                'user_id' => $r->userId ? ($this->idMap['user'][$r->userId] ?? null) : null,
                'business_id' => $r->businessId ? ($this->idMap['business'][$r->businessId] ?? null) : null,
                'product' => 'standard',
                'color' => null,
                'order_id' => null,
                'batch_label' => null,
                'assigned_at' => $r->assignedAt,
                'created_at' => $r->createdAt,
                'updated_at' => $r->createdAt,
            ]);
        }
    }

    private function migrateOrders(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Order')->get();
        $this->line("orders: {$rows->count()} rows");

        foreach ($rows as $r) {
            $newId = DB::table('orders')->insertGetId([
                'order_number' => $r->orderNumber,
                'user_id' => $r->userId ? ($this->idMap['user'][$r->userId] ?? null) : null,
                'customer_name' => $r->customerName,
                'customer_email' => $r->customerEmail,
                'customer_phone' => $r->customerPhone,
                'state' => $r->state,
                'city' => $r->city,
                'address' => $r->address,
                'delivery_instructions' => $r->deliveryInstructions,
                'delivery_fee' => $r->deliveryFee,
                'subtotal' => $r->subtotal,
                'total' => $r->total,
                'status' => $r->status,
                'payment_status' => $r->paymentStatus,
                'profile_setup_required' => (bool) $r->profileSetupRequired,
                'courier_name' => $r->courierName,
                'tracking_number' => $r->trackingNumber,
                'shipped_at' => $r->shippedAt,
                'delivered_at' => $r->deliveredAt,
                'created_at' => $r->createdAt,
                'updated_at' => $r->updatedAt,
            ]);

            $this->idMap['order'][$r->id] = $newId;
        }
    }

    private function migrateOrderItems(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('OrderItem')->get();
        $this->line("order_items: {$rows->count()} rows");

        foreach ($rows as $r) {
            $orderId = $this->idMap['order'][$r->orderId] ?? null;
            $productId = $this->idMap['product'][$r->productId] ?? null;

            if (! $orderId || ! $productId) {
                $this->warn("order_item {$r->id}: missing mapped order/product, skipping");

                continue;
            }

            DB::table('order_items')->insert([
                'order_id' => $orderId,
                'product_id' => $productId,
                'color' => $r->color,
                'customization' => (bool) $r->customization,
                'customization_notes' => $r->customizationNotes,
                'customization_file_url' => $r->customizationFileUrl,
                'quantity' => $r->quantity,
                'unit_price' => $r->unitPrice,
            ]);
        }
    }

    private function migratePayments(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Payment')->get();
        $this->line("payments: {$rows->count()} rows");

        foreach ($rows as $r) {
            $orderId = $this->idMap['order'][$r->orderId] ?? null;

            if (! $orderId) {
                $this->warn("payment {$r->id}: order {$r->orderId} not found, skipping");

                continue;
            }

            DB::table('payments')->insert([
                'order_id' => $orderId,
                'provider' => $r->provider,
                'reference' => $r->reference,
                'amount' => $r->amount,
                'status' => $r->status,
                'raw_response' => $r->rawResponse,
                'created_at' => $r->createdAt,
            ]);
        }
    }

    private function migrateSubscriptionPayments(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('SubscriptionPayment')->get();
        $this->line("subscription_payments: {$rows->count()} rows");

        foreach ($rows as $r) {
            DB::table('subscription_payments')->insert([
                'user_id' => $r->userId ? ($this->idMap['user'][$r->userId] ?? null) : null,
                'business_id' => $r->businessId ? ($this->idMap['business'][$r->businessId] ?? null) : null,
                'plan' => $r->plan,
                'amount' => $r->amount,
                'reference' => $r->reference,
                'status' => $r->status,
                'raw_response' => $r->rawResponse,
                'created_at' => $r->createdAt,
            ]);
        }
    }

    private function migrateLinks(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Link')->get();
        $this->line("links: {$rows->count()} rows");

        foreach ($rows as $r) {
            $userId = $this->idMap['user'][$r->userId] ?? null;

            if (! $userId) {
                $this->warn("link {$r->id}: user {$r->userId} not found, skipping");

                continue;
            }

            DB::table('links')->insert([
                'title' => $r->title,
                'url' => $r->url,
                'thumbnail' => $r->thumbnail,
                'icon_name' => $r->iconName,
                'description' => $r->description,
                'is_active' => (bool) $r->isActive,
                'position' => $r->position,
                'clicks' => $r->clicks,
                'user_id' => $userId,
                'created_at' => $r->createdAt,
                'updated_at' => $r->updatedAt,
            ]);
        }
    }

    private function migrateSocialLinks(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('SocialLink')->get();
        $this->line("social_links: {$rows->count()} rows");

        foreach ($rows as $r) {
            $userId = $this->idMap['user'][$r->userId] ?? null;

            if (! $userId) {
                $this->warn("social_link {$r->id}: user {$r->userId} not found, skipping");

                continue;
            }

            DB::table('social_links')->insert([
                'platform' => $r->platform,
                'url' => $r->url,
                'position' => $r->position,
                'user_id' => $userId,
            ]);
        }
    }

    private function migrateNotifications(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('Notification')->get();
        $this->line("notifications: {$rows->count()} rows");

        foreach ($rows as $r) {
            $userId = $this->idMap['user'][$r->userId] ?? null;

            if (! $userId) {
                continue;
            }

            DB::table('notifications')->insert([
                'user_id' => $userId,
                'type' => $r->type,
                'title' => $r->title,
                'message' => $r->message,
                'link' => $r->link,
                'read' => (bool) $r->read,
                'created_at' => $r->createdAt,
            ]);
        }
    }

    private function migrateAnalyticsEvents(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('AnalyticsEvent')->get();
        $this->line("analytics_events: {$rows->count()} rows");

        foreach ($rows as $r) {
            $userId = $this->idMap['user'][$r->userId] ?? null;

            if (! $userId) {
                continue;
            }

            DB::table('analytics_events')->insert([
                'user_id' => $userId,
                'type' => $r->type,
                'meta' => $r->meta,
                'created_at' => $r->createdAt,
            ]);
        }
    }

    private function migrateDeliveryZones(bool $dryRun): void
    {
        $rows = DB::connection('legacy')->table('DeliveryZone')->get();
        $this->line("delivery_zones: {$rows->count()} rows");

        foreach ($rows as $r) {
            DB::table('delivery_zones')->insert([
                'name' => $r->name,
                'fee' => $r->fee,
            ]);
        }
    }
}
