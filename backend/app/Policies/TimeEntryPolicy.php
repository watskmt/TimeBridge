<?php

namespace App\Policies;

use App\Models\TimeEntry;
use App\Models\User;

class TimeEntryPolicy
{
    /**
     * タイムエントリ一覧表示の許可
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * タイムエントリ詳細表示の許可
     */
    public function view(User $user, TimeEntry $timeEntry): bool
    {
        return $user->id === $timeEntry->user_id;
    }

    /**
     * タイムエントリ作成の許可
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * タイムエントリ更新の許可
     */
    public function update(User $user, TimeEntry $timeEntry): bool
    {
        return $user->id === $timeEntry->user_id;
    }

    /**
     * タイムエントリ削除の許可
     */
    public function delete(User $user, TimeEntry $timeEntry): bool
    {
        return $user->id === $timeEntry->user_id;
    }

    /**
     * タイムエントリ復元の許可
     */
    public function restore(User $user, TimeEntry $timeEntry): bool
    {
        return $user->id === $timeEntry->user_id;
    }

    /**
     * タイムエントリ完全削除の許可
     */
    public function forceDelete(User $user, TimeEntry $timeEntry): bool
    {
        return $user->id === $timeEntry->user_id;
    }
}
