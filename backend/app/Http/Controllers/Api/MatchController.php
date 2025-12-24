<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // ?date=YYYY-MM-DD が無ければ今日（日本時間想定）
        $date = $request->query('date', now()->toDateString());

        // その日の 00:00:00〜23:59:59
        $start = Carbon::parse($date)->startOfDay();
        $end   = Carbon::parse($date)->endOfDay();

        // User -> gameMatches リレーションがある前提（以前の命名に合わせた）
        $matches = $user->gameMatches()
            ->whereBetween('played_at', [$start, $end])
            ->orderByDesc('played_at')
            ->get([
                'id',
                'played_at',
                'mode',
                'rule',
                'stage',
                'weapon',
                'is_win',
            ]);

        return response()->json($matches);
    }
}
