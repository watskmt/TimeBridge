<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /**
     * ダッシュボード集計
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $now = now();

        // 当月
        $currentMonthEarnings = $user->getTotalEarningsForMonth($now->year, $now->month);
        $currentMonthHours = $user->getTotalHoursForMonth($now->year, $now->month);

        // 前月
        $lastMonth = $now->copy()->subMonth();
        $lastMonthEarnings = $user->getTotalEarningsForMonth($lastMonth->year, $lastMonth->month);
        $lastMonthHours = $user->getTotalHoursForMonth($lastMonth->year, $lastMonth->month);

        // 未払い請求
        $unpaidInvoices = $user->invoices()->unpaid()->get();
        $totalUnpaid = $unpaidInvoices->sum('total');

        // 進行中プロジェクト数
        $activeProjects = $user->projects()->active()->count();

        // 稼働率（平均）
        $workingDays = 22; // 月平均労働日数
        $targetHours = $workingDays * 8; // 1日8時間
        $workRate = min(100, ($currentMonthHours / $targetHours) * 100);

        return response()->json([
            'summary' => [
                'current_month_earnings' => $currentMonthEarnings,
                'current_month_hours' => $currentMonthHours,
                'last_month_earnings' => $lastMonthEarnings,
                'last_month_hours' => $lastMonthHours,
                'earnings_growth' => $lastMonthEarnings > 0
                    ? (($currentMonthEarnings - $lastMonthEarnings) / $lastMonthEarnings) * 100
                    : 0,
                'total_unpaid' => $totalUnpaid,
                'unpaid_invoices_count' => $unpaidInvoices->count(),
                'active_projects' => $activeProjects,
                'work_rate' => round($workRate, 2),
            ],
        ]);
    }

    /**
     * グラフデータ
     */
    public function chartData(Request $request, $metric)
    {
        $user = $request->user();
        $months = intval($request->input('months', 6));

        if ($metric === 'sales') {
            return $this->getSalesChartData($user, $months);
        } elseif ($metric === 'hours') {
            return $this->getHoursChartData($user, $months);
        } elseif ($metric === 'projects') {
            return $this->getProjectsChartData($user);
        }

        return response()->json(['message' => 'Invalid metric'], 400);
    }

    /**
     * 売上グラフデータ（折線グラフ）
     */
    private function getSalesChartData($user, $months)
    {
        $data = [];
        $now = now();

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $earnings = $user->getTotalEarningsForMonth($date->year, $date->month);
            $data[] = [
                'month' => $date->format('Y-m'),
                'month_name' => $date->format('M'),
                'earnings' => round($earnings, 2),
            ];
        }

        return response()->json([
            'metric' => 'sales',
            'currency' => 'JPY',
            'data' => $data,
        ]);
    }

    /**
     * 稼働時間グラフデータ
     */
    private function getHoursChartData($user, $months)
    {
        $data = [];
        $now = now();

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $hours = $user->getTotalHoursForMonth($date->year, $date->month);
            $data[] = [
                'month' => $date->format('Y-m'),
                'month_name' => $date->format('M'),
                'hours' => round($hours, 2),
            ];
        }

        return response()->json([
            'metric' => 'hours',
            'unit' => 'hours',
            'data' => $data,
        ]);
    }

    /**
     * プロジェクト別売上（円グラフ）
     */
    private function getProjectsChartData($user)
    {
        $projects = $user->projects()
            ->with('timeEntries')
            ->active()
            ->get();

        $data = $projects->map(fn($project) => [
            'name' => $project->name,
            'earnings' => round($project->getTotalEarnings(), 2),
            'percentage' => 0, // 後でフロント側で計算
        ])->toArray();

        $total = collect($data)->sum('earnings');
        if ($total > 0) {
            $data = array_map(function ($item) use ($total) {
                $item['percentage'] = round(($item['earnings'] / $total) * 100, 2);
                return $item;
            }, $data);
        }

        return response()->json([
            'metric' => 'projects',
            'currency' => 'JPY',
            'total' => round($total, 2),
            'data' => $data,
        ]);
    }

    /**
     * KPI データ
     */
    public function kpi(Request $request)
    {
        $user = $request->user();
        $now = now();

        // 平均時給
        $currentMonthEarnings = $user->getTotalEarningsForMonth($now->year, $now->month);
        $currentMonthHours = $user->getTotalHoursForMonth($now->year, $now->month);
        $averageHourlyRate = $currentMonthHours > 0
            ? $currentMonthEarnings / $currentMonthHours
            : 0;

        // 案件別効率（売上 / 時間）
        $projectEfficiency = $user->projects()->active()->get()
            ->map(fn($p) => [
                'name' => $p->name,
                'efficiency' => $p->getTotalHours() > 0
                    ? round($p->getTotalEarnings() / $p->getTotalHours(), 2)
                    : 0,
            ])
            ->sortByDesc('efficiency')
            ->values();

        return response()->json([
            'kpi' => [
                'average_hourly_rate' => round($averageHourlyRate, 2),
                'project_efficiency' => $projectEfficiency,
            ],
        ]);
    }
}
