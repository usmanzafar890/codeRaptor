import { Activity, Zap, GitBranch, MessageSquare, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const recentActivity = [
  {
    type: "analysis",
    project: "E-commerce Backend",
    action: "AI analysis completed",
    time: "2 hours ago",
    icon: Zap,
  },
  {
    type: "commit",
    project: "React Dashboard",
    action: "New commit analyzed",
    time: "4 hours ago",
    icon: GitBranch,
  },
  {
    type: "meeting",
    project: "ML Pipeline",
    action: "Meeting transcription processed",
    time: "6 hours ago",
    icon: MessageSquare,
  },
  {
    type: "collaboration",
    project: "Mobile App",
    action: "Team member added",
    time: "1 day ago",
    icon: Users,
  },
]

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <activity.icon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.project}</p>
                <p className="text-sm text-gray-600">{activity.action}</p>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 