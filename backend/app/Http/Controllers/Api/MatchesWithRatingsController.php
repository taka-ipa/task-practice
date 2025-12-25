<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchWithRatingsRequest;
use Illuminate\Validation\ValidationException;
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
    public function store(StoreMatchWithRatingsRequest $request)
{
    $user = $request->user();
    $validated = $request->validated();

    $taskIds = collect($validated['ratings'])->pluck('task_id')->unique()->values();

    $ownedTaskCount = $user->tasks()
        ->whereIn('id', $taskIds)
        ->count();
    if ($ownedTaskCount !== $taskIds->count()) {
        throw ValidationException::withMessages([
            'ratings' => ['ratings に自分の課題ではない task_id が含まれています'],
        ]);
    }

    if ($taskIds->count() !== count($validated['ratings'])) {
        throw ValidationException::withMessages([
            'ratings' => ['ratings に同じ task_id が重複しています'],
        ]);
    }

    $result = DB::transaction(function () use ($validated, $user) {
        $match = GameMatch::create([
            'user_id'   => $user->id,
            'played_at' => $validated['played_at'] ?? null,
            'mode'      => $validated['mode'] ?? null,
            'rule'      => $validated['rule'] ?? null,
            'stage'     => $validated['stage'] ?? null,
            'weapon'    => $validated['weapon'] ?? null,
            'is_win'    => $validated['is_win'] ?? null,
            'note'      => $validated['note'] ?? null,
        ]);

        $now = now();
        $rows = collect($validated['ratings'])->map(function ($r) use ($match, $now) {
            return [
                'match_id'   => $match->id,
                'task_id'    => $r['task_id'],
                'rating'     => $r['rating'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->all();

        MatchRating::insert($rows);

        $match->load(['ratings.task']);

        return $match;
    });

        return response()->json($result, 201);
    }
}
