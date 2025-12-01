<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->dateTime('played_at')->nullable();  // 試合した日時。面倒ならnullでも可
            $table->string('mode')->nullable();         // Xマッチ / バンカラ など
            $table->string('rule')->nullable();         // エリア / ヤグラ 等
            $table->string('stage')->nullable();        // マップ名
            $table->string('weapon')->nullable();       // 使用ブキ（後で集計したくなりがちなので一応）

            $table->boolean('is_win')->nullable();      // 勝ち: true / 負け: false / 不明: null

            $table->text('note')->nullable();           // ざっくり振り返りメモ

            $table->timestamps();

            $table->index(['user_id', 'played_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
