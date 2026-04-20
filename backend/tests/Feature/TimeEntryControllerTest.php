<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeEntryControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->project = Project::factory()->create(['user_id' => $this->user->id]);
    }

    private function validEntryData(array $overrides = []): array
    {
        return array_merge([
            'project_id' => $this->project->id,
            'duration_minutes' => 120,
            'date' => now()->toDateString(),
            'description' => '作業内容',
        ], $overrides);
    }

    // ===== 一覧 =====

    public function test_can_list_own_time_entries(): void
    {
        TimeEntry::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
        ]);
        TimeEntry::factory()->create(); // 他ユーザー

        $response = $this->actingAs($this->user)->getJson('/api/time-entries');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_can_filter_by_project(): void
    {
        $otherProject = Project::factory()->create(['user_id' => $this->user->id]);

        TimeEntry::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
        ]);
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $otherProject->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/time-entries?project_id={$this->project->id}");

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    // ===== 作成 =====

    public function test_can_create_time_entry(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/time-entries', $this->validEntryData());

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'time_entry' => ['id', 'duration_minutes', 'date']]);

        $this->assertDatabaseHas('time_entries', [
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 120,
        ]);
    }

    public function test_create_fails_with_missing_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/time-entries', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['project_id', 'duration_minutes', 'date']);
    }

    public function test_create_fails_with_future_date(): void
    {
        $data = $this->validEntryData(['date' => now()->addDay()->toDateString()]);

        $response = $this->actingAs($this->user)->postJson('/api/time-entries', $data);

        $response->assertStatus(422)->assertJsonValidationErrors(['date']);
    }

    public function test_create_fails_with_duration_over_1440(): void
    {
        $data = $this->validEntryData(['duration_minutes' => 1441]);

        $response = $this->actingAs($this->user)->postJson('/api/time-entries', $data);

        $response->assertStatus(422)->assertJsonValidationErrors(['duration_minutes']);
    }

    public function test_cannot_create_entry_for_other_users_project(): void
    {
        $otherProject = Project::factory()->create();

        $data = $this->validEntryData(['project_id' => $otherProject->id]);

        $response = $this->actingAs($this->user)->postJson('/api/time-entries', $data);

        $response->assertStatus(403);
    }

    // ===== 詳細 =====

    public function test_can_view_own_time_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/time-entries/{$entry->id}");

        $response->assertStatus(200)->assertJsonPath('id', $entry->id);
    }

    public function test_cannot_view_other_users_time_entry(): void
    {
        $entry = TimeEntry::factory()->create();

        $response = $this->actingAs($this->user)->getJson("/api/time-entries/{$entry->id}");

        $response->assertStatus(403);
    }

    // ===== 更新 =====

    public function test_can_update_own_time_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'duration_minutes' => 60,
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/time-entries/{$entry->id}", [
            'duration_minutes' => 90,
            'description' => '更新後の説明',
        ]);

        $response->assertStatus(200)->assertJsonPath('time_entry.duration_minutes', 90);
    }

    public function test_cannot_update_other_users_time_entry(): void
    {
        $entry = TimeEntry::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/time-entries/{$entry->id}", [
            'duration_minutes' => 90,
        ]);

        $response->assertStatus(403);
    }

    // ===== 削除 =====

    public function test_can_delete_own_time_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/time-entries/{$entry->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted($entry);
    }

    // ===== サマリー =====

    public function test_can_get_monthly_summary(): void
    {
        TimeEntry::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'date' => now()->startOfMonth()->addDays(1),
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/time-entries/summary/monthly?year=' . now()->year . '&month=' . now()->month);

        $response->assertStatus(200)
            ->assertJsonStructure(['period', 'year', 'month', 'total_hours', 'total_earnings', 'daily_summary']);
    }

    public function test_summary_returns_400_for_invalid_period(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/time-entries/summary/invalid');

        $response->assertStatus(400);
    }
}
