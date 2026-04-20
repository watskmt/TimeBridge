<?php

namespace Tests\Unit\Models;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeEntryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;
    private TimeEntry $entry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->project = Project::factory()->create([
            'user_id' => $this->user->id,
            'hourly_rate' => 6000,
        ]);
        $this->entry = TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 90,
        ]);
    }

    public function test_get_duration_in_hours(): void
    {
        $this->assertEquals(1.5, $this->entry->getDurationInHours());
    }

    public function test_get_earnings(): void
    {
        $this->assertEquals(9000.0, $this->entry->getEarnings());
    }

    public function test_get_formatted_duration_hours_and_minutes(): void
    {
        $this->assertEquals('1h 30m', $this->entry->getFormattedDuration());
    }

    public function test_get_formatted_duration_exact_hours(): void
    {
        $entry = TimeEntry::factory()->make(['duration_minutes' => 120]);
        $this->assertEquals('2h 0m', $entry->getFormattedDuration());
    }

    public function test_get_formatted_duration_minutes_only(): void
    {
        $entry = TimeEntry::factory()->make(['duration_minutes' => 45]);
        $this->assertEquals('0h 45m', $entry->getFormattedDuration());
    }

    public function test_scope_for_date(): void
    {
        $today = now()->toDateString();
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'date' => $today,
        ]);
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'date' => now()->subDay()->toDateString(),
        ]);

        $entries = TimeEntry::forDate($today)->get();
        $this->assertTrue($entries->every(fn($e) => $e->date->toDateString() === $today));
    }

    public function test_scope_for_month(): void
    {
        $year = now()->year;
        $month = now()->month;

        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'date' => now()->startOfMonth()->addDays(5),
        ]);
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'date' => now()->subMonth()->startOfMonth(),
        ]);

        $entries = TimeEntry::forMonth($year, $month)->get();
        $this->assertTrue($entries->every(
            fn($e) => $e->date->year === $year && $e->date->month === $month
        ));
    }

    public function test_belongs_to_user(): void
    {
        $this->assertEquals($this->user->id, $this->entry->user->id);
    }

    public function test_belongs_to_project(): void
    {
        $this->assertEquals($this->project->id, $this->entry->project->id);
    }
}
