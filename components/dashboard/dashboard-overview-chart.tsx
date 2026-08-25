"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartDataPoint {
  name: string
  total: number
}

interface DashboardOverviewChartProps {
  data: ChartDataPoint[]
}

export function DashboardOverviewChart({ data }: DashboardOverviewChartProps) {
  // Find the max value to normalize bar heights
  const maxTotal = Math.max(...data.map((d) => d.total), 1)

  return (
    <Card className="col-span-4 h-[400px]">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2 flex h-[300px]">
        {/* Simple CSS-based Bar Chart */}
        <div className="flex h-full w-full items-end justify-between px-6 pt-4 pb-2">
          {data.map((item, index) => {
            const heightPercent = `${(item.total / maxTotal) * 100}%`
            return (
              <div key={index} className="flex flex-col items-center gap-2 w-full">
                <div
                  className="w-4/5 max-w-[40px] bg-primary rounded-t-sm"
                  style={{ height: heightPercent, minHeight: '4px', backgroundColor: 'currentColor' }}
                  title={`${item.name}: ${item.total}`}
                />
                <span className="text-xs text-muted-foreground mt-2">{item.name}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
