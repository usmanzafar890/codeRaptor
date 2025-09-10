import { Github, FileText, MessageSquare, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="hover:scale-105 transition-transform duration-200">
        <Card className="bg-gradient-to-br from-gray-700 via-gray-800 to-blue-600 text-white shadow-lg border-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Github className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">24</div>
            <p className="text-xs text-blue-100 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              +3 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="hover:scale-105 transition-transform duration-200">
        <Card className="bg-gradient-to-br from-gray-700 via-gray-800 to-blue-600 text-white shadow-lg border-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Analyzed</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">3,247</div>
            <p className="text-xs text-blue-100 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              +156 this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="hover:scale-105 transition-transform duration-200">
        <Card className="bg-gradient-to-br from-gray-700 via-gray-800 to-blue-600 text-white shadow-lg border-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageSquare className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">1,892</div>
            <p className="text-xs text-blue-100 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              +89 today
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="hover:scale-105 transition-transform duration-200">
        <Card className="bg-gradient-to-br from-gray-700 via-gray-800 to-blue-600 text-white shadow-lg border-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">12</div>
            <p className="text-xs text-blue-100 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              +2 this month
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 