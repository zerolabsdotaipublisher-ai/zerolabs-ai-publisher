"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";

export function PublicWebsiteList({ websites }: { websites: any[] }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!websites || websites.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        No public websites shared yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {websites.map((site) => (
        <div key={site.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
            {site.name || "Untitled Website"}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 capitalize">{site.theme || "Default"} Theme</span>
            <Link
              href={routes.liveSite(site.id)}
              target="_blank"
              className="text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 text-xs flex items-center gap-1"
            >
              View <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
