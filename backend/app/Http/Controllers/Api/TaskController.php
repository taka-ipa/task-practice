<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;

class TaskController extends Controller
{
    /**
     * ログインユーザーの課題一覧を返す
     */
    public function index(Request $request)
    {
        $user = $request->user(); // = auth()->user() と同じ

        // Userモデルに tasks() リレーションがある前提
        $tasks = $user->tasks()
            ->orderBy('sort_order') // 並び順カラムがあるなら
            ->get();

        return response()->json($tasks);
    }
}
