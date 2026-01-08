<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailySummaryController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $to = Carbon::today();
        $from = Carbon::today()->subDays(6); // 直近7日（今日含む）

        /**
         * ① matches を日別集計
         */
        $matchStats = DB::table('matches')
            ->selectRaw('
                DATE(played_at) as date,
                COUNT(*) as matches,
                SUM(CASE WHEN is_win = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN is_win = 0 THEN 1 ELSE 0 END) as losses
            ')
            ->where('user_id', $userId)
            ->whereBetween('played_at', [
                $from->copy()->startOfDay(),
                $to->copy()->endOfDay(),
            ])
            ->groupBy(DB::raw('DATE(played_at)'))
            ->get()
            ->keyBy('date'); // date をキーにして扱いやすくする
        
        /**
         * ② match_ratings を日別（○△×）集計
         */
        $ratingStats = DB::table('match_ratings as mr')
            ->join('matches as m', 'm.id', '=', 'mr.match_id')
            ->selectRaw('
                DATE(m.played_at) as date,
                SUM(CASE WHEN mr.rating = "○" THEN 1 ELSE 0 END) as circle,
                SUM(CASE WHEN mr.rating = "△" THEN 1 ELSE 0 END) as triangle,
                SUM(CASE WHEN mr.rating = "×" THEN 1 ELSE 0 END) as cross_count
            ')
            ->where('m.user_id', $userId)
            ->whereBetween('m.played_at', [
                $from->copy()->startOfDay(),
                $to->copy()->endOfDay(),
            ])
            ->groupBy(DB::raw('DATE(m.played_at)'))
            ->get()
            ->keyBy('date');

        /**
         * ② 7日分を0埋めしつつ合体
         */
        $days = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $date = $d->toDateString();
            $stat = $matchStats->get($date);

            $matches = (int) ($stat->matches ?? 0);
            $wins = (int) ($stat->wins ?? 0);
            $losses = (int) ($stat->losses ?? 0);

            $winRate = $matches > 0
                ? round(($wins / $matches) * 100, 1)
                : 0.0;
            
            $rating = $ratingStats->get($date);
            $circle = (int) ($rating->circle ?? 0);
            $triangle = (int) ($rating->triangle ?? 0);
            $cross = (int) ($rating->cross_count ?? 0);

            $days[] = [
                'date' => $date,
                'matches' => $matches,
                'wins' => $wins,
                'losses' => $losses,
                'win_rate' => $winRate,
                'ratings' => [
                    'circle' => $circle,
                    'triangle' => $triangle,
                    'cross' => $cross,
                ],
            ];
        }

        /**
         * ③ totals（7日合計）
         */
        $totalMatches = array_sum(array_column($days, 'matches'));
        $totalWins = array_sum(array_column($days, 'wins'));
        $totalLosses = array_sum(array_column($days, 'losses'));
        $totalWinRate = $totalMatches > 0
            ? round(($totalWins / $totalMatches) * 100, 1)
            : 0.0;
        $totalCircle = array_sum(array_map(fn($d) => $d['ratings']['circle'], $days));
        $totalTriangle = array_sum(array_map(fn($d) => $d['ratings']['triangle'], $days));
        $totalCross = array_sum(array_map(fn($d) => $d['ratings']['cross'], $days));


        return response()->json([
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'totals' => [
                'matches' => $totalMatches,
                'wins' => $totalWins,
                'losses' => $totalLosses,
                'win_rate' => $totalWinRate,
                'ratings' => [
                    'circle' => $totalCircle,
                    'triangle' => $totalTriangle,
                    'cross' => $totalCross,
                ],
            ],
            'days' => $days,
        ]);
    }
}

