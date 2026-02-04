from __future__ import annotations

from datetime import datetime
from typing import Literal

from sqlmodel import SQLModel


class DashboardSeriesPoint(SQLModel):
    period: datetime
    value: float


class DashboardWipPoint(SQLModel):
    period: datetime
    inbox: int
    in_progress: int
    review: int


class DashboardRangeSeries(SQLModel):
    range: Literal["24h", "7d"]
    bucket: Literal["hour", "day"]
    points: list[DashboardSeriesPoint]


class DashboardWipRangeSeries(SQLModel):
    range: Literal["24h", "7d"]
    bucket: Literal["hour", "day"]
    points: list[DashboardWipPoint]


class DashboardSeriesSet(SQLModel):
    primary: DashboardRangeSeries
    comparison: DashboardRangeSeries


class DashboardWipSeriesSet(SQLModel):
    primary: DashboardWipRangeSeries
    comparison: DashboardWipRangeSeries


class DashboardKpis(SQLModel):
    active_agents: int
    tasks_in_progress: int
    error_rate_pct: float
    median_cycle_time_hours_7d: float | None


class DashboardMetrics(SQLModel):
    range: Literal["24h", "7d"]
    generated_at: datetime
    kpis: DashboardKpis
    throughput: DashboardSeriesSet
    cycle_time: DashboardSeriesSet
    error_rate: DashboardSeriesSet
    wip: DashboardWipSeriesSet
