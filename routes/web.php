<?php

use App\Http\Controllers\Api\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\BusinessController as AdminBusinessController;
use App\Http\Controllers\Api\Admin\BusinessEmployeeController as AdminBusinessEmployeeController;
use App\Http\Controllers\Api\Admin\CardController as AdminCardController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\ContactMessageController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\DeliveryZoneController as AdminDeliveryZoneController;
use App\Http\Controllers\Api\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\Api\Admin\NotificationSendController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\SubscriptionController as AdminSubscriptionController;
use App\Http\Controllers\Api\Admin\SupportController as AdminSupportController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\BusinessAnalyticsController;
use App\Http\Controllers\Api\BusinessCardController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\BusinessEmployeeController;
use App\Http\Controllers\Api\BusinessLeadController;
use App\Http\Controllers\Api\BusinessSubscriptionController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\LinkController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DeliveryZoneController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PortfolioItemController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SupportMessageController;
use App\Http\Controllers\Api\SocialLinkController;
use App\Http\Controllers\Api\StoreCategoryController;
use App\Http\Controllers\Api\StoreProductController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TestimonialController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NfcController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PublicProfileController;
use App\Http\Controllers\QrController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::post('api/contact', [ContactController::class, 'store']);
Route::post('api/newsletter', [NewsletterController::class, 'store']);

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard/index');
    })->name('dashboard');

    Route::get('api/dashboard/overview', \App\Http\Controllers\Api\DashboardOverviewController::class);

    Route::get('dashboard/links', function () {
        return Inertia::render('dashboard/links');
    })->name('dashboard.links');

    Route::get('dashboard/appearance', function () {
        return Inertia::render('dashboard/appearance');
    })->name('dashboard.appearance');

    Route::get('dashboard/cards', function () {
        return Inertia::render('dashboard/cards');
    })->name('dashboard.cards');

    Route::get('dashboard/store', function () {
        return Inertia::render('dashboard/store');
    })->name('dashboard.store');

    Route::get('dashboard/store/categories', function () {
        return Inertia::render('dashboard/store/categories');
    })->name('dashboard.store.categories');

    Route::get('dashboard/services', function () {
        return Inertia::render('dashboard/services');
    })->name('dashboard.services');

    Route::get('dashboard/portfolio', function () {
        return Inertia::render('dashboard/portfolio');
    })->name('dashboard.portfolio');

    Route::get('dashboard/settings', function () {
        return Inertia::render('dashboard/settings');
    })->name('dashboard.settings');

    Route::get('dashboard/orders', function () {
        return Inertia::render('dashboard/orders');
    })->name('dashboard.orders');

    Route::get('dashboard/leads', function () {
        return Inertia::render('dashboard/leads');
    })->name('dashboard.leads');

    Route::get('dashboard/analytics', function () {
        return Inertia::render('dashboard/analytics');
    })->name('dashboard.analytics');

    Route::get('dashboard/subscription', function () {
        return Inertia::render('dashboard/subscription');
    })->name('dashboard.subscription');

    Route::get('dashboard/business', function () {
        return Inertia::render('dashboard/business');
    })->name('dashboard.business');

    Route::put('profile/username', \App\Http\Controllers\ProfileUsernameController::class)
        ->name('profile.username');

    // --- Dashboard self-service JSON API (fetch()-driven, not Inertia props) ---
    Route::get('api/links', [LinkController::class, 'index']);
    Route::post('api/links', [LinkController::class, 'store']);
    Route::put('api/links/{link}', [LinkController::class, 'update']);
    Route::delete('api/links/{link}', [LinkController::class, 'destroy']);
    Route::patch('api/links/{link}', [LinkController::class, 'toggleActive']);
    Route::patch('api/links/reorder', [LinkController::class, 'reorder']);

    Route::get('api/social-links', [SocialLinkController::class, 'index']);
    Route::post('api/social-links', [SocialLinkController::class, 'store']);
    Route::put('api/social-links/{socialLink}', [SocialLinkController::class, 'update']);
    Route::delete('api/social-links/{socialLink}', [SocialLinkController::class, 'destroy']);

    Route::put('api/profile', [ProfileController::class, 'update']);

    Route::get('api/services', [ServiceController::class, 'index']);
    Route::post('api/services', [ServiceController::class, 'store']);
    Route::put('api/services/{service}', [ServiceController::class, 'update']);
    Route::delete('api/services/{service}', [ServiceController::class, 'destroy']);

    Route::get('api/portfolio', [PortfolioItemController::class, 'index']);
    Route::post('api/portfolio', [PortfolioItemController::class, 'store']);
    Route::put('api/portfolio/{portfolioItem}', [PortfolioItemController::class, 'update']);
    Route::delete('api/portfolio/{portfolioItem}', [PortfolioItemController::class, 'destroy']);

    Route::get('api/testimonials', [TestimonialController::class, 'index']);
    Route::post('api/testimonials', [TestimonialController::class, 'store']);
    Route::put('api/testimonials/{testimonial}', [TestimonialController::class, 'update']);
    Route::delete('api/testimonials/{testimonial}', [TestimonialController::class, 'destroy']);

    Route::get('api/store-products', [StoreProductController::class, 'index']);
    Route::post('api/store-products', [StoreProductController::class, 'store']);
    Route::put('api/store-products/{storeProduct}', [StoreProductController::class, 'update']);
    Route::delete('api/store-products/{storeProduct}', [StoreProductController::class, 'destroy']);

    Route::get('api/store-categories', [StoreCategoryController::class, 'index']);
    Route::post('api/store-categories', [StoreCategoryController::class, 'store']);
    Route::delete('api/store-categories/{category}', [StoreCategoryController::class, 'destroy']);

    Route::get('api/auth/me', MeController::class);
    Route::get('api/cards/mine', [CardController::class, 'mine']);
    Route::post('api/cards/claim', [CardController::class, 'claim']);

    Route::middleware(['admin_api'])->group(function () {
        Route::post('api/cards/bulk', [AdminCardController::class, 'bulk']);
        Route::post('api/cards/import-one', [AdminCardController::class, 'importOne']);
        Route::get('api/cards', [AdminCardController::class, 'index']);
        Route::post('api/cards', [AdminCardController::class, 'store']);
        Route::get('api/cards/{code}', [AdminCardController::class, 'show']);
        Route::patch('api/cards/{code}', [AdminCardController::class, 'update']);
    });

    Route::get('api/leads', [LeadController::class, 'index']);
    Route::patch('api/leads/{lead}', [LeadController::class, 'updateStatus']);

    Route::get('api/orders/mine', [OrderController::class, 'mine']);
    Route::patch('api/orders/{orderNumber}/complete-profile', [OrderController::class, 'completeProfile']);

    Route::post('api/subscriptions/checkout', [SubscriptionController::class, 'checkout']);

    Route::get('api/analytics/summary', [AnalyticsController::class, 'summary']);

    Route::get('api/notifications', [NotificationController::class, 'index']);
    Route::patch('api/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('api/notifications/{notification}', [NotificationController::class, 'markRead']);

    Route::get('api/support/messages', [SupportMessageController::class, 'index']);
    Route::post('api/support/messages', [SupportMessageController::class, 'store']);
    Route::post('api/support/messages/read', [SupportMessageController::class, 'markRead']);

    Route::middleware(['business_admin'])->group(function () {
        Route::get('api/business', [BusinessController::class, 'show']);
        Route::put('api/business', [BusinessController::class, 'update']);

        Route::get('api/business/employees', [BusinessEmployeeController::class, 'index']);
        Route::post('api/business/employees', [BusinessEmployeeController::class, 'store']);
        Route::patch('api/business/employees/{id}', [BusinessEmployeeController::class, 'update']);
        Route::delete('api/business/employees/{id}', [BusinessEmployeeController::class, 'destroy']);
        Route::post('api/business/employees/bulk', [BusinessEmployeeController::class, 'bulk']);

        Route::get('api/business/cards', [BusinessCardController::class, 'index']);
        Route::patch('api/business/cards/{code}/assign', [BusinessCardController::class, 'assign']);

        Route::get('api/business/analytics', BusinessAnalyticsController::class);
        Route::get('api/business/leads', BusinessLeadController::class);

        Route::post('api/business/subscriptions/checkout', [BusinessSubscriptionController::class, 'checkout']);
    });
});

