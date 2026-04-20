<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DejaVu Sans', sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; }
  .page { padding: 48px; max-width: 800px; margin: 0 auto; }

  /* ヘッダー */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 24px; }
  .brand h1 { font-size: 28px; font-weight: 700; color: #2563eb; letter-spacing: 1px; }
  .brand p { color: #6b7280; font-size: 12px; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-meta .invoice-number { font-size: 20px; font-weight: 700; color: #1e293b; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; margin-top: 6px; }
  .status-draft { background: #f1f5f9; color: #475569; }
  .status-sent { background: #dbeafe; color: #1d4ed8; }
  .status-paid { background: #dcfce7; color: #15803d; }
  .status-overdue { background: #fee2e2; color: #b91c1c; }

  /* 宛先・差出人 */
  .parties { display: flex; justify-content: space-between; margin-bottom: 36px; }
  .party { width: 48%; }
  .party-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .party-name { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .party-info { font-size: 12px; color: #6b7280; line-height: 1.7; }

  /* 日付情報 */
  .dates { display: flex; gap: 24px; margin-bottom: 36px; background: #f8fafc; border-radius: 8px; padding: 16px 20px; }
  .date-item { }
  .date-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .date-value { font-size: 14px; font-weight: 600; color: #1e293b; }

  /* プロジェクト明細 */
  .section-title { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  thead tr { background: #1e293b; color: #fff; }
  thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #e2e8f0; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 12px 14px; font-size: 13px; color: #374151; }
  tbody td:last-child { text-align: right; font-weight: 600; }

  /* 合計 */
  .totals { margin-left: auto; width: 280px; margin-bottom: 40px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #6b7280; }
  .total-row.final { border-bottom: 2px solid #2563eb; padding: 12px 0; font-size: 16px; font-weight: 700; color: #1e293b; }
  .total-row .label { }
  .total-row .amount { font-weight: 600; color: #374151; }
  .total-row.final .amount { color: #2563eb; font-size: 18px; }

  /* 備考 */
  .notes { background: #f8fafc; border-left: 3px solid #2563eb; padding: 14px 18px; border-radius: 0 6px 6px 0; margin-bottom: 40px; }
  .notes .notes-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .notes p { font-size: 13px; color: #374151; line-height: 1.7; white-space: pre-line; }

  /* フッター */
  .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="page">

  <!-- ヘッダー -->
  <div class="header">
    <div class="brand">
      <h1>TimeBridge</h1>
      <p>フリーランス稼働管理プラットフォーム</p>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">{{ $invoice->invoice_number }}</div>
      @php
        $statusLabels = ['draft'=>'下書き','sent'=>'送付済み','paid'=>'入金済み','overdue'=>'期限超過'];
        $statusClass = 'status-' . $invoice->status;
      @endphp
      <span class="status-badge {{ $statusClass }}">{{ $statusLabels[$invoice->status] ?? $invoice->status }}</span>
    </div>
  </div>

  <!-- 宛先・差出人 -->
  <div class="parties">
    <div class="party">
      <div class="party-label">請求先</div>
      @php
        $projectIds = $invoice->project_ids;
        $projects = \App\Models\Project::whereIn('id', $projectIds)->get();
        $clientName = $projects->first()?->client_name ?? '—';
      @endphp
      <div class="party-name">{{ $clientName }} 御中</div>
    </div>
    <div class="party">
      <div class="party-label">請求元</div>
      <div class="party-name">{{ $invoice->user->name }}</div>
      <div class="party-info">
        @if($invoice->user->company_name){{ $invoice->user->company_name }}<br>@endif
        @if($invoice->user->email){{ $invoice->user->email }}<br>@endif
        @if($invoice->user->phone){{ $invoice->user->phone }}@endif
      </div>
    </div>
  </div>

  <!-- 日付 -->
  <div class="dates">
    <div class="date-item">
      <div class="date-label">発行日</div>
      <div class="date-value">{{ $invoice->issued_at->format('Y年m月d日') }}</div>
    </div>
    <div class="date-item">
      <div class="date-label">支払期限</div>
      <div class="date-value">{{ $invoice->due_at->format('Y年m月d日') }}</div>
    </div>
    @if($invoice->paid_at)
    <div class="date-item">
      <div class="date-label">入金日</div>
      <div class="date-value">{{ $invoice->paid_at->format('Y年m月d日') }}</div>
    </div>
    @endif
  </div>

  <!-- 明細 -->
  <div class="section-title">請求明細</div>
  <table>
    <thead>
      <tr>
        <th>プロジェクト名</th>
        <th>クライアント</th>
        <th>稼働時間</th>
        <th>時給単価</th>
        <th>金額</th>
      </tr>
    </thead>
    <tbody>
      @foreach($projects as $project)
      @php
        $hours = $project->getTotalHours();
        $earnings = $project->getTotalEarnings();
      @endphp
      <tr>
        <td>{{ $project->name }}</td>
        <td>{{ $project->client_name }}</td>
        <td>{{ number_format($hours, 1) }}h</td>
        <td>¥{{ number_format($project->hourly_rate, 0) }}/h</td>
        <td>¥{{ number_format($earnings, 0) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  <!-- 合計 -->
  <div class="totals">
    <div class="total-row">
      <span class="label">小計</span>
      <span class="amount">¥{{ number_format($invoice->subtotal, 0) }}</span>
    </div>
    <div class="total-row">
      <span class="label">消費税（10%）</span>
      <span class="amount">¥{{ number_format($invoice->tax, 0) }}</span>
    </div>
    <div class="total-row final">
      <span class="label">合計請求金額</span>
      <span class="amount">¥{{ number_format($invoice->total, 0) }}</span>
    </div>
  </div>

  <!-- 備考 -->
  @if($invoice->notes)
  <div class="notes">
    <div class="notes-label">備考</div>
    <p>{{ $invoice->notes }}</p>
  </div>
  @endif

  <!-- フッター -->
  <div class="footer">
    © {{ now()->year }} AM Tech (Wataru Sakamoto) — TimeBridge で生成されました
  </div>

</div>
</body>
</html>
