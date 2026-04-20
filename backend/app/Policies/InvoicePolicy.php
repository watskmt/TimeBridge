<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    /**
     * 請求書一覧表示の許可
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * 請求書詳細表示の許可
     */
    public function view(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id;
    }

    /**
     * 請求書作成の許可
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * 請求書更新の許可
     */
    public function update(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id && $invoice->status === 'draft';
    }

    /**
     * 請求書削除の許可
     */
    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id && $invoice->status === 'draft';
    }

    /**
     * 請求書復元の許可
     */
    public function restore(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id;
    }

    /**
     * 請求書完全削除の許可
     */
    public function forceDelete(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id;
    }
}