Route::get('api/subscriptions/verify', [SubscriptionController::class, 'verify']);
Route::get('api/business/subscriptions/verify', [BusinessSubscriptionController::class, 'verify']);

Route::post('api/leads', [LeadController::class, 'store']);
Route::post('api/analytics/track', [AnalyticsController::class, 'track']);
Route::post('api/upload', UploadController::class);

// --- Public NFC/QR destinations ---
Route::get('c/{code}', NfcController::class);
Route::get('q/{username}', QrController::class);

// --- Public marketplace storefront ---
Route::get('marketplace', [ProductController::class, 'index'])->name('marketplace.index');
Route::get('api/products', [ProductController::class, 'apiIndex']);
Route::get('marketplace/{product:slug}', [ProductController::class, 'show'])->name('marketplace.show');

Route::get('about', function () {
    return Inertia::render('about');
})->name('about');

Route::get('pricing', function () {
    return Inertia::render('pricing');
})->name('pricing');

Route::get('discover', function () {
    return Inertia::render('discover');
})->name('discover');

Route::get('learn', function () {
    return Inertia::render('learn');
})->name('learn');

Route::get('templates', function () {
    return Inertia::render('templates');
})->name('templates');

Route::get('cart', function () {
    return Inertia::render('cart');
})->name('cart');

