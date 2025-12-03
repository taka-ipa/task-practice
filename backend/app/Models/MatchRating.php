<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchRating extends Model
{
    protected $fillable = [
        'task_id', 'match_id', 'rating',
    ];

    public function match()
    {
        return $this->belongsTo(GameMatch::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
