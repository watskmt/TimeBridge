<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TimeEntryController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\DashboardController;

// ===== 認証エンドポイント =====
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum')
        ->name('auth.logout');
});

// ===== 認証が必要なエンドポイント =====
Route::middleware('auth:sanctum')->group(function () {
    
    // ===== プロジェクト管理 =====
    Route::apiResource('projects', ProjectController::class);
    Route::get('projects/{project}/summary', [ProjectController::class, 'summary']);
    
    // ===== 稼働時間管理 =====
    Route::apiResource('time-entries', TimeEntryController::class);
    Route::get('time-entries/summary/{period}', [TimeEntryController::class, 'summary']);
    Route::get('time-entries/report/{projectId}', [TimeEntryController::class, 'projectReport']);
    
    // ===== 請求書管理 =====
    Route::apiResource('invoices', InvoiceController::class);
    Route::get('invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
    Route::post('invoices/{id}/send', [InvoiceController::class, 'send']);
    Route::put('invoices/{id}/mark-paid', [InvoiceController::class, 'markPaid']);
    
    // ===== 検収管理 =====
    Route::apiResource('inspections', InspectionController::class);
    Route::post('inspections/{id}/approve', [InspectionController::class, 'approve']);
    Route::post('inspections/{id}/reject', [InspectionController::class, 'reject']);
    Route::post('inspections/{id}/comments', [InspectionController::class, 'addComment']);
    
    // ===== ダッシュボード =====
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('dashboard/chart-data/{metric}', [DashboardController::class, 'chartData']);
    Route::get('dashboard/kpi', [DashboardController::class, 'kpi']);
    
    // ===== ユーザープロフィール =====
    Route::get('/user', fn (Request $request) => $request->user());
    Route::put('/user', [AuthController::class, 'updateProfile']);
});

// ===== ヘルスチェック =====
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'api_version' => '1.0',
    ]);
});
