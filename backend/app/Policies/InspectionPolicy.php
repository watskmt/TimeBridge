<?php

namespace App\Policies;

use App\Models\Inspection;
use App\Models\User;

class InspectionPolicy
{
    /**
     * 検収一覧表示の許可
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * 検収詳細表示の許可
     */
    public function view(User $user, Inspection $inspection): bool
    {
        return $user->id === $inspection->user_id;
    }

    /**
     * 検収作成の許可
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * 検収更新の許可
     */
    public function update(User $user, Inspection $inspection): bool
    {
        return $user->id === $inspection->user_id && 
               in_array($inspection->status, ['pending', 'in_review', 'rejected']);
    }

    /**
     * 検収削除の許可
     */
    public function delete(User $user, Inspection $inspection): bool
    {
        return $user->id === $inspection->user_id && $inspection->status === 'pending';
    }

    /**
     * 検収復元の許可
     */
    public function restore(User $user, Inspection $inspection): bool
    {
        return $user->id === $inspection->user_id;
    }

    /**
     * 検収完全削除の許可
     */
    public function forceDelete(User $user, Inspection $inspection): bool
    {
        return $user->id === $inspection->user_id;
    }
}
