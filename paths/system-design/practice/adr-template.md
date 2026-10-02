# Architecture decision record

Status: proposed / accepted / superseded

Date and owner:

## Context and constraints

What user action and invariant need this decision? Which facts are measured and which are assumptions? Include operational/team constraints.

## Options

Compare at least two viable choices. Include the simplest workable option. State latency, consistency, failure, data-ownership and maintenance consequences rather than counting services.

## Decision and justification

Choose one option and connect it to a requirement. Name what becomes harder. Avoid claiming a universal best architecture.

## Evidence and verification

Record experiment, workload, environment, dataset, duration, results and limitations. Separate planned from executed checks. Include correctness and failure behavior, not only throughput.

## Rollout, recovery and security

Describe mixed-version compatibility, data migration, reversible steps, rollback limits, authorization and restore validation.

## Revisit trigger

Name a measurable change or failed assumption that would reopen the decision, and who owns it.

## Example decision sketch

Start with one modular application and a relational database as the authoritative store. Keep export execution in a bounded worker pool. This reduces network contracts while preserving ownership. Revisit independent export deployment if measured export resource contention harms interactive SLOs and the team can operate separate queues, credentials, releases and recovery. A modular boundary makes that change easier; it does not make the extraction free.
