<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('client_name');
            $table->text('description')->nullable();
            $table->enum('status', ['planning', 'in_progress', 'inspection', 'completed'])->default('planning');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('budget_amount', 12, 2);
            $table->decimal('hourly_rate', 10, 2);
            $table->softDeletes();
            $table->timestamps();

            // インデックス
            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
