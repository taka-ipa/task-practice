<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\GameMatch;
use App\Models\MatchRating;
use App\Models\Task;

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

        // フィルタ: stage, weapon
        $stage = $request->query('stage');
        $weapon = $request->query('weapon');

        if ($stage) {
            $query->where('stage', $stage);
        }

        if ($weapon) {
            $query->where('weapon', $weapon);
        }

        if ($date) {
            // JSTの 00:00:00〜23:59:59 をそのままDBのdatetimeと比較する
            $start = Carbon::parse($date, 'Asia/Tokyo')->startOfDay();
            $end   = Carbon::parse($date, 'Asia/Tokyo')->endOfDay();

            $query->whereBetween('played_at', [
                $start->format('Y-m-d H:i:s'),
                $end->format('Y-m-d H:i:s'),
            ])->orderByDesc('created_at');
        } else {
            $query->orderByDesc('created_at');
        }

        $matches = $query->paginate($perPage);

        return response()->json($matches);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'played_at' => ['nullable', 'date'],
            'mode'      => ['required', 'string', 'max:50'],
            'rule'      => ['required', 'string', 'max:50'],
            'stage'     => ['required', 'string', 'max:100'],
            'weapon'    => ['required', 'string', 'max:100'],
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
            'title' => $r->task?->title,
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

        // Allow updating match fields and optionally ratings array
        $validated = $request->validate([
            'played_at' => ['nullable', 'date'],
            'mode'      => ['nullable', 'string', 'max:50'],
            'rule'      => ['nullable', 'string', 'max:50'],
            'stage'     => ['nullable', 'string', 'max:100'],
            'weapon'    => ['nullable', 'string', 'max:100'],
            'is_win'    => ['nullable', 'boolean'],
            'note'      => ['nullable', 'string', 'max:5000'],
            'ratings'   => ['nullable', 'array'],
        ]);

        DB::transaction(function () use ($request, $match, $validated) {
            // Update match fields
            $match->played_at = $validated['played_at'] ?? $match->played_at;
            $match->mode = array_key_exists('mode', $validated) ? $validated['mode'] : $match->mode;
            $match->rule = array_key_exists('rule', $validated) ? $validated['rule'] : $match->rule;
            $match->stage = array_key_exists('stage', $validated) ? $validated['stage'] : $match->stage;
            $match->weapon = array_key_exists('weapon', $validated) ? $validated['weapon'] : $match->weapon;
            $match->is_win = array_key_exists('is_win', $validated) ? $validated['is_win'] : $match->is_win;
            $match->note = array_key_exists('note', $validated) ? $validated['note'] : $match->note;
            $match->save();

            // If ratings provided, validate ownership and replace existing ratings
            if (!empty($validated['ratings'])) {
                $ratings = $validated['ratings'];

                $taskIds = collect($ratings)->pluck('task_id')->unique()->values();

                $ownedTaskCount = $request->user()->tasks()
                    ->whereIn('id', $taskIds)
                    ->count();
                if ($ownedTaskCount !== $taskIds->count()) {
                    throw ValidationException::withMessages([
                        'ratings' => ['ratings に自分の課題ではない task_id が含まれています'],
                    ]);
                }

                if ($taskIds->count() !== count($ratings)) {
                    throw ValidationException::withMessages([
                        'ratings' => ['ratings に同じ task_id が重複しています'],
                    ]);
                }

                // delete existing ratings for this match and insert new ones
                MatchRating::where('match_id', $match->id)->delete();

                $now = now();
                $rows = collect($ratings)->map(function ($r) use ($match, $now) {
                    return [
                        'match_id'   => $match->id,
                        'task_id'    => $r['task_id'],
                        'rating'     => $r['rating'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })->all();

                MatchRating::insert($rows);
            }
        });

        // reload relation
        $match->load(['ratings.task']);

        return response()->json([
            'id' => $match->id,
            'match' => [
                'played_at' => $match->played_at,
                'mode' => $match->mode,
                'rule' => $match->rule,
                'stage' => $match->stage,
                'weapon' => $match->weapon,
                'is_win' => $match->is_win,
                'note' => $match->note,
            ],
        ]);
    }
}
