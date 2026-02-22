<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            // 課題の持ち主（ユーザーごとに別々の課題を持てる想定）
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('title');               // 課題名：例「初弾精度」
            $table->text('description')->nullable(); // 補足説明

            $table->unsignedInteger('sort_order')->default(0); // 並び順
            $table->boolean('is_active')->default(true);       // 非表示にしたいとき用

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
