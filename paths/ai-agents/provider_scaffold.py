"""Offline Responses request builder and evidence accounting. Never sends requests."""
import math

def request(model, prompt):
    if not isinstance(model, str) or not model.strip() or not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("explicit model and prompt required")
    return {"model": model, "input": prompt, "max_output_tokens": 256,
            "parallel_tool_calls": False,
            "tools": [{"type": "function", "name": "read_lesson", "description": "Read an authorized lesson",
                       "strict": True, "parameters": {"type": "object", "properties": {"lesson_id": {"type": "string"}},
                       "required": ["lesson_id"], "additionalProperties": False}}]}

def evidence(case_id, model, usage, input_rate, output_rate, passed):
    for key in ("input_tokens", "output_tokens"):
        if type(usage.get(key)) is not int or usage[key] < 0:
            raise ValueError("invalid usage")
    for rate in (input_rate, output_rate):
        if type(rate) not in (int, float) or not math.isfinite(rate) or rate < 0:
            raise ValueError("invalid per-million-token rate")
    if type(passed) is not bool:
        raise ValueError("explicit evaluation outcome required")
    return {"case_id": case_id, "model": model, "usage": dict(usage), "passed": passed,
            "estimated_token_cost": (usage["input_tokens"] * input_rate + usage["output_tokens"] * output_rate) / 1_000_000}
