<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\GameMatch;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // ?date=YYYY-MM-DD（無ければ直近を返す）
        $date = $request->query('date'); // null あり

        // User -> gameMatches リレーション前提
        $query = $user->gameMatches()
            ->select([
                'id',
                'played_at',
                'mode',
                'rule',
                'stage',
                'weapon',
                'is_win',
            ]);

        if ($date) {
            // 指定日の 00:00:00〜23:59:59（日本時間想定）
            $start = Carbon::parse($date)->startOfDay()->subHours(9);
            $end = Carbon::parse($date)->endOfDay()->subHours(9);

            $query->whereBetween('played_at', [$start, $end])
                  ->orderByDesc('played_at');
        } else {
            // dateが無い場合は直近20件
            $query->orderBy('played_at', 'desc')->limit(20);
        }

        $matches = $query->get();
        
        return response()->json($matches);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'played_at' => ['nullable', 'date'],
            'mode'      => ['nullable', 'string', 'max:50'],
            'rule'      => ['required', 'string', 'max:50'],
            'stage'     => ['nullable', 'string', 'max:100'],
            'weapon'    => ['nullable', 'string', 'max:100'],
            'is_win'    => ['nullable', 'boolean'],
        ]);

        $match = $request->user()->gameMatches()->create($validated);
        // ↑ リレーション名が gameMatches なら ->gameMatches()

        return response()->json($match, 201);
    }

    public function show(Request $request, GameMatch $match)
    {
        // 自分の試合以外は見せない
        if ($match->user_id !== $request->user()->id) {
            abort(404);
        }

        $match->load(['ratings.task']); // ratings = match_ratings の想定（名前は合わせて）

        return response()->json([
        'match' => [
            'id' => $match->id,
            'played_at' => $match->played_at,
            'rule' => $match->rule,
            'stage' => $match->stage,
            'is_win' => $match->is_win,
        ],
        'ratings' => $match->ratings->map(fn ($r) => [
            'task_id' => $r->task_id,
            'title' => $r->task?->title,
            'rating' => $r->rating,
        ])->values(),
    ]);
}
}
