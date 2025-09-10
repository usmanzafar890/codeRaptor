"use client"

import { StatsCards } from "@/components/stats-cards/stats-cards"
import { ProjectsTable } from "@/components/projects-table/projects-table"
import { TriggeredResolvedChart } from "@/components/triggered-resolved-chart/triggered-resolved-chart"
import { RecentActivity } from "@/components/recent-activity/recent-activity"
import { IssuesByRepository } from "@/components/issues-by-repository/issues-by-repository"
import { CreditsUsage } from "@/components/credits-usage/credit-usage"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div>
          <StatsCards />
        </div>

        <div className="space-y-8 mt-8">
          {/* Projects Table */}
          <div className="transform transition-all duration-300">
            <ProjectsTable />
          </div>

          {/* Chart Section */}
          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart - Takes 2/3 width */}
              <div className="lg:col-span-2">
                <div className="glass rounded-2xl shadow-xl p-6 h-full">
                  <TriggeredResolvedChart />
                </div>
              </div>
              
              {/* Recent Activity - Takes 1/3 width */}
              <div className="lg:col-span-1">
                <div className="h-full">
                  <RecentActivity />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cards Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issues by Repository - Takes 1/2 width */}
            <div className="lg:col-span-1">
              <div className="h-full">
                <IssuesByRepository />
              </div>
            </div>

            {/* Credits Usage - Takes 1/2 width */}
            <div className="lg:col-span-1">
              <div className="h-full">
                <CreditsUsage />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
