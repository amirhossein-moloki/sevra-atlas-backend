# PHASE 0 — VALIDATION AUDIT

## 1. Redis Sharing
- **Current State**: Redis is SHARED between cache and potential queue.
- **Risk**: Cache eviction (`allkeys-lru`) can delete active job data, leading to job loss or "stuck" jobs in BullMQ. High cache churn will impact queue performance.
- **Rating**: **CRITICAL RISK**

## 2. Eviction Policy
- **Current State**: `allkeys-lru`.
- **Risk**: Incompatible with BullMQ. BullMQ relies on Redis keys persisting until explicitly deleted. Eviction will break the queue's internal state.
- **Rating**: **CRITICAL RISK**

## 3. Idempotency
- **Current State**: None (Workers not yet implemented in code).
- **Proposed Strategy**: Use `jobId` derived from resource ID.
- **Risk**: Without strict `jobId` enforcement, retries or duplicate events could trigger redundant processing (e.g., generating image variants twice).
- **Rating**: **MEDIUM RISK**

## 4. Async API Contracts
- **Current State**: Media upload is synchronous and blocks the request.
- **Risk**: Large uploads or slow processing cause timeouts and poor user experience. Lack of status reporting makes the async flow opaque.
- **Rating**: **HIGH RISK**

## 5. Monitoring & Observability
- **Current State**: None.
- **Risk**: "Blind spots" in production. Unable to track backlog, failure rates, or processing latency without proper dashboards and metrics.
- **Rating**: **HIGH RISK**

## 6. Rollout Safety
- **Current State**: Theoretical.
- **Risk**: Switching from sync to async without a transition phase can lead to race conditions or duplicate processing if both the old sync code and the new worker are active simultaneously.
- **Rating**: **HIGH RISK**

---

### Overall Risk Assessment: RED (Production Ready: No)
The current setup is unsafe for production job processing due to Redis sharing and lack of async contracts. Isolation and hardening are mandatory before implementation.
