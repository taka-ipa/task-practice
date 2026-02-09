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

        // ページネーション対応: `page` と `per_page` クエリを受け取る
        $perPage = (int) $request->query('per_page', 5);
        $perPage = max(1, min(100, $perPage));

        if ($date) {
            // JSTの 00:00:00〜23:59:59 をそのままDBのdatetimeと比較する
            $start = Carbon::parse($date, 'Asia/Tokyo')->startOfDay();
            $end   = Carbon::parse($date, 'Asia/Tokyo')->endOfDay();

            $query->whereBetween('played_at', [
                $start->format('Y-m-d H:i:s'),
                $end->format('Y-m-d H:i:s'),
            ])->orderByDesc('played_at');
        } else {
            $query->orderByDesc('played_at');
        }

        $matches = $query->paginate($perPage);

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

        $match->load(['ratings.task']); // リレーション読み込み

        return response()->json([
        'match' => [
            'id' => $match->id,
            'played_at' => $match->played_at,
            'mode' => $match->mode,
            'rule' => $match->rule,
            'stage' => $match->stage,
            'weapon' => $match->weapon,
            'is_win' => $match->is_win,
            'note' => $match->note,
        ],
        'ratings' => $match->ratings->map(fn ($r) => [
            'task_id' => $r->task_id,
            'title' => $r->task?->name,
            'rating' => $r->rating,
        ])->values(),
        ]);
    }

    public function update(Request $request, GameMatch $match)
    {
        // 自分の試合だけ更新できるように（重要）
        if ($match->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:5000'],
        ]);

        $match->note = $validated['note'] ?? null;
        $match->save();

        return response()->json([
            'id' => $match->id,
            'note' => $match->note,
        ]);
    }
}
