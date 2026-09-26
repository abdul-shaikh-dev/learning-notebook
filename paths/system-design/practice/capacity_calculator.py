"""Offline teaching arithmetic; not a benchmark or a provisioning recommendation."""
from dataclasses import dataclass, asdict
from math import ceil, isfinite
import json


def number(name, value, *, positive=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f'{name} must be a finite number')
    if not isfinite(value) or value < 0 or (positive and value == 0):
        raise ValueError(f'{name} must be finite and {"positive" if positive else "nonnegative"}')
    return value


def fraction(name, value, *, allow_zero=True):
    number(name, value, positive=not allow_zero)
    if value > 1:
        raise ValueError(f'{name} must be at most 1')
    return value


def integer(name, value, minimum=0):
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
        raise ValueError(f'{name} must be an integer >= {minimum}')
    return value


@dataclass(frozen=True)
class Workload:
    requests_per_day: float
    average_rps: float
    peak_rps: float
    peak_payload_bytes_per_second: float


def workload(daily_users, requests_per_user, peak_multiplier, response_bytes):
    integer('daily_users', daily_users)
    number('requests_per_user', requests_per_user)
    number('peak_multiplier', peak_multiplier, positive=True)
    if peak_multiplier < 1:
        raise ValueError('peak_multiplier must be >= 1')
    integer('response_bytes', response_bytes)
    daily = daily_users * requests_per_user
    average = daily / 86400
    peak = average * peak_multiplier
    return Workload(daily, average, peak, peak * response_bytes)


def mean_in_flight(mean_arrival_rps, mean_latency_seconds):
    """Little's Law: stable boundary, means only; not a percentile prediction."""
    return number('mean_arrival_rps', mean_arrival_rps) * number('mean_latency_seconds', mean_latency_seconds)


def retained_bytes(events_per_day, bytes_per_event, retention_days, overhead_factor=1, copies=1):
    integer('events_per_day', events_per_day)
    integer('bytes_per_event', bytes_per_event)
    number('retention_days', retention_days)
    number('overhead_factor', overhead_factor, positive=True)
    if overhead_factor < 1:
        raise ValueError('overhead_factor must be >= 1; compression is outside this model')
    integer('copies', copies, 1)
    raw = events_per_day * bytes_per_event * retention_days
    return {'raw_bytes': raw, 'modeled_bytes': raw * overhead_factor * copies}


def instance_count(peak_rps, measured_rps_per_instance, utilization_factor, tolerated_instance_losses=0):
    """Assumes uniform load and independent identical instances, shared limits excluded."""
    number('peak_rps', peak_rps)
    number('measured_rps_per_instance', measured_rps_per_instance, positive=True)
    fraction('utilization_factor', utilization_factor, allow_zero=False)
    integer('tolerated_instance_losses', tolerated_instance_losses)
    serving = ceil(peak_rps / (measured_rps_per_instance * utilization_factor))
    return serving + tolerated_instance_losses


def backlog_after(initial_jobs, arrival_rps, service_rps, seconds):
    """Constant-rate fluid approximation; idle service capacity is not banked."""
    number('initial_jobs', initial_jobs)
    number('arrival_rps', arrival_rps)
    number('service_rps', service_rps)
    number('seconds', seconds)
    return max(0, initial_jobs + (arrival_rps - service_rps) * seconds)


def drain_seconds(backlog_jobs, arrival_rps, service_rps):
    """Return None for non-draining positive backlog; zero backlog needs zero time."""
    number('backlog_jobs', backlog_jobs)
    number('arrival_rps', arrival_rps)
    number('service_rps', service_rps)
    if backlog_jobs == 0:
        return 0
    spare = service_rps - arrival_rps
    return backlog_jobs / spare if spare > 0 else None


def allowed_bad_requests(eligible_requests, success_target):
    integer('eligible_requests', eligible_requests)
    fraction('success_target', success_target)
    return eligible_requests * (1 - success_target)


if __name__ == '__main__':
    report = {
        'assumptions': 'Decimal bytes; hypothetical workload; means not percentiles; no cloud price or benchmark claims.',
        'workload': asdict(workload(10000, 40, 8, 2000)),
        'mean_in_flight_at_200rps_and_025s': mean_in_flight(200, 0.25),
        'storage': retained_bytes(200000, 500, 30, 1.5, 3),
        'instances_370rps_100limit_07factor_one_loss': instance_count(370, 100, 0.7, 1),
        'burst_backlog_jobs': backlog_after(0, 120, 100, 60),
        'drain_seconds_at_80arrivals_100service': drain_seconds(1200, 80, 100),
        'allowed_bad_requests_1m_at_999': allowed_bad_requests(1000000, 0.999),
    }
    print(json.dumps(report, indent=2, allow_nan=False))
