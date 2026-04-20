<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

class TimeEntryController extends Controller
{
    /**
     * 稼働時間一覧
     */
    public function index(Request $request)
    {
        $query = $request->user()->timeEntries();

        // 日付範囲でフィルター
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        // プロジェクトでフィルター
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        $timeEntries = $query->with('project')
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($timeEntries);
    }

    /**
     * 稼働時間記録作成
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'duration_minutes' => 'required|integer|min:1|max:1440',
            'date' => 'required|date|before_or_equal:today',
            'description' => 'nullable|string|max:500',
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date',
        ]);

        // プロジェクトが自分のものか確認
        $project = Project::findOrFail($validated['project_id']);
        Gate::authorize('view', $project);

        $timeEntry = $request->user()->timeEntries()->create($validated);

        return response()->json([
            'message' => 'Time entry created successfully',
            'time_entry' => $timeEntry->load('project'),
        ], 201);
    }

    /**
     * 稼働時間詳細
     */
    public function show(TimeEntry $timeEntry)
    {
        Gate::authorize('view', $timeEntry);

        return response()->json($timeEntry->load('project', 'user'));
    }

    /**
     * 稼働時間更新
     */
    public function update(Request $request, TimeEntry $timeEntry)
    {
        Gate::authorize('update', $timeEntry);

        $validated = $request->validate([
            'duration_minutes' => 'sometimes|integer|min:1|max:1440',
            'date' => 'sometimes|date|before_or_equal:today',
            'description' => 'sometimes|nullable|string|max:500',
        ]);

        $timeEntry->update($validated);

        return response()->json([
            'message' => 'Time entry updated successfully',
            'time_entry' => $timeEntry->load('project'),
        ]);
    }

    /**
     * 稼働時間削除
     */
    public function destroy(TimeEntry $timeEntry)
    {
        Gate::authorize('delete', $timeEntry);

        $timeEntry->delete();

        return response()->json([
            'message' => 'Time entry deleted successfully',
        ]);
    }

    /**
     * 稼働時間集計（日次/週次/月次）
     */
    public function summary(Request $request, $period)
    {
        $user = $request->user();

        if ($period === 'daily') {
            $date = $request->input('date', now()->toDateString());
            $entries = $user->timeEntries()
                ->forDate($date)
                ->with('project')
                ->get();

            $summary = $entries->groupBy('project_id')->map(function ($items) {
                return [
                    'project' => $items->first()->project,
                    'total_minutes' => $items->sum('duration_minutes'),
                    'total_hours' => $items->sum('duration_minutes') / 60,
                    'earnings' => $items->sum(fn ($e) => $e->getEarnings()),
                ];
            });

            return response()->json([
                'period' => 'daily',
                'date' => $date,
                'data' => $summary,
                'total_hours' => $entries->sum('duration_minutes') / 60,
                'total_earnings' => $entries->sum(fn ($e) => $e->getEarnings()),
            ]);
        } elseif ($period === 'weekly') {
            $startDate = Carbon::parse($request->input('start_date', now()->startOfWeek()));
            $entries = $user->timeEntries()
                ->forWeek($startDate)
                ->with('project')
                ->get();

            return response()->json([
                'period' => 'weekly',
                'start_date' => $startDate->toDateString(),
                'end_date' => $startDate->copy()->addDays(6)->toDateString(),
                'total_hours' => $entries->sum('duration_minutes') / 60,
                'total_earnings' => $entries->sum(fn ($e) => $e->getEarnings()),
                'entries' => $entries,
            ]);
        } elseif ($period === 'monthly') {
            $year = $request->input('year', now()->year);
            $month = $request->input('month', now()->month);

            $entries = $user->timeEntries()
                ->forMonth($year, $month)
                ->with('project')
                ->get();

            $dailySummary = $entries->groupBy(fn ($e) => $e->date->toDateString())
                ->map(fn ($items) => [
                    'date' => $items->first()->date->toDateString(),
                    'hours' => $items->sum('duration_minutes') / 60,
                    'earnings' => $items->sum(fn ($e) => $e->getEarnings()),
                ]);

            return response()->json([
                'period' => 'monthly',
                'year' => $year,
                'month' => $month,
                'total_hours' => $entries->sum('duration_minutes') / 60,
                'total_earnings' => $entries->sum(fn ($e) => $e->getEarnings()),
                'daily_summary' => $dailySummary,
            ]);
        }

        return response()->json(['message' => 'Invalid period'], 400);
    }

    /**
     * プロジェクト別レポート
     */
    public function projectReport(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        Gate::authorize('view', $project);

        $entries = $project->timeEntries()
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'project' => $project,
            'total_hours' => $entries->sum('duration_minutes') / 60,
            'total_earnings' => $entries->sum(fn ($e) => $e->getEarnings()),
            'entries_count' => $entries->count(),
            'entries' => $entries,
        ]);
    }
}
