<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    private function validProjectData(array $overrides = []): array
    {
        return array_merge([
            'name' => 'テストプロジェクト',
            'client_name' => '株式会社テスト',
            'description' => '説明文',
            'status' => 'in_progress',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'budget_amount' => 1000000,
            'hourly_rate' => 5000,
        ], $overrides);
    }

    // ===== 一覧 =====

    public function test_can_list_own_projects(): void
    {
        Project::factory()->count(3)->create(['user_id' => $this->user->id]);
        Project::factory()->create(); // 他ユーザー

        $response = $this->actingAs($this->user)->getJson('/api/projects');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_list_requires_authentication(): void
    {
        $this->getJson('/api/projects')->assertStatus(401);
    }

    public function test_can_filter_by_status(): void
    {
        Project::factory()->create(['user_id' => $this->user->id, 'status' => 'in_progress']);
        Project::factory()->create(['user_id' => $this->user->id, 'status' => 'completed']);

        $response = $this->actingAs($this->user)->getJson('/api/projects?status=in_progress');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->every(fn($p) => $p['status'] === 'in_progress'));
    }

    // ===== 作成 =====

    public function test_can_create_project(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/projects', $this->validProjectData());

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'project' => ['id', 'name', 'client_name', 'status']]);

        $this->assertDatabaseHas('projects', [
            'user_id' => $this->user->id,
            'name' => 'テストプロジェクト',
        ]);
    }

    public function test_create_fails_with_missing_required_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/projects', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'client_name', 'status', 'start_date', 'end_date', 'budget_amount', 'hourly_rate']);
    }

    public function test_create_fails_with_end_date_before_start_date(): void
    {
        $data = $this->validProjectData([
            'start_date' => now()->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/projects', $data);

        $response->assertStatus(422)->assertJsonValidationErrors(['end_date']);
    }

    public function test_create_fails_with_invalid_status(): void
    {
        $data = $this->validProjectData(['status' => 'invalid_status']);

        $response = $this->actingAs($this->user)->postJson('/api/projects', $data);

        $response->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    // ===== 詳細 =====

    public function test_can_view_own_project(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->getJson("/api/projects/{$project->id}");

        $response->assertStatus(200)->assertJsonPath('id', $project->id);
    }

    public function test_cannot_view_other_users_project(): void
    {
        $project = Project::factory()->create();

        $response = $this->actingAs($this->user)->getJson("/api/projects/{$project->id}");

        $response->assertStatus(403);
    }

    // ===== 更新 =====

    public function test_can_update_own_project(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->putJson("/api/projects/{$project->id}", [
            'name' => '更新後プロジェクト名',
            'status' => 'completed',
        ]);

        $response->assertStatus(200)->assertJsonPath('project.name', '更新後プロジェクト名');
        $this->assertDatabaseHas('projects', ['id' => $project->id, 'name' => '更新後プロジェクト名']);
    }

    public function test_cannot_update_other_users_project(): void
    {
        $project = Project::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/projects/{$project->id}", [
            'name' => '不正更新',
        ]);

        $response->assertStatus(403);
    }

    // ===== 削除 =====

    public function test_can_delete_own_project(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->deleteJson("/api/projects/{$project->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted($project);
    }

    public function test_cannot_delete_other_users_project(): void
    {
        $project = Project::factory()->create();

        $response = $this->actingAs($this->user)->deleteJson("/api/projects/{$project->id}");

        $response->assertStatus(403);
    }

    // ===== サマリー =====

    public function test_can_get_project_summary(): void
    {
        $project = Project::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->getJson("/api/projects/{$project->id}/summary");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id', 'name', 'total_hours', 'total_earnings',
                'budget_remaining', 'progress_percentage', 'is_over_budget',
            ]);
    }
}
