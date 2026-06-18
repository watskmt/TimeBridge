<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * デモログイン用アカウントを投入する。
     *
     * 認証情報は env (DEMO_USER_*) から取得する。本番では secrets の
     * backend.env に設定し、env_file 経由でコンテナに渡る。
     * EMAIL と PASSWORD の両方が設定されている場合のみ作成し、
     * updateOrCreate で冪等（毎デプロイで env の値に同期）。
     */
    public function run(): void
    {
        $email = env('DEMO_USER_EMAIL');
        $password = env('DEMO_USER_PASSWORD');

        if (! $email || ! $password) {
            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('DEMO_USER_NAME', 'Demo User'),
                'password' => Hash::make($password),
                'company_name' => env('DEMO_USER_COMPANY'),
            ]
        );
    }
}
