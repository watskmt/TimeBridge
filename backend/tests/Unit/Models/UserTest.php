<?php

namespace Tests\Unit\Models;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_projects_relation(): void
    {
        $user = User::factory()->create();
        Project::factory()->count(3)->create(['user_id' => $user->id]);

        $this->assertCount(3, $user->projects);
    }

    public function test_user_has_time_entries_relation(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);
        TimeEntry::factory()->count(5)->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);

        $this->assertCount(5, $user->timeEntries);
    }

    public function test_get_total_hours_for_month(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        TimeEntry::factory()->count(2)->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'duration_minutes' => 120,
            'date' => now()->startOfMonth()->addDays(1),
        ]);

        $hours = $user->getTotalHoursForMonth(now()->year, now()->month);
        $this->assertEquals(4.0, $hours);
    }

    public function test_get_total_hours_for_month_excludes_other_months(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        TimeEntry::factory()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'duration_minutes' => 60,
            'date' => now()->subMonth()->startOfMonth(),
        ]);

        $hours = $user->getTotalHoursForMonth(now()->year, now()->month);
        $this->assertEquals(0.0, $hours);
    }

    public function test_get_total_earnings_for_month(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'user_id' => $user->id,
            'hourly_rate' => 5000,
        ]);

        TimeEntry::factory()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'duration_minutes' => 120,
            'date' => now()->startOfMonth()->addDays(1),
        ]);

        $earnings = $user->getTotalEarningsForMonth(now()->year, now()->month);
        $this->assertEquals(10000.0, $earnings);
    }

    public function test_password_is_hidden(): void
    {
        $user = User::factory()->create();
        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
    }

    public function test_fillable_fields(): void
    {
        $user = User::factory()->make([
            'name' => 'テストユーザー',
            'email' => 'test@example.com',
            'company_name' => '株式会社テスト',
            'phone' => '090-0000-0000',
        ]);

        $this->assertEquals('テストユーザー', $user->name);
        $this->assertEquals('test@example.com', $user->email);
        $this->assertEquals('株式会社テスト', $user->company_name);
    }
}
