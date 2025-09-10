"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import chartData from "./data/chart-data.json";

const chartConfig = {
  open: {
    label: "Open",
    color: "#C4C4C4",
  },
  detected: {
    label: "Detected", 
    color: "#6B7280",
  },
  resolved: {
    label: "Resolved",
    color: "#10B981",
  },
} satisfies ChartConfig;

export function TriggeredResolvedChart() {
  return (
    <div className="w-full">
      {/* Professional Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Code Analysis Overview
          </h2>
          <p className="text-gray-600 text-sm">Track code analysis and AI processing trends</p>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500">Time Period</span>
          <div className="text-lg font-semibold text-gray-900">Last 60 days</div>
        </div>
      </div>

      {/* Professional Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#C4C4C4]"></div>
          <span className="text-sm font-medium text-gray-700">Pending Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#6B7280]"></div>
          <span className="text-sm font-medium text-gray-700">New Files</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#10B981]"></div>
          <span className="text-sm font-medium text-gray-700">Analyzed</span>
        </div>
      </div>

      {/* Professional Chart */}
      <div className="w-full h-64">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart 
            data={chartData.triggeredVsResolved}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            barCategoryGap="30%"
          >
            <CartesianGrid 
              horizontal={true}
              vertical={false}
              strokeDasharray="3 3"
              stroke="#E5E7EB"
            />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: "#6B7280", 
                fontSize: 13,
                fontWeight: 500
              }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: "#6B7280", 
                fontSize: 13,
                fontWeight: 500
              }}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
            />
            <ChartTooltip 
              cursor={false}
              content={<ChartTooltipContent />}
            />
            {/* Stacked gray bars (Open + Detected) */}
            <Bar 
              dataKey="open" 
              stackId="triggered"
              fill="#C4C4C4"
              radius={[0, 0, 0, 0]}
              maxBarSize={30}
            />
            <Bar 
              dataKey="detected" 
              stackId="triggered"
              fill="#6B7280"
              radius={[3, 3, 0, 0]}
              maxBarSize={30}
            />
            {/* Separate green bar */}
            <Bar 
              dataKey="resolved" 
              fill="#10B981"
              radius={[3, 3, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
} 