"use client";

import { useCallback, useEffect, useState } from "react";
import { getDefaultDashboardErrorMessage,  } from "@/lib/dashboard/client";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardRecentActivity } from "./dashboard-recent-activity";
import { DashboardOverviewChart } from "./dashboard-overview-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";

interface DashboardSummaryApiResponse {
  ok: boolean;
  summary?: DashboardSummary;
  error?: string;
}

interface DashboardHomeProps {
  initialSummary?: DashboardSummary;
  initialError?: string;
}

const DASHBOARD_SUMMARY_POLL_INTERVAL_MS = 30_000;

export function DashboardHome({ initialSummary, initialError }: DashboardHomeProps) {
  const [summary, setSummary] = useState<DashboardSummary | undefined>(initialSummary);
  const [loading, setLoading] = useState(!initialSummary && !initialError);
  const [error, setError] = useState<string | undefined>(initialError);

  const loadSummary = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLoading(true);
    }
    setError(undefined);

    try {
      const response = await fetch("/api/dashboard/summary", {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json()) as DashboardSummaryApiResponse;
      if (!response.ok || !body.ok || !body.summary) {
        throw new Error(body.error || getDefaultDashboardErrorMessage());
      }

      setSummary(body.summary);
      setError(undefined);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : getDefaultDashboardErrorMessage());
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void loadSummary({ silent: true });
    }, DASHBOARD_SUMMARY_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadSummary]);


  if (loading && !summary) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {Array.from({ length: 4 }).map((_, index) => (
             <div key={index} className="h-[120px] rounded-xl border bg-card/50 animate-pulse" />
           ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <p className="text-red-500">{error || getDefaultDashboardErrorMessage()}</p>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md" onClick={() => void loadSummary()}>Retry</button>
      </div>
    );
  }

  // Construct chart data from non-fabricated metrics to respect AGENTS.md rule
  const chartData = [
    { name: "Websites", total: summary.metrics.totalWebsites },
    { name: "Generated", total: summary.metrics.generatedContentCount },
    { name: "Published", total: summary.metrics.publishedItems },
    { name: "Scheduled", total: summary.metrics.scheduledItems },
    { name: "Attention", total: summary.metrics.attentionRequiredItems }
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => void loadSummary()}
            disabled={loading}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
          <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardMetricCard
              label="Total websites"
              value={summary.metrics.totalWebsites}
              hint="Owned website records"
              icon={<DollarSign />}
            />
            <DashboardMetricCard
              label="Published items"
              value={summary.metrics.publishedItems}
              hint="Live websites and content"
              icon={<Users />}
            />
            <DashboardMetricCard
              label="Generated content"
              value={summary.metrics.generatedContentCount}
              hint="Website + social assets"
              icon={<CreditCard />}
            />
            <DashboardMetricCard
              label="Scheduled items"
              value={summary.metrics.scheduledItems}
              hint="Content and social schedules"
              icon={<Activity />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <DashboardOverviewChart data={chartData} />
            <DashboardRecentActivity items={summary.recentActivity} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
