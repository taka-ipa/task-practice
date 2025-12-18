<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = ['name', 'description', 'sort_order', 'is_active','user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function matchRatings()
    {
        return $this->hasMany(MatchRating::class);
    }
}