<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

use App\Models\GameMatch;
use App\Models\MatchRating;
use App\Models\Task;

class MatchesWithRatingsController extends Controller
{
    /**
     * 試合1件 + 評価（複数）をまとめて登録
     */
    public function store(Request $request)
{
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    $validated = $request->validate([
        'played_at' => ['nullable', 'date'],
        'mode'      => ['nullable', 'string', 'max:255'],
        'rule'      => ['nullable', 'string', 'max:255'],
        'stage'     => ['nullable', 'string', 'max:255'],
        'weapon'    => ['nullable', 'string', 'max:255'],
        'is_win'    => ['nullable', 'boolean'],
        'note'      => ['nullable', 'string'],

        'ratings'           => ['required', 'array', 'min:1'],
        'ratings.*.task_id' => ['required', 'integer'],
        'ratings.*.rating'  => ['required', 'string', Rule::in(['○', '△', '×'])],
    ]);

    $taskIds = collect($validated['ratings'])->pluck('task_id')->unique()->values();

    $ownedTaskCount = Task::query()
        ->where('user_id', $user->id)
        ->whereIn('id', $taskIds)
        ->count();

    if ($ownedTaskCount !== $taskIds->count()) {
        return response()->json([
            'message' => 'ratings に自分の課題ではない task_id が含まれています',
        ], 422);
    }

    if ($taskIds->count() !== count($validated['ratings'])) {
        return response()->json([
            'message' => 'ratings に同じ task_id が重複しています',
        ], 422);
    }

    $userId = $user->id;

    $result = DB::transaction(function () use ($validated, $userId) {
        $match = GameMatch::create([
            'user_id'   => $userId,
            'played_at' => $validated['played_at'] ?? null,
            'mode'      => $validated['mode'] ?? null,
            'rule'      => $validated['rule'] ?? null,
            'stage'     => $validated['stage'] ?? null,
            'weapon'    => $validated['weapon'] ?? null,
            'is_win'    => $validated['is_win'] ?? null,
            'note'      => $validated['note'] ?? null,
        ]);

        $rows = collect($validated['ratings'])->map(function ($r) use ($match) {
            return [
                'match_id'   => $match->id,
                'task_id'    => $r['task_id'],
                'rating'     => $r['rating'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->all();

        MatchRating::insert($rows);

        $match->load(['ratings.task']);

        return $match;
    });

        return response()->json($result, 201);
    }
}