Route::get('wishlist', function () {
    return Inertia::render('wishlist');
})->name('wishlist');

Route::get('checkout', function () {
    return Inertia::render('checkout');
})->name('checkout');

Route::get('track-order', function () {
    return Inertia::render('track-order');
})->name('track-order');

Route::get('orders/{orderNumber}', function (string $orderNumber) {
    return Inertia::render('orders/show', ['orderNumber' => $orderNumber]);
})->name('orders.show');

Route::get('orders/{orderNumber}/receipt', function (string $orderNumber) {
    return Inertia::render('orders/receipt', ['orderNumber' => $orderNumber]);
})->name('orders.receipt');

Route::post('api/orders', [OrderController::class, 'store']);
Route::get('api/orders/{orderNumber}', [OrderController::class, 'show']);
Route::get('api/delivery-zones', [DeliveryZoneController::class, 'index']);
Route::get('api/payments/verify', [PaymentController::class, 'verify']);

Route::get('card-not-active', function () {
    return Inertia::render('card-not-active');
})->name('card-not-active');

Route::get('activate-card', function () {
    return Inertia::render('activate-card');
})->name('activate-card');

// Public: fired when a visitor clicks a profile link button.
Route::post('api/links/{id}/click', [LinkController::class, 'click']);

Route::get('admin-login', function () {
    return Inertia::render('admin-login');
})->name('admin-login');

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin/dashboard');
    })->name('dashboard');

    Route::get('products', function () {
        return Inertia::render('admin/products');
    })->name('products');

    Route::get('categories', function () {
        return Inertia::render('admin/categories');
    })->name('categories');

    Route::get('delivery-zones', function () {
        return Inertia::render('admin/delivery-zones');
    })->name('delivery-zones');

    Route::get('orders', function () {
        return Inertia::render('admin/orders');
    })->name('orders');

    Route::get('cards', function () {
        return Inertia::render('admin/cards');
    })->name('cards');

    Route::get('cards/generate', function () {
        return Inertia::render('admin/cards-generate');
    })->name('cards.generate');

    Route::get('users', function () {
        return Inertia::render('admin/users');
    })->name('users');

    Route::get('subscriptions', function () {
        return Inertia::render('admin/subscriptions');
    })->name('subscriptions');

    Route::get('leads', function () {
        return Inertia::render('admin/leads');
    })->name('leads');

    Route::get('analytics', function () {
        return Inertia::render('admin/analytics');
    })->name('analytics');

    Route::get('messages', function () {
        return Inertia::render('admin/messages');
    })->name('messages');

    Route::get('messages/{contactMessage}', function (\App\Models\ContactMessage $contactMessage) {
        return Inertia::render('admin/message-detail', ['id' => $contactMessage->id]);
    })->name('messages.show');

    Route::get('notifications', function () {
        return Inertia::render('admin/notifications');
    })->name('notifications');

    Route::get('support', function () {
        return Inertia::render('admin/support');
    })->name('support');

    Route::get('support/{userId}', function (string $userId) {
        return Inertia::render('admin/support-thread', ['userId' => $userId]);
    })->name('support.show');
});

