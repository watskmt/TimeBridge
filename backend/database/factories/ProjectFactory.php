<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-6 months', 'now');
        $end = fake()->dateTimeBetween($start, '+6 months');

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'client_name' => fake()->company(),
            'description' => fake()->sentence(),
            'status' => fake()->randomElement(['planning', 'in_progress', 'inspection', 'completed']),
            'start_date' => $start,
            'end_date' => $end,
            'budget_amount' => fake()->randomFloat(2, 100000, 5000000),
            'hourly_rate' => fake()->randomFloat(2, 3000, 15000),
        ];
    }

    public function inProgress(): static
    {
        return $this->state(['status' => 'in_progress']);
    }

    public function completed(): static
    {
        return $this->state(['status' => 'completed']);
    }
}
