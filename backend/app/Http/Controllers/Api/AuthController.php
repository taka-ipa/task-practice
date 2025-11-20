<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // POST /api/login
    public function login(Request $request)
    {
        // バリデーション
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        // メールアドレスでユーザー検索
        $user = User::where('email', $request->email)->first();

        // ユーザーがいない or パスワード不一致ならエラー
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'メールアドレスまたはパスワードが正しくありません。',
            ], 422);
        }

        // 既存トークンを全部消す（毎回1つだけにしたい場合）
        $user->tokens()->delete();

        // 新しいトークン発行（← ここでPersonal Access Token作ってる）
        $token = $user->createToken('web')->plainTextToken;

        // フロントに返す内容
        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    // GET /api/me
    public function me(Request $request)
    {
        $user = $request->user(); // ← トークンから自動で取得される

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        // 今使っているトークンだけ無効化
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'ログアウトしました。',
        ]);
    }
}
