<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Individual Pro plan
    |--------------------------------------------------------------------------
    */

    'pro_plan_price_naira' => 10000,

    'free_link_limit' => 5,

    'free_template' => 'minimal',

    // More than one free option — Playfair Display stays Pro-exclusive as the
    // most distinctive/stylistic choice; everything else is free.
    'free_fonts' => ['Inter', 'Georgia', 'Poppins', 'Roboto Mono'],

    /*
    |--------------------------------------------------------------------------
    | Business plan tiers
    |--------------------------------------------------------------------------
    | employee_limit is null for 'enterprise' to mean unlimited.
    */

    'business_plans' => [
        'free' => ['label' => 'Free', 'employee_limit' => 3, 'price_naira' => 0],
        'tier10' => ['label' => 'Team 10', 'employee_limit' => 10, 'price_naira' => 50000],
        'tier25' => ['label' => 'Team 25', 'employee_limit' => 25, 'price_naira' => 100000],
        'tier50' => ['label' => 'Team 50', 'employee_limit' => 50, 'price_naira' => 180000],
        'tier100' => ['label' => 'Team 100', 'employee_limit' => 100, 'price_naira' => 300000],
        'enterprise' => ['label' => 'Enterprise', 'employee_limit' => null, 'price_naira' => null],
    ],

];
