"use client";

import { useEffect, useMemo, useState } from "react";

import { SignInButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { Button } from "@/components/ui/button";
import MetricSparkline from "@/components/charts/metric-sparkline";
import { getApiBaseUrl } from "@/lib/api-base";

type RangeKey = "24h" | "7d";
type BucketKey = "hour" | "day";

type SeriesPoint = {
  period: string;
  value: number;
};

type WipPoint = {
  period: string;
  inbox: number;
  in_progress: number;
  review: number;
};

type RangeSeries = {
  range: RangeKey;
  bucket: BucketKey;
  points: SeriesPoint[];
};

type WipRangeSeries = {
  range: RangeKey;
  bucket: BucketKey;
  points: WipPoint[];
};

type SeriesSet = {
  primary: RangeSeries;
  comparison: RangeSeries;
};

type WipSeriesSet = {
  primary: WipRangeSeries;
  comparison: WipRangeSeries;
};

type DashboardMetrics = {
  range: RangeKey;
  generated_at: string;
  kpis: {
    active_agents: number;
    tasks_in_progress: number;
    error_rate_pct: number;
    median_cycle_time_hours_7d: number | null;
  };
  throughput: SeriesSet;
  cycle_time: SeriesSet;
  error_rate: SeriesSet;
  wip: WipSeriesSet;
};

const apiBase = getApiBaseUrl();

const hourFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const updatedFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const formatPeriod = (value: string, bucket: BucketKey) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return bucket === "hour" ? hourFormatter.format(date) : dayFormatter.format(date);
};

const formatNumber = (value: number) => value.toLocaleString("en-US");
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatHours = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "--" : `${value.toFixed(1)}h`;

function buildSeries(series: RangeSeries) {
  return series.points.map((point) => ({
    period: formatPeriod(point.period, series.bucket),
    value: Number(point.value ?? 0),
  }));
}

function buildWipSeries(series: WipRangeSeries) {
  return series.points.map((point) => ({
    period: formatPeriod(point.period, series.bucket),
    inbox: Number(point.inbox ?? 0),
    in_progress: Number(point.in_progress ?? 0),
    review: Number(point.review ?? 0),
  }));
}

function buildSparkline(series: RangeSeries) {
  return {
    values: series.points.map((point) => Number(point.value ?? 0)),
    labels: series.points.map((point) => formatPeriod(point.period, series.bucket)),
  };
}

function buildWipSparkline(series: WipRangeSeries, key: keyof WipPoint) {
  return {
    values: series.points.map((point) => Number(point[key] ?? 0)),
    labels: series.points.map((point) => formatPeriod(point.period, series.bucket)),
  };
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  formatter?: (value: number, name?: string) => string;
};

