<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // ユニーク制約
            $table->unique(['invoice_id', 'project_id']);

            // インデックス
            $table->index('invoice_id');
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_projects');
    }
};
