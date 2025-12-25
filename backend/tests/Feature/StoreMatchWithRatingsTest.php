<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Task;
use App\Models\GameMatch;
use App\Models\MatchRating;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreMatchWithRatingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_success(): void
    {
        $user = User::factory()->create();
        $task1 = Task::factory()->create(['user_id' => $user->id]);
        $task2 = Task::factory()->create(['user_id' => $user->id]);

        $payload = [
            'played_at' => '2025-12-25T14:30:00',
            'rule' => 'エリア',
            'stage' => 'マテガイ放水路',
            'is_win' => true,
            'ratings' => [
                ['task_id' => $task1->id, 'rating' => '○'],
                ['task_id' => $task2->id, 'rating' => '△'],
            ],
        ];

        $res = $this->actingAs($user)->postJson('/api/matches-with-ratings', $payload);

        $res->assertStatus(201);

        $this->assertDatabaseCount('matches', 1);
        $this->assertDatabaseCount('match_ratings', 2);
    }

    public function test_store_fails_when_ratings_missing(): void
    {
        $user = User::factory()->create();

        $payload = [
            'rule' => 'エリア',
            'stage' => 'マテガイ放水路',
            'is_win' => true,
            // ratings なし
        ];

        $res = $this->actingAs($user)->postJson('/api/matches-with-ratings', $payload);

        $res->assertStatus(422);
        $this->assertDatabaseCount('matches', 0);
        $this->assertDatabaseCount('match_ratings', 0);
    }

    public function test_store_rollbacks_when_task_id_invalid(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $myTask = Task::factory()->create(['user_id' => $user->id]);
        $otherTask = Task::factory()->create(['user_id' => $other->id]);

        $payload = [
            'rule' => 'エリア',
            'stage' => 'マテガイ放水路',
            'is_win' => true,
            'ratings' => [
                ['task_id' => $myTask->id, 'rating' => '○'],
                ['task_id' => $otherTask->id, 'rating' => '△'], // 不正（他人）
            ],
        ];

        $res = $this->actingAs($user)->postJson('/api/matches-with-ratings', $payload);

        $res->assertStatus(422);

        // ★ rollback 確認：試合も評価も0
        $this->assertDatabaseCount('matches', 0);
        $this->assertDatabaseCount('match_ratings', 0);
    }
}
