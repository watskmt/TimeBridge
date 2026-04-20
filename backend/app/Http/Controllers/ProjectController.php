<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    /**
     * プロジェクト一覧
     */
    public function index(Request $request)
    {
        $query = $request->user()->projects();

        // ステータスフィルター
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // 検索
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%");
            });
        }

        $projects = $query->with('timeEntries')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($projects);
    }

    /**
     * プロジェクト作成
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:planning,in_progress,inspection,completed',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'budget_amount' => 'required|numeric|min:0',
            'hourly_rate' => 'required|numeric|min:0',
        ]);

        $project = $request->user()->projects()->create($validated);

        return response()->json([
            'message' => 'Project created successfully',
            'project' => $project,
        ], 201);
    }

    /**
     * プロジェクト詳細
     */
    public function show(Project $project)
    {
        Gate::authorize('view', $project);

        $project->load('timeEntries', 'inspection');

        return response()->json($project);
    }

    /**
     * プロジェクト更新
     */
    public function update(Request $request, Project $project)
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'client_name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'status' => 'sometimes|in:planning,in_progress,inspection,completed',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'budget_amount' => 'sometimes|numeric|min:0',
            'hourly_rate' => 'sometimes|numeric|min:0',
        ]);

        $project->update($validated);

        return response()->json([
            'message' => 'Project updated successfully',
            'project' => $project,
        ]);
    }

    /**
     * プロジェクト削除
     */
    public function destroy(Project $project)
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully',
        ]);
    }

    /**
     * プロジェクトサマリー
     */
    public function summary(Project $project)
    {
        Gate::authorize('view', $project);

        return response()->json([
            'id' => $project->id,
            'name' => $project->name,
            'client_name' => $project->client_name,
            'status' => $project->status,
            'total_hours' => $project->getTotalHours(),
            'total_earnings' => $project->getTotalEarnings(),
            'budget_amount' => $project->budget_amount,
            'budget_remaining' => $project->getBudgetRemaining(),
            'progress_percentage' => $project->getProgressPercentage(),
            'is_over_budget' => $project->isOverBudget(),
            'time_entries_count' => $project->timeEntries()->count(),
        ]);
    }
}
