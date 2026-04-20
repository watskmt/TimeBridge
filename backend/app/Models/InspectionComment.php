<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'user_id',
        'comment',
    ];

    // ===== リレーション =====
    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
