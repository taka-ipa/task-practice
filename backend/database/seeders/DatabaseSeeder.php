<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Task;
use App\Models\GameMatch; // モデル名に合わせて変更
use App\Models\MatchRating;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 既存があっても fresh 前提なので気にしない
        $user = User::factory()->create([
            'name' => 'test',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $tasks = \App\Models\Task::factory()
            ->count(3)
            ->for($user) // user_id 自動で入る
            ->sequence(
                ['sort_order' => 1, 'title' => '初弾精度', 'description' => '初弾を当てる'],
                ['sort_order' => 2, 'title' => 'デス後の立ち位置', 'description' => '復帰後の位置'],
                ['sort_order' => 3, 'title' => '打開の入り方', 'description' => '打開の初動'],
            )
            ->create();

        // 試合1件
        $match = \App\Models\GameMatch::create([ // ←ここもモデル名に合わせる
            'user_id' => $user->id,
            'played_at' => now(),
            'mode' => 'Xマッチ',
            'rule' => 'エリア',
            'stage' => 'ネギトロ炭鉱',
            'weapon' => 'スプラマニューバー',
            'is_win' => null,
            'note' => 'seedのダミー',
        ]);

        // 課題3つに評価をつける
        $ratings = ['○', '△', '×'];

        foreach ($tasks as $i => $task) {
            \App\Models\MatchRating::create([
                'match_id' => $match->id,
                'task_id' => $task->id,
                'rating' => $ratings[$i % 3],
            ]);
        }
    }
}
