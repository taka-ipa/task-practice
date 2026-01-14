<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatchWithRatingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth:sanctum で守る前提
    }

    public function rules(): array
    {
        return [
            'played_at' => ['nullable', 'date'], // 必要なら date_format:Y-m-d\TH:i にしてもOK
            'mode'      => ['nullable', 'string', 'max:255'],
            'rule'      => ['nullable', 'string', 'max:255'],
            'stage'     => ['nullable', 'string', 'max:255'],
            'weapon'    => ['nullable', 'string', 'max:255'],
            'is_win'    => ['nullable', 'boolean'],

            'ratings'               => ['required', 'array', 'min:1'],
            'ratings.*.task_id'     => ['required', 'integer'],
            'ratings.*.rating'      => ['required', 'string', Rule::in(['○', '△', '×'])],
        ];
    }

    public function messages(): array
    {
        return [
            'ratings.required' => 'ratings は必須です',
            'ratings.min'      => 'ratings は1件以上必要です',
        ];
    }
}
