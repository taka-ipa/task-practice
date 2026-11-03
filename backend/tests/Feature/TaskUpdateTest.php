<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_success(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id]);

        $res = $this->actingAs($user)->putJson("/api/tasks/{$task->id}", [
            'title' => '初弾精度',
            'description' => '最初の1発を丁寧に当てる',
        ]);

        $res->assertOk()->assertJsonPath('title', '初弾精度');
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => '初弾精度',
            'description' => '最初の1発を丁寧に当てる',
        ]);
    }

    public function test_update_clears_description_when_empty(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id, 'description' => '消したい説明']);

        $res = $this->actingAs($user)->putJson("/api/tasks/{$task->id}", [
            'title' => 'タイトルのみ',
            'description' => null,
        ]);

        $res->assertOk();
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => 'タイトルのみ', 'description' => null]);
    }

    public function test_update_requires_title(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->create(['user_id' => $user->id, 'title' => '元のタイトル']);

        $res = $this->actingAs($user)->putJson("/api/tasks/{$task->id}", ['title' => '']);

        $res->assertStatus(422);
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => '元のタイトル']);
    }

    public function test_cannot_update_other_users_task(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $otherTask = Task::factory()->create(['user_id' => $other->id, 'title' => '他人の課題']);

        $res = $this->actingAs($user)->putJson("/api/tasks/{$otherTask->id}", ['title' => '乗っ取り']);

        $res->assertStatus(404);
        $this->assertDatabaseHas('tasks', ['id' => $otherTask->id, 'title' => '他人の課題']);
    }

    public function test_update_requires_authentication(): void
    {
        $task = Task::factory()->create(['user_id' => User::factory()->create()->id]);

        $this->putJson("/api/tasks/{$task->id}", ['title' => '未ログイン'])->assertStatus(401);
    }
}
