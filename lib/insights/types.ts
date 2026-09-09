export type InsightMetricId =
  | "website-views"
  | "profile-views"
  | "post-hearts"
  | "post-shares"
  | "website-hearts"
  | "website-shares";

export interface InsightMetric {
  id: InsightMetricId;
  title: string;
  description: string;
  value: number | null;
  sourceTable: string;
}

export interface InsightsReadiness {
  configuredMetricCount: number;
  totalMetricCount: number;
  missingTables: string[];
}

export interface InsightsChartPoint {
  date: string;
  label: string;
  websiteViews: number | null;
  profileViews: number | null;
}

export interface InsightsChart {
  points: InsightsChartPoint[];
  websiteViewsConfigured: boolean;
  profileViewsConfigured: boolean;
}

export interface InsightsSnapshot {
  metrics: InsightMetric[];
  readiness: InsightsReadiness;
  chart: InsightsChart;
}
