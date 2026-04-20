<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class InspectionController extends Controller
{
    /**
     * 検収一覧
     */
    public function index(Request $request)
    {
        $query = Inspection::whereHas('project', fn ($q) => $q->where('user_id', $request->user()->id)
        );

        // ステータスフィルター
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $inspections = $query->with('project', 'comments')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($inspections);
    }

    /**
     * 検収作成
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'checklist' => 'nullable|array',
            'checklist.*.title' => 'required_with:checklist|string',
            'checklist.*.description' => 'nullable|string',
        ]);

        $project = Project::findOrFail($validated['project_id']);
        Gate::authorize('view', $project);

        $checklist = [];
        if ($request->has('checklist')) {
            foreach ($validated['checklist'] as $item) {
                $checklist[] = [
                    'id' => uniqid(),
                    'title' => $item['title'],
                    'description' => $item['description'] ?? null,
                    'completed' => false,
                ];
            }
        }

        $inspection = Inspection::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'checklist' => $checklist ?: null,
        ]);

        return response()->json([
            'message' => 'Inspection created successfully',
            'inspection' => $inspection->load('project'),
        ], 201);
    }

    /**
     * 検収詳細
     */
    public function show(Inspection $inspection)
    {
        Gate::authorize('view', $inspection);

        return response()->json($inspection->load('project', 'comments', 'approvedBy'));
    }

    /**
     * 検収更新
     */
    public function update(Request $request, Inspection $inspection)
    {
        Gate::authorize('update', $inspection);

        $validated = $request->validate([
            'checklist' => 'sometimes|array',
            'checklist.*.id' => 'sometimes|string',
            'checklist.*.title' => 'sometimes|string',
            'checklist.*.completed' => 'sometimes|boolean',
        ]);

        if ($request->has('checklist')) {
            $inspection->update(['checklist' => $validated['checklist']]);
        }

        return response()->json([
            'message' => 'Inspection updated successfully',
            'inspection' => $inspection->load('project'),
        ]);
    }

    /**
     * 検収削除
     */
    public function destroy(Inspection $inspection)
    {
        Gate::authorize('delete', $inspection);

        $inspection->delete();

        return response()->json([
            'message' => 'Inspection deleted successfully',
        ]);
    }

    /**
     * 検収承認
     */
    public function approve(Request $request, Inspection $inspection)
    {
        Gate::authorize('update', $inspection);

        $inspection->approve($request->user()->id);

        return response()->json([
            'message' => 'Inspection approved',
            'inspection' => $inspection,
        ]);
    }

    /**
     * 検収却下
     */
    public function reject(Request $request, Inspection $inspection)
    {
        Gate::authorize('update', $inspection);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $inspection->reject($validated['reason']);

        return response()->json([
            'message' => 'Inspection rejected',
            'inspection' => $inspection,
        ]);
    }

    /**
     * コメント追加
     */
    public function addComment(Request $request, Inspection $inspection)
    {
        Gate::authorize('view', $inspection);

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        $comment = $inspection->comments()->create([
            'user_id' => $request->user()->id,
            'comment' => $validated['comment'],
        ]);

        return response()->json([
            'message' => 'Comment added successfully',
            'comment' => $comment->load('user'),
        ], 201);
    }
}
