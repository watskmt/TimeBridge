<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'project_ids',
        'invoice_number',
        'status',
        'issued_at',
        'due_at',
        'subtotal',
        'tax',
        'total',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'issued_at' => 'date',
        'due_at' => 'date',
        'paid_at' => 'date',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'project_ids' => 'array',
    ];

    // ===== リレーション =====
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'invoice_projects');
    }

    // ===== スコープ =====
    public function scopeUnpaid($query)
    {
        return $query->whereIn('status', ['draft', 'sent']);
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('issued_at', $year)
            ->whereMonth('issued_at', $month);
    }

    // ===== ビジネスロジック =====
    public function isOverdue()
    {
        return $this->status !== 'paid' && now()->isAfter($this->due_at);
    }

    public function markPaid()
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }

    public function send()
    {
        $this->update(['status' => 'sent']);
        // メール送信処理はジョブで実行
    }

    public function generateInvoiceNumber()
    {
        $year = now()->year;
        $month = now()->format('m');
        $count = static::whereYear('issued_at', $year)
            ->whereMonth('issued_at', $month)
            ->count() + 1;

        return sprintf('INV-%d%s-%04d', $year, $month, $count);
    }

    public function calculateTax($taxRate = 0.10)
    {
        return $this->subtotal * $taxRate;
    }

    public function calculateTotal()
    {
        return $this->subtotal + $this->tax;
    }
}
