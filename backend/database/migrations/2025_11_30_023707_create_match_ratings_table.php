<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_ratings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('match_id')
                ->constrained('matches')
                ->cascadeOnDelete();

            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnDelete();

            $table->string('rating', 1); // "○" "△" "×"

            $table->timestamps();

            // 同じ試合の同じ課題は1回だけ
            $table->unique(['match_id', 'task_id']);

            // よく検索しそうなら（任意）
            $table->index(['task_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_ratings');
    }
};
