"""Webhook dispatch scheduler bootstrap for rq-scheduler.

This module is typically run once at container start to ensure the recurring
job exists (idempotent registration).
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

from redis import Redis
from rq_scheduler import Scheduler  # type: ignore[import-untyped]

from app.core.config import settings
from app.core.logging import get_logger
from app.services.webhooks.dispatch import run_flush_webhook_delivery_queue

logger = get_logger(__name__)


def bootstrap_webhook_dispatch_schedule(
    interval_seconds: int | None = None,
    *,
    max_attempts: int = 5,
    retry_sleep_seconds: float = 1.0,
) -> None:
    """Register a recurring queue-flush job and keep it idempotent.

    Retries Redis connectivity to avoid crashing on transient startup ordering.
    """

    effective_interval_seconds = (
        settings.webhook_dispatch_schedule_interval_seconds
        if interval_seconds is None
        else interval_seconds
    )

    last_exc: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            connection = Redis.from_url(settings.webhook_redis_url)
            connection.ping()
            scheduler = Scheduler(
                queue_name=settings.webhook_queue_name,
                connection=connection,
            )

            for job in scheduler.get_jobs():
                if job.id == settings.webhook_dispatch_schedule_id:
                    scheduler.cancel(job)

            scheduler.schedule(
                datetime.now(tz=timezone.utc) + timedelta(seconds=5),
                func=run_flush_webhook_delivery_queue,
                interval=effective_interval_seconds,
                repeat=None,
                id=settings.webhook_dispatch_schedule_id,
                queue_name=settings.webhook_queue_name,
            )
            logger.info(
                "webhook.scheduler.bootstrapped",
                extra={
                    "schedule_id": settings.webhook_dispatch_schedule_id,
                    "queue_name": settings.webhook_queue_name,
                    "interval_seconds": effective_interval_seconds,
                },
            )
            return
        except Exception as exc:
            last_exc = exc
            logger.warning(
                "webhook.scheduler.bootstrap_failed",
                extra={
                    "attempt": attempt,
                    "max_attempts": max_attempts,
                    "error": str(exc),
                },
            )
            if attempt < max_attempts:
                time.sleep(retry_sleep_seconds * attempt)

    raise RuntimeError("Failed to bootstrap webhook dispatch schedule") from last_exc
