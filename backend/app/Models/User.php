<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'company_name',
        'tax_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ===== リレーション =====
    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class);
    }

    // ===== ビジネスロジック =====
    public function getTotalHoursForMonth($year, $month)
    {
        return $this->timeEntries()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('duration_minutes') / 60;
    }

    public function getTotalEarningsForMonth($year, $month)
    {
        return $this->projects()
            ->with('timeEntries')
            ->get()
            ->sum(function ($project) use ($year, $month) {
                return $project->timeEntries()
                    ->whereYear('date', $year)
                    ->whereMonth('date', $month)
                    ->sum('duration_minutes') / 60 * $project->hourly_rate;
            });
    }
}