Route::middleware(['auth', 'admin_api'])->prefix('api/admin')->group(function () {
    Route::get('products', [AdminProductController::class, 'index']);
    Route::post('products', [AdminProductController::class, 'store']);
    Route::put('products/{product:id}', [AdminProductController::class, 'update']);
    Route::delete('products/{product:id}', [AdminProductController::class, 'destroy']);

    Route::get('categories', [AdminCategoryController::class, 'index']);
    Route::post('categories', [AdminCategoryController::class, 'store']);
    Route::post('categories/reorder', [AdminCategoryController::class, 'reorder']);
    Route::put('categories/{category}', [AdminCategoryController::class, 'update']);
    Route::delete('categories/{category}', [AdminCategoryController::class, 'destroy']);

    Route::get('delivery-zones', [AdminDeliveryZoneController::class, 'index']);
    Route::post('delivery-zones', [AdminDeliveryZoneController::class, 'store']);
    Route::put('delivery-zones/{deliveryZone}', [AdminDeliveryZoneController::class, 'update']);
    Route::delete('delivery-zones/{deliveryZone}', [AdminDeliveryZoneController::class, 'destroy']);

    Route::get('orders', [AdminOrderController::class, 'index']);
    Route::patch('orders/{orderNumber}', [AdminOrderController::class, 'update']);

    Route::get('dashboard', AdminDashboardController::class);
    Route::get('analytics', AdminAnalyticsController::class);

    Route::get('users', [AdminUserController::class, 'index']);
    Route::post('users', [AdminUserController::class, 'store']);
    Route::patch('users/{user}', [AdminUserController::class, 'update']);

    Route::get('businesses', [AdminBusinessController::class, 'index']);
    Route::post('businesses', [AdminBusinessController::class, 'store']);
    Route::get('businesses/{businessId}/employees', [AdminBusinessEmployeeController::class, 'index']);

    Route::get('subscriptions', [AdminSubscriptionController::class, 'index']);
    Route::patch('subscriptions/individual/{userId}', [AdminSubscriptionController::class, 'updateIndividual']);
    Route::patch('subscriptions/business/{businessId}', [AdminSubscriptionController::class, 'updateBusiness']);

    Route::get('leads', [AdminLeadController::class, 'index']);
    Route::post('leads', [AdminLeadController::class, 'store']);
    Route::patch('leads/{lead}', [AdminLeadController::class, 'update']);
    Route::delete('leads/{lead}', [AdminLeadController::class, 'destroy']);
    Route::post('leads/{lead}/convert', [AdminLeadController::class, 'convert']);

    Route::get('contact-messages', [ContactMessageController::class, 'index']);
    Route::get('contact-messages/{contactMessage}', [ContactMessageController::class, 'show']);
    Route::put('contact-messages/{contactMessage}', [ContactMessageController::class, 'update']);
    Route::delete('contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy']);

    Route::post('notifications/send', NotificationSendController::class);

    Route::get('support', [AdminSupportController::class, 'index']);
    Route::get('support/{userId}', [AdminSupportController::class, 'show']);
    Route::post('support/{userId}', [AdminSupportController::class, 'store']);
    Route::post('support/{userId}/read', [AdminSupportController::class, 'markRead']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Public digital profile page — catch-all single-segment route, so it MUST
// stay registered last (Laravel matches routes in registration order; every
// other top-level path needs to be claimed above this one first).
Route::get('{user}', [PublicProfileController::class, 'show'])->name('profile.show');
