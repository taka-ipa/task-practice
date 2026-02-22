<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'sort_order' => $this->faker->numberBetween(1, 50),
            // user_id は Seeder側で上書きするならここは不要
        ];
    }
}
