<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * プロジェクト一覧表示の許可
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * プロジェクト詳細表示の許可
     */
    public function view(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * プロジェクト作成の許可
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * プロジェクト更新の許可
     */
    public function update(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * プロジェクト削除の許可
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->id === $project->user_id && ! in_array($project->status, ['inspection', 'completed']);
    }

    /**
     * プロジェクト復元の許可
     */
    public function restore(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * プロジェクト完全削除の許可
     */
    public function forceDelete(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }
}
