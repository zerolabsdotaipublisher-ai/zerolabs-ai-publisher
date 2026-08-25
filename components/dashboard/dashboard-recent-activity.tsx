import type { DashboardRecentActivityItem } from "@/lib/dashboard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardRecentActivityProps {
  items: DashboardRecentActivityItem[];
}

export function DashboardRecentActivity({ items }: DashboardRecentActivityProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest events across generation and publishing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          <div className="space-y-8">
            {items.map((item) => {
              // Generate simple initials from the title
              const initials = item.title
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase() || 'A';

              return (
                <div key={item.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1 overflow-hidden">
                    <p className="text-sm font-medium leading-none truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.detail}
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs whitespace-nowrap text-right pl-4">
                    <time dateTime={item.timestamp}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
