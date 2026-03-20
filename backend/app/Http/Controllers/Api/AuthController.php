<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'login_id' => ['required', 'string', 'max:255', 'unique:users,login_id'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'login_id' => $validated['login_id'],
            'password' => Hash::make($validated['password']),
        ]);

        // 新規登録後すぐログイン状態にするためのトークンを発行
        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'       => $user->id,
                'name'     => $user->name,
                'login_id' => $user->login_id,
            ],
        ], 201);
    }
    // POST /api/login
    public function login(Request $request)
    {
        // バリデーション
        $request->validate([
            'login_id' => ['required', 'string'],
            'password' => ['required'],
        ]);

        // ユーザーIDでユーザー検索
        $user = User::where('login_id', $request->login_id)->first();

        // ユーザーがいない or パスワード不一致ならエラー
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'ユーザーIDまたはパスワードが正しくありません。',
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
                'id'       => $user->id,
                'name'     => $user->name,
                'login_id' => $user->login_id,
            ],
        ]);
    }

    // GET /api/me
    public function me(Request $request)
    {
        $user = $request->user(); // ← トークンから自動で取得される

        return response()->json([
            'id'       => $user->id,
            'name'     => $user->name,
            'login_id' => $user->login_id,
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
