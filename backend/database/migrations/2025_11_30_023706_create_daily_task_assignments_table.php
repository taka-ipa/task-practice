<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_task_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('date'); // その日の課題日付

            // A/Bスロット。1=A, 2=B みたいなイメージ
            $table->unsignedTinyInteger('slot');

            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnDelete();

            $table->string('memo')->nullable(); // その日の一言メモとか

            $table->timestamps();

            $table->unique(['user_id', 'date', 'slot']); // 同じ日にAが2個できないように
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_task_assignments');
    }
};
