'use client';

import { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, LineChart, PieChart, Calendar, GitCommit, Users } from 'lucide-react';
import { format, subDays, differenceInDays, parseISO, isValid } from 'date-fns';

interface ProjectStatisticsProps {
  projectId: string;
}

// Chart data types
interface CommitActivityData {
  date: string;
  count: number;
}

interface AuthorContributionData {
  author: string;
  commits: number;
  color: string;
}

export function ProjectStatistics({ projectId }: ProjectStatisticsProps) {
  const [activeTab, setActiveTab] = useState<string>('activity');
  const [timeRange, setTimeRange] = useState<number>(30); // Default to 30 days
  const [allTimeSelected, setAllTimeSelected] = useState<boolean>(false); // Track if all time is selected
  
  // Fetch all commits for the project
  const { data: commitsData, isLoading } = api.project.getCommitsSingle.useQuery(
    { projectId },
    { 
      staleTime: 60000,
      retry: 3,
      refetchOnWindowFocus: false
    }
  );
  console.log("🚀 ~ ProjectStatistics ~ data:", commitsData)

  // Process commit data for different visualizations
  const [commitActivity, setCommitActivity] = useState<CommitActivityData[]>([]);
  const [authorContributions, setAuthorContributions] = useState<AuthorContributionData[]>([]);
  
  // Debug state
  console.log("Current commit activity data:", commitActivity);
  console.log("All time selected:", allTimeSelected, "Time range:", timeRange);
  
  useEffect(() => {
    if (commitsData?.commits) {
      // If all time is selected, pass 0 as the time range
      processCommitActivity(commitsData.commits, allTimeSelected ? 0 : timeRange);
      processAuthorContributions(commitsData.commits);
    }
  }, [commitsData, timeRange, allTimeSelected]);

  // Process commit activity over time
  const processCommitActivity = (commits: any[], days: number) => {
    console.log('Processing commits:', commits.length);
    
    // Create a map for dates with commit counts
    const activityMap = new Map<string, number>();
    
    // Initialize dates based on whether we're showing all time or a specific range
    const today = new Date();
    
    if (days > 0) {
      // Initialize specific date range
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        activityMap.set(dateStr, 0);
      }
    } else {
      // For all time view, we'll collect dates from commits first
      commits.forEach(commit => {
        if (commit.commitDate) {
          try {
            let commitDate;
            if (typeof commit.commitDate === 'string') {
              commitDate = new Date(commit.commitDate);
            } else if (commit.commitDate instanceof Date) {
              commitDate = commit.commitDate;
            } else {
              return;
            }
            
            if (isValid(commitDate)) {
              const dateStr = format(commitDate, 'yyyy-MM-dd');
              if (!activityMap.has(dateStr)) {
                activityMap.set(dateStr, 0);
              }
            }
          } catch (error) {
            console.error('Error processing date:', error);
          }
        }
      });
      
      // If no commits were found, add today as a fallback
      if (activityMap.size === 0) {
        activityMap.set(format(today, 'yyyy-MM-dd'), 0);
      }
    }
    
    // Count commits per day
    commits.forEach(commit => {
      try {
        // Skip if no commit date
        if (!commit.commitDate) return;
        
        // Convert commit date to a Date object safely
        let commitDate: Date;
        
        if (commit.commitDate instanceof Date) {
          commitDate = commit.commitDate;
        } else if (typeof commit.commitDate === 'string') {
          // Try to parse the date string
          commitDate = new Date(commit.commitDate);
        } else if (typeof commit.commitDate === 'number') {
          // Handle timestamp
          commitDate = new Date(commit.commitDate);
        } else {
          // Skip if we can't determine the date type
          console.warn('Unknown commit date type:', typeof commit.commitDate);
          return;
        }
        
        // Skip invalid dates
        if (!commitDate || !isValid(commitDate) || isNaN(commitDate.getTime())) {
          console.warn('Invalid date:', commit.commitDate);
          return;
        }
        
        // Check if the commit is within the selected time range
        const daysAgo = differenceInDays(today, commitDate);
        
        // Include all commits if days is set to 0 (all time)
        if (days === 0 || daysAgo <= days) {
          const dateStr = format(commitDate, 'yyyy-MM-dd');
          
          // If the date is not in our initialized range, add it
          if (!activityMap.has(dateStr)) {
            activityMap.set(dateStr, 0);
          }
          
          // Increment the commit count for this date
          activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
        }
      } catch (error) {
        console.error('Error processing commit:', error, commit);
      }
    });
    
    // Convert map to array for charting and sort by date
    const activityData = Array.from(activityMap.entries())
      .map(([date, count]) => ({
        date,
        count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    console.log('Processed activity data:', activityData.length, 'data points');
    setCommitActivity(activityData);
  };
  
  // Process author contributions
  const processAuthorContributions = (commits: any[]) => {
    const authorMap = new Map<string, number>();
    
    // Count commits per author
    commits.forEach(commit => {
      if (commit.commitAuthorName) {
        const author = commit.commitAuthorName;
        authorMap.set(author, (authorMap.get(author) || 0) + 1);
      }
    });
    
    // Generate colors for each author
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    
    // Convert map to array for charting
    const contributionsData = Array.from(authorMap.entries())
      .map(([author, commits], index) => ({
        author,
        commits,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10); // Limit to top 10 contributors
    
    setAuthorContributions(contributionsData);
  };

  // Handle loading state
  if (isLoading) {
    return <StatisticsLoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Statistics</CardTitle>
        <CardDescription>Visualizing project activity and contributions</CardDescription>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList>
            <TabsTrigger value="activity">
              <LineChart className="h-4 w-4 mr-2" />
              Commit Activity
            </TabsTrigger>
            <TabsTrigger value="contributors">
              <Users className="h-4 w-4 mr-2" />
              Contributors
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {activeTab === 'activity' && (
          <div className="flex justify-end mt-2">
            <Tabs 
              value={allTimeSelected ? 'all' : timeRange.toString()} 
              onValueChange={(value) => {
                if (value === 'all') {
                  setAllTimeSelected(true);
                } else {
                  setAllTimeSelected(false);
                  setTimeRange(parseInt(value));
                }
              }}
            >
              <TabsList>
                <TabsTrigger value="7">7 days</TabsTrigger>
                <TabsTrigger value="30">30 days</TabsTrigger>
                <TabsTrigger value="90">90 days</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <TabsContent value="activity" className="mt-0">
          {isLoading ? (
            <div className="h-80 w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-500">Loading commit data...</p>
              </div>
            </div>
          ) : commitActivity.length > 0 ? (
            <div className="h-80 w-full">
              <CommitActivityChart data={commitActivity} />
            </div>
          ) : (
            <div className="h-80 w-full flex items-center justify-center">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No commit activity data available</p>
                <p className="text-sm text-gray-400 max-w-md mx-auto mt-2">
                  No commits have been recorded in the selected time period
                </p>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="contributors" className="mt-0">
          {authorContributions.length > 0 ? (
            <div className="h-80 w-full">
              <AuthorContributionsChart data={authorContributions} />
            </div>
          ) : (
            <div className="h-80 w-full flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No contributor data available</p>
                <p className="text-sm text-gray-400 max-w-md mx-auto mt-2">
                  No author information found in commit history
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </CardContent>
    </Card>
  );
}

// Commit Activity Chart Component
function CommitActivityChart({ data }: { data: CommitActivityData[] }) {
  console.log("Rendering chart with data:", data);
  
  // Safety check for empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-500">No commit data available to display</p>
          <p className="text-sm text-gray-400">Try selecting a different time range</p>
        </div>
      </div>
    );
  }
  
  // Special case for only one data point
  if (data.length === 1) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-500">Only one day with commits: {data[0].date}</p>
          <p className="text-sm text-gray-400">Count: {data[0].count} commit(s)</p>
        </div>
      </div>
    );
  }
  
  // Find the maximum commit count to set the y-axis scale
  const maxCommits = Math.max(...data.map(d => d.count), 5);
  const chartHeight = 300;
  const chartWidth = 1000;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  
  // Calculate color intensity based on commit count
  const getCommitColor = (count: number) => {
    // Scale from light blue to dark blue based on commit count
    const intensity = Math.min(0.2 + (count / maxCommits) * 0.8, 1);
    return `rgba(59, 130, 246, ${intensity})`;
  };
  
  // Calculate point size based on commit count
  const getPointSize = (count: number) => {
    // Min size 4, max size 12 based on commit count
    return 4 + (count / maxCommits) * 8;
  };
  
  // Calculate positions
  const xStep = (chartWidth - padding.left - padding.right) / (data.length - 1);
  const yScale = (chartHeight - padding.top - padding.bottom) / maxCommits;
  
  // Generate path for the line
  let linePath = '';
  
  // Safety check for xStep (avoid division by zero)
  if (data.length <= 1) {
    // Default to a flat line if there's only one point
    linePath = `M ${padding.left},${chartHeight - padding.bottom - 50} L ${chartWidth - padding.right},${chartHeight - padding.bottom - 50}`;
  } else {
    // Normal path generation
    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      const y = chartHeight - padding.bottom - d.count * yScale;
      if (i === 0) {
        linePath += `M ${x},${y}`;
      } else {
        linePath += ` L ${x},${y}`;
      }
    });
  }
  
  // Generate area under the line
  let areaPath = linePath;
  if (data.length > 1) {
    areaPath += ` L ${padding.left + (data.length - 1) * xStep},${chartHeight - padding.bottom}`;
    areaPath += ` L ${padding.left},${chartHeight - padding.bottom} Z`;
  } else {
    // Fallback for single point
    areaPath += ` L ${chartWidth - padding.right},${chartHeight - padding.bottom}`;
    areaPath += ` L ${padding.left},${chartHeight - padding.bottom} Z`;
  }
  
  return (
    <div className="relative h-full w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="font-sans">
        {/* Y-axis */}
        <line 
          x1={padding.left} 
          y1={padding.top} 
          x2={padding.left} 
          y2={chartHeight - padding.bottom} 
          stroke="#e2e8f0" 
          strokeWidth="1"
        />
        
        {/* X-axis */}
        <line 
          x1={padding.left} 
          y1={chartHeight - padding.bottom} 
          x2={chartWidth - padding.right} 
          y2={chartHeight - padding.bottom} 
          stroke="#e2e8f0" 
          strokeWidth="1"
        />
        
        {/* Y-axis labels */}
        {Array.from({ length: 6 }).map((_, i) => {
          const value = Math.round(maxCommits * i / 5);
          const y = chartHeight - padding.bottom - value * yScale;
          return (
            <g key={`y-label-${i}`}>
              <line 
                x1={padding.left - 5} 
                y1={y} 
                x2={padding.left} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeWidth="1"
              />
              <text 
                x={padding.left - 10} 
                y={y + 4} 
                textAnchor="end" 
                fontSize="12" 
                fill="#64748b"
              >
                {value}
              </text>
              <line 
                x1={padding.left} 
                y1={y} 
                x2={chartWidth - padding.right} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeWidth="0.5" 
                strokeDasharray="4"
              />
            </g>
          );
        })}
        
        {/* X-axis labels (dates) */}
        {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((d, i, filteredData) => {
          const originalIndex = data.findIndex(item => item.date === d.date);
          const x = padding.left + originalIndex * xStep;
          
          // Safely parse the date
          let dateObj;
          try {
            dateObj = new Date(d.date);
          } catch (e) {
            dateObj = new Date(); // Fallback to current date if parsing fails
          }
          
          return (
            <g key={`x-label-${i}`} transform={`translate(${x}, ${chartHeight - padding.bottom + 20})`}>
              <text 
                textAnchor="middle" 
                fontSize="12" 
                fill="#64748b"
              >
                {format(dateObj, 'MMM d')}
              </text>
            </g>
          );
        })}
        
        {/* Area under the line */}
        <path 
          d={areaPath} 
          fill="url(#areaGradient)" 
          opacity="0.2" 
        />
        
        {/* Line chart */}
        <path 
          d={linePath} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="2" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
        
        {/* Data points */}
        {data.length > 1 && data.map((d, i) => {
          // Calculate position
          const x = padding.left + i * xStep;
          const y = chartHeight - padding.bottom - d.count * yScale;
          
          return (
            <g key={`point-${i}`} className="group">
              <circle 
                cx={x}
                cy={y}
                r={getPointSize(d.count)} 
                fill={getCommitColor(d.count)} 
                stroke="white" 
                strokeWidth="2"
                className="cursor-pointer hover:opacity-90 transition-all duration-200"
              />
              
              {/* Tooltip */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <rect 
                  x={x - 50} 
                  y={y - 45} 
                  width="100" 
                  height="35" 
                  rx="4" 
                  fill="#334155" 
                  opacity="0.9"
                />
                <text 
                  x={x} 
                  y={y - 25} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fontWeight="bold" 
                  fill="white"
                >
                  {format(new Date(d.date), 'MMM d, yyyy')}
                </text>
                <text 
                  x={x} 
                  y={y - 10} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill="white"
                >
                  {d.count} commit{d.count !== 1 ? 's' : ''}
                </text>
              </g>
            </g>
          );
        })}
        
        {/* Gradient for area */}
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Author Contributions Chart Component
function AuthorContributionsChart({ data }: { data: AuthorContributionData[] }) {
  const chartHeight = 300;
  const chartWidth = 1000;
  const barHeight = 30;
  const padding = { top: 20, right: 150, bottom: 20, left: 150 };
  
  // Find the maximum commit count to set the x-axis scale
  const maxCommits = Math.max(...data.map(d => d.commits), 5);
  const xScale = (chartWidth - padding.left - padding.right) / maxCommits;
  
  return (
    <div className="relative h-full w-full overflow-y-auto">
      <svg width={chartWidth} height={Math.max(chartHeight, data.length * (barHeight + 10) + padding.top + padding.bottom)} className="font-sans">
        {/* X-axis */}
        <line 
          x1={padding.left} 
          y1={padding.top} 
          x2={padding.left} 
          y2={data.length * (barHeight + 10) + padding.top} 
          stroke="#e2e8f0" 
          strokeWidth="1"
        />
        
        {/* X-axis labels */}
        {Array.from({ length: 6 }).map((_, i) => {
          const value = Math.round(maxCommits * i / 5);
          const x = padding.left + value * xScale;
          return (
            <g key={`x-label-${i}`}>
              <line 
                x1={x} 
                y1={padding.top} 
                x2={x} 
                y2={data.length * (barHeight + 10) + padding.top} 
                stroke="#e2e8f0" 
                strokeWidth="0.5" 
                strokeDasharray="4"
              />
              <text 
                x={x} 
                y={padding.top - 10} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#64748b"
              >
                {value}
              </text>
            </g>
          );
        })}
        
        {/* Bars and labels */}
        {data.map((d, i) => {
          const barWidth = d.commits * xScale;
          const y = padding.top + i * (barHeight + 10);
          
          return (
            <g key={`bar-${i}`} className="group">
              {/* Author name */}
              <text 
                x={padding.left - 10} 
                y={y + barHeight / 2 + 5} 
                textAnchor="end" 
                fontSize="14" 
                fill="#334155"
                className="font-medium"
              >
                {d.author.length > 20 ? d.author.substring(0, 18) + '...' : d.author}
              </text>
              
              {/* Bar */}
              <rect 
                x={padding.left} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                fill={d.color} 
                rx="4"
                className="opacity-80 hover:opacity-100 transition-opacity duration-200"
              />
              
              {/* Commit count */}
              <text 
                x={padding.left + barWidth + 10} 
                y={y + barHeight / 2 + 5} 
                fontSize="14" 
                fill="#334155"
                className="font-medium"
              >
                {d.commits} commit{d.commits !== 1 ? 's' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Loading skeleton for statistics
function StatisticsLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Statistics</CardTitle>
        <CardDescription>Loading statistics...</CardDescription>
        <Skeleton className="h-10 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Skeleton className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
