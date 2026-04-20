<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeEntryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'project_id' => Project::factory(),
            'duration_minutes' => fake()->numberBetween(30, 480),
            'date' => fake()->dateTimeBetween('-30 days', 'today'),
            'description' => fake()->sentence(),
        ];
    }
}
