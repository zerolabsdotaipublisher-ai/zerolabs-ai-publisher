import type { InsightsChart } from "@/lib/insights/types";

interface ViewsChartProps {
  chart: InsightsChart;
}

function getMaxValue(chart: InsightsChart): number {
  const values = chart.points.flatMap((point) => [point.websiteViews, point.profileViews]);
  const maxValue = Math.max(0, ...values.filter((value): value is number => value !== null));
  return Math.max(1, maxValue);
}

function hasRecordedViews(chart: InsightsChart): boolean {
  return chart.points.some((point) => point.websiteViews || point.profileViews);
}

export function ViewsChart({ chart }: ViewsChartProps) {
  const maxValue = getMaxValue(chart);
  const hasConfiguredSeries = chart.websiteViewsConfigured || chart.profileViewsConfigured;
  const recordedViews = hasRecordedViews(chart);
  const unavailableSeries = [
    !chart.websiteViewsConfigured ? "Website views" : null,
    !chart.profileViewsConfigured ? "Profile views" : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <section className="dashboard-panel-shell insights-chart-panel" aria-labelledby="views-over-time-title">
      <header className="dashboard-section-heading">
        <div>
          <h2 id="views-over-time-title">Views over time</h2>
          <p>Website and profile views for the last 7 days.</p>
        </div>
        <div className="insights-chart-legend" aria-label="Chart legend">
          {chart.websiteViewsConfigured ? <span><i className="insights-chart-key is-website" aria-hidden="true" />Website views</span> : null}
          {chart.profileViewsConfigured ? <span><i className="insights-chart-key is-profile" aria-hidden="true" />Profile views</span> : null}
        </div>
      </header>

      {hasConfiguredSeries ? (
        <>
          <div
            className="insights-chart"
            role="img"
            aria-label={`Views over time. Highest daily view count is ${maxValue}.`}
          >
            {chart.points.map((point) => (
              <div key={point.date} className="insights-chart-day">
                <div className="insights-chart-bars">
                  {point.websiteViews !== null ? (
                    <span
                      className="insights-chart-bar is-website"
                      style={{ height: `${(point.websiteViews / maxValue) * 100}%` }}
                      title={`${point.label}: ${point.websiteViews} website views`}
                    />
                  ) : null}
                  {point.profileViews !== null ? (
                    <span
                      className="insights-chart-bar is-profile"
                      style={{ height: `${(point.profileViews / maxValue) * 100}%` }}
                      title={`${point.label}: ${point.profileViews} profile views`}
                    />
                  ) : null}
                </div>
                <span className="insights-chart-day-label">{point.label}</span>
                <span className="sr-only">
                  {point.label}: {point.websiteViews === null ? "website views setup required" : `${point.websiteViews} website views`}; {point.profileViews === null ? "profile views setup required" : `${point.profileViews} profile views`}.
                </span>
              </div>
            ))}
          </div>
          {!recordedViews ? <p className="dashboard-section-footnote">No view events recorded in the last 7 days.</p> : null}
        </>
      ) : (
        <p className="insights-chart-empty">Setup required before view events can be charted.</p>
      )}

      {unavailableSeries.length > 0 ? (
        <p className="dashboard-section-footnote">Setup required: {unavailableSeries.join(" and ")}.</p>
      ) : null}
    </section>
  );
}