function TooltipCard({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-slate-900">
              {formatter ? formatter(Number(entry.value ?? 0), entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sublabel,
  sparkline,
}: {
  label: string;
  value: string;
  sublabel?: string;
  sparkline?: { values: number[]; labels: string[] };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {sublabel ? (
        <div className="mt-2 text-xs text-slate-500">{sublabel}</div>
      ) : null}
      {sparkline ? (
        <div className="mt-4">
          <MetricSparkline
            values={sparkline.values}
            labels={sparkline.labels}
            bucket="week"
          />
        </div>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  sparkline,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  sparkline?: { values: number[]; labels: string[] };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {subtitle}
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{title}</div>
        </div>
        <div className="text-xs text-slate-500">24h</div>
      </div>
      <div className="mt-4 h-56">{children}</div>
      {sparkline ? (
        <div className="mt-4">
          <div className="text-xs text-slate-500">7d trend</div>
          <MetricSparkline
            values={sparkline.values}
            labels={sparkline.labels}
            bucket="week"
          />
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const { getToken, isSignedIn } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBase}/api/v1/metrics/dashboard?range=24h`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Unable to load dashboard metrics.");
      }
      const data = (await response.json()) as DashboardMetrics;
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const throughputSeries = useMemo(
    () => (metrics ? buildSeries(metrics.throughput.primary) : []),
    [metrics],
  );
  const cycleSeries = useMemo(
    () => (metrics ? buildSeries(metrics.cycle_time.primary) : []),
    [metrics],
  );
  const errorSeries = useMemo(
    () => (metrics ? buildSeries(metrics.error_rate.primary) : []),
    [metrics],
  );
  const wipSeries = useMemo(
    () => (metrics ? buildWipSeries(metrics.wip.primary) : []),
    [metrics],
  );

  const throughputSpark = useMemo(
    () => (metrics ? buildSparkline(metrics.throughput.comparison) : null),
    [metrics],
  );
  const cycleSpark = useMemo(
    () => (metrics ? buildSparkline(metrics.cycle_time.comparison) : null),
    [metrics],
  );
  const errorSpark = useMemo(
    () => (metrics ? buildSparkline(metrics.error_rate.comparison) : null),
    [metrics],
  );
  const wipSpark = useMemo(
    () => (metrics ? buildWipSparkline(metrics.wip.comparison, "in_progress") : null),
    [metrics],
  );

  const updatedAtLabel = useMemo(() => {
    if (!metrics?.generated_at) return null;
    const date = new Date(metrics.generated_at);
    if (Number.isNaN(date.getTime())) return null;
    return updatedFormatter.format(date);
  }, [metrics]);

  return (
    <DashboardShell>
      <SignedOut>
        <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl surface-panel p-10 text-center lg:col-span-2">
          <p className="text-sm text-muted">
            Sign in to access the dashboard.
          </p>
          <SignInButton
            mode="modal"
            forceRedirectUrl="/onboarding"
            signUpForceRedirectUrl="/onboarding"
          >
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-strong">Dashboard</h2>
            {updatedAtLabel ? (
              <div className="text-xs text-muted">Updated {updatedAtLabel}</div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              {error}
            </div>
          ) : null}

          {isLoading && !metrics ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading dashboard metrics…
            </div>
          ) : null}

          {metrics ? (
            <>
              <div className="grid gap-4 lg:grid-cols-4">
                <KpiCard
                  label="Active agents"
                  value={formatNumber(metrics.kpis.active_agents)}
                  sublabel="Last 10 minutes"
                />
                <KpiCard
                  label="Tasks in progress"
                  value={formatNumber(metrics.kpis.tasks_in_progress)}
                  sublabel="Current WIP"
                  sparkline={wipSpark ?? undefined}
                />
                <KpiCard
                  label="Error rate"
                  value={formatPercent(metrics.kpis.error_rate_pct)}
                  sublabel="24h average"
                  sparkline={errorSpark ?? undefined}
                />
                <KpiCard
                  label="Median cycle time"
                  value={formatHours(metrics.kpis.median_cycle_time_hours_7d)}
                  sublabel="7d median"
                  sparkline={cycleSpark ?? undefined}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Throughput"
                  subtitle="Completed tasks"
                  sparkline={throughputSpark ?? undefined}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={throughputSeries} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip content={<TooltipCard formatter={(v) => formatNumber(v)} />} />
                      <Bar dataKey="value" name="Completed" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Cycle time"
                  subtitle="Avg hours to review"
                  sparkline={cycleSpark ?? undefined}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cycleSeries} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        content={<TooltipCard formatter={(v) => `${v.toFixed(1)}h`} />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Hours"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Error rate"
                  subtitle="Failed events"
                  sparkline={errorSpark ?? undefined}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={errorSeries} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        content={<TooltipCard formatter={(v) => formatPercent(v)} />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Error rate"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Work in progress"
                  subtitle="Status distribution"
                  sparkline={wipSpark ?? undefined}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={wipSeries} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip content={<TooltipCard formatter={(v) => formatNumber(v)} />} />
                      <Area
                        type="monotone"
                        dataKey="inbox"
                        name="Inbox"
                        stackId="wip"
                        fill="#cbd5f5"
                        stroke="#94a3b8"
                        fillOpacity={0.7}
                      />
                      <Area
                        type="monotone"
                        dataKey="in_progress"
                        name="In progress"
                        stackId="wip"
                        fill="#93c5fd"
                        stroke="#2563eb"
                        fillOpacity={0.7}
                      />
                      <Area
                        type="monotone"
                        dataKey="review"
                        name="Review"
                        stackId="wip"
                        fill="#86efac"
                        stroke="#16a34a"
                        fillOpacity={0.7}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </>
          ) : null}
        </div>
      </SignedIn>
    </DashboardShell>
  );
}
