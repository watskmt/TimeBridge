<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * 請求書一覧
     */
    public function index(Request $request)
    {
        $query = $request->user()->invoices();

        // ステータスフィルター
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // 月別フィルター
        if ($request->has('year') && $request->has('month')) {
            $query->forMonth($request->year, $request->month);
        }

        $invoices = $query->orderBy('issued_at', 'desc')
            ->paginate(20);

        return response()->json($invoices);
    }

    /**
     * 請求書作成
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'exists:projects,id',
            'issued_at' => 'required|date',
            'due_at' => 'required|date|after:issued_at',
            'notes' => 'nullable|string',
        ]);

        // 選択したプロジェクトが自分のものか確認
        $projects = Project::whereIn('id', $validated['project_ids'])
            ->where('user_id', $request->user()->id)
            ->get();

        if ($projects->count() !== count($validated['project_ids'])) {
            return response()->json([
                'message' => 'Some projects not found or unauthorized',
            ], 403);
        }

        // 小計と税金を計算
        $subtotal = $projects->sum(function ($project) {
            return $project->getTotalEarnings();
        });

        $tax = $subtotal * 0.10; // 消費税10%
        $total = $subtotal + $tax;

        $invoice = $request->user()->invoices()->create([
            'project_ids' => $validated['project_ids'],
            'invoice_number' => (new Invoice())->generateInvoiceNumber(),
            'issued_at' => $validated['issued_at'],
            'due_at' => $validated['due_at'],
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'status' => 'draft',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Invoice created successfully',
            'invoice' => $invoice,
        ], 201);
    }

    /**
     * 請求書詳細
     */
    public function show(Invoice $invoice)
    {
        Gate::authorize('view', $invoice);

        return response()->json($invoice->load('user'));
    }

    /**
     * 請求書更新
     */
    public function update(Request $request, Invoice $invoice)
    {
        Gate::authorize('update', $invoice);

        $validated = $request->validate([
            'issued_at' => 'sometimes|date',
            'due_at' => 'sometimes|date',
            'notes' => 'sometimes|nullable|string',
        ]);

        $invoice->update($validated);

        return response()->json([
            'message' => 'Invoice updated successfully',
            'invoice' => $invoice,
        ]);
    }

    /**
     * 請求書削除
     */
    public function destroy(Invoice $invoice)
    {
        Gate::authorize('delete', $invoice);

        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully',
        ]);
    }

    /**
     * 請求書PDF生成
     */
    public function downloadPdf(Invoice $invoice)
    {
        Gate::authorize('view', $invoice);

        $invoice->load('user');

        $pdf = Pdf::loadView('invoices.pdf', ['invoice' => $invoice])
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('dpi', 150)
            ->setPaper('a4', 'portrait');

        return $pdf->download($invoice->invoice_number . '.pdf');
    }

    /**
     * 請求書送信
     */
    public function send(Invoice $invoice)
    {
        Gate::authorize('update', $invoice);

        $invoice->send();

        return response()->json([
            'message' => 'Invoice sent successfully',
            'invoice' => $invoice->fresh(),
        ]);
    }

    /**
     * 入金記録
     */
    public function markPaid(Invoice $invoice)
    {
        Gate::authorize('update', $invoice);

        $invoice->markPaid();

        return response()->json([
            'message' => 'Invoice marked as paid',
            'invoice' => $invoice->fresh(),
        ]);
    }
}
