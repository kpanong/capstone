<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\SubscriptionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


// Authentication
Route::controller(AuthController::class)->group(function () {
    Route::post('/login', 'login');
    Route::post('/register', 'register');
}); 

// Client
Route::controller(ClientController::class)->group(function () {
    Route::get('/c/me', 'getClient');
    Route::post('/c/me', 'createClient');

}); 

// Stripe Subscription
Route::get('/stripe/subscription/{id}', 
    [SubscriptionController::class, 'getSubscription']
);
Route::get('/stripe/subscription/{product_id}/{price_id}/payment-link', 
    [SubscriptionController::class, 'generatePaymentLink']
);
Route::get('/stripe/subscription/{paymentLinkId}/payment-link/status', 
    [SubscriptionController::class, 'checkPaymentLinkStatus']
);
Route::post('/stripe/subscribe/{id}', 
    [SubscriptionController::class, 'createSubscription']
);
Route::get('/stripe/payment/{payment_intent_id}/status', 
    [SubscriptionController::class, 'checkPaymentStatus']
);
Route::post('/stripe/payment/one-time', 
    [SubscriptionController::class, 'createOneTimePayment']
);
Route::post('/stripe/payment/checkout-session', 
    [SubscriptionController::class, 'createCheckoutSession']
);