<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DailySummaryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'message' => 'ok',
        ]);
    }
}
