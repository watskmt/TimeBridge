<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'client_name',
        'description',
        'status',
        'start_date',
        'end_date',
        'budget_amount',
        'hourly_rate',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget_amount' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
    ];

    // ===== リレーション =====
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function invoices()
    {
        return $this->belongsToMany(Invoice::class, 'invoice_projects');
    }

    public function inspection()
    {
        return $this->hasOne(Inspection::class);
    }

    // ===== スコープ =====
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['planning', 'in_progress', 'inspection']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // ===== ビジネスロジック =====
    public function getTotalHours()
    {
        return $this->timeEntries()->sum('duration_minutes') / 60;
    }

    public function getTotalEarnings()
    {
        return $this->getTotalHours() * $this->hourly_rate;
    }

    public function getBudgetRemaining()
    {
        return $this->budget_amount - $this->getTotalEarnings();
    }

    public function getProgressPercentage()
    {
        if ($this->budget_amount == 0) {
            return 0;
        }
        return min(100, ($this->getTotalEarnings() / $this->budget_amount) * 100);
    }

    public function isOverBudget()
    {
        return $this->getTotalEarnings() > $this->budget_amount;
    }
}
