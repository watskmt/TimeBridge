<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inspection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'user_id',
        'status',
        'checklist',
        'approved_at',
        'approved_by',
        'rejection_reason',
    ];

    protected $casts = [
        'checklist' => 'array',
        'approved_at' => 'datetime',
    ];

    // ===== リレーション =====
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function comments()
    {
        return $this->hasMany(InspectionComment::class);
    }

    // ===== スコープ =====
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInReview($query)
    {
        return $query->where('status', 'in_review');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // ===== ビジネスロジック =====
    public function approve($userId)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);

        // プロジェクトステータスも更新
        $this->project->update(['status' => 'completed']);
    }

    public function reject($reason)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);
    }

    public function getCompletionPercentage()
    {
        if (empty($this->checklist)) {
            return 0;
        }

        $completed = collect($this->checklist)
            ->filter(fn($item) => $item['completed'] ?? false)
            ->count();

        return ($completed / count($this->checklist)) * 100;
    }

    public function isAllChecklistItemsCompleted()
    {
        return collect($this->checklist)
            ->every(fn($item) => $item['completed'] ?? false);
    }

    public function addChecklistItem($title, $description = null)
    {
        $checklist = $this->checklist ?? [];
        $checklist[] = [
            'id' => uniqid(),
            'title' => $title,
            'description' => $description,
            'completed' => false,
        ];

        $this->update(['checklist' => $checklist]);
    }

    public function completeChecklistItem($itemId)
    {
        $checklist = collect($this->checklist)
            ->map(fn($item) => $item['id'] === $itemId
                ? array_merge($item, ['completed' => true])
                : $item
            )
            ->toArray();

        $this->update(['checklist' => $checklist]);
    }
}
