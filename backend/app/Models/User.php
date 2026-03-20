<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens,HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'login_id',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // no email verification in login_id flow
            'password' => 'hashed',
        ];
    }

    /**
     * Compatibility for password reset broker: return login_id as the identifier
     * stored in the password_reset_tokens.email column (we store login_id there).
     */
    public function getEmailForPasswordReset(): string
    {
        return (string) $this->login_id;
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function gameMatches()
    {
        return $this->hasMany(GameMatch::class);
    }
}
