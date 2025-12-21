<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameMatch extends Model
{
    protected $table = 'matches'; // ← モデル名とテーブルが違うからこれが重要！

    protected $fillable = [
        'user_id', 'played_at', 'mode', 'rule', 'stage', 'weapon', 'is_win', 'note',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ratings()
    {
        return $this->hasMany(MatchRating::class, 'match_id');
    }
}