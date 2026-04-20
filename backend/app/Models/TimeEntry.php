<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TimeEntry extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'project_id',
        'duration_minutes',
        'date',
        'description',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'date' => 'date',
        'duration_minutes' => 'integer',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    // ===== リレーション =====
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // ===== スコープ =====
    public function scopeForDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('date', $year)
            ->whereMonth('date', $month);
    }

    public function scopeForWeek($query, $startDate)
    {
        $endDate = $startDate->copy()->addDays(6);

        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    // ===== ビジネスロジック =====
    public function getDurationInHours()
    {
        return $this->duration_minutes / 60;
    }

    public function getEarnings()
    {
        return $this->getDurationInHours() * $this->project->hourly_rate;
    }

    public function getFormattedDuration()
    {
        $hours = intdiv($this->duration_minutes, 60);
        $minutes = $this->duration_minutes % 60;

        return sprintf('%dh %dm', $hours, $minutes);
    }
}
