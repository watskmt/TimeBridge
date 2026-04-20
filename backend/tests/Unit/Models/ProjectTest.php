<?php

namespace Tests\Unit\Models;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->project = Project::factory()->create([
            'user_id' => $this->user->id,
            'hourly_rate' => 5000,
            'budget_amount' => 500000,
        ]);
    }

    public function test_get_total_hours_with_no_entries(): void
    {
        $this->assertEquals(0.0, $this->project->getTotalHours());
    }

    public function test_get_total_hours_sums_entries(): void
    {
        TimeEntry::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 60,
        ]);

        $this->assertEquals(3.0, $this->project->getTotalHours());
    }

    public function test_get_total_earnings(): void
    {
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 120,
        ]);

        $this->assertEquals(10000.0, $this->project->getTotalEarnings());
    }

    public function test_get_budget_remaining(): void
    {
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 120,
        ]);

        $this->assertEquals(490000.0, $this->project->getBudgetRemaining());
    }

    public function test_get_progress_percentage(): void
    {
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 3000, // 50時間 × 5000円 = 250000円 = 50%
        ]);

        $this->assertEquals(50.0, $this->project->getProgressPercentage());
    }

    public function test_get_progress_percentage_caps_at_100(): void
    {
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 9999,
        ]);

        $this->assertEquals(100.0, $this->project->getProgressPercentage());
    }

    public function test_get_progress_percentage_zero_budget(): void
    {
        $project = Project::factory()->create([
            'user_id' => $this->user->id,
            'budget_amount' => 0,
        ]);

        $this->assertEquals(0.0, $project->getProgressPercentage());
    }

    public function test_is_over_budget_false(): void
    {
        $this->assertFalse($this->project->isOverBudget());
    }

    public function test_is_over_budget_true(): void
    {
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 9999,
        ]);

        $this->assertTrue($this->project->isOverBudget());
    }

    public function test_scope_active(): void
    {
        Project::factory()->create(['user_id' => $this->user->id, 'status' => 'in_progress']);
        Project::factory()->create(['user_id' => $this->user->id, 'status' => 'planning']);
        Project::factory()->create(['user_id' => $this->user->id, 'status' => 'completed']);

        $active = Project::active()->get();
        $this->assertTrue($active->every(fn($p) => in_array($p->status, ['planning', 'in_progress', 'inspection'])));
    }

    public function test_scope_completed(): void
    {
        Project::factory()->create(['user_id' => $this->user->id, 'status' => 'completed']);
        Project::factory()->create(['user_id' => $this->user->id, 'status' => 'in_progress']);

        $completed = Project::completed()->get();
        $this->assertTrue($completed->every(fn($p) => $p->status === 'completed'));
    }

    public function test_soft_delete(): void
    {
        $this->project->delete();

        $this->assertSoftDeleted($this->project);
        $this->assertNull(Project::find($this->project->id));
        $this->assertNotNull(Project::withTrashed()->find($this->project->id));
    }
}
