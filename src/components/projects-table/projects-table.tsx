"use client"

import { useState } from "react"
import {
  Github,
  FileText,
  GitBranch,
  Calendar,
  Zap,
  BarChart3,
  Settings,
  Download,
  Eye,
  Search,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data for the dashboard
const projectsData = [
  {
    id: 1,
    name: "E-commerce Backend",
    repository: "user/ecommerce-api",
    files: 156,
    commits: 89,
    lastAnalyzed: "2024-01-15",
    status: "analyzed",
    aiSummary: "REST API with authentication",
    credits: 156,
    collaborators: 4,
    language: "Node.js",
    stars: 23,
  },
  {
    id: 2,
    name: "React Dashboard",
    repository: "user/react-dashboard",
    files: 89,
    commits: 45,
    lastAnalyzed: "2024-01-14",
    status: "processing",
    aiSummary: "Admin dashboard with charts",
    credits: 89,
    collaborators: 2,
    language: "React",
    stars: 15,
  },
  {
    id: 3,
    name: "ML Pipeline",
    repository: "user/ml-pipeline",
    files: 234,
    commits: 67,
    lastAnalyzed: "2024-01-13",
    status: "analyzed",
    aiSummary: "Machine learning data pipeline",
    credits: 234,
    collaborators: 6,
    language: "Python",
    stars: 41,
  },
  {
    id: 4,
    name: "Mobile App",
    repository: "user/mobile-app",
    files: 78,
    commits: 123,
    lastAnalyzed: "2024-01-12",
    status: "pending",
    aiSummary: "Cross-platform mobile application",
    credits: 78,
    collaborators: 3,
    language: "Flutter",
    stars: 8,
  },
  {
    id: 5,
    name: "DevOps Scripts",
    repository: "user/devops-automation",
    files: 45,
    commits: 34,
    lastAnalyzed: "2024-01-11",
    status: "analyzed",
    aiSummary: "Infrastructure automation scripts",
    credits: 45,
    collaborators: 2,
    language: "Bash",
    stars: 12,
  },
]

export function ProjectsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredProjects = projectsData.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.repository.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "analyzed":
        return "bg-green-50 text-green-700 border-green-200"
      case "processing":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "pending":
        return "bg-gray-50 text-gray-700 border-gray-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      "Node.js": "bg-blue-50 text-blue-700 border-blue-200",
      React: "bg-cyan-50 text-cyan-700 border-cyan-200",
      Python: "bg-orange-50 text-orange-700 border-orange-200",
      Flutter: "bg-purple-50 text-purple-700 border-purple-200",
      Bash: "bg-gray-50 text-gray-700 border-gray-200",
    }
    return colors[language] || "bg-gray-50 text-gray-700 border-gray-200"
  }

  return (
    <Card className="bg-white shadow-lg border border-gray-100 overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">GitHub Projects</CardTitle>
            <CardDescription className="text-gray-600 mt-1">Manage and analyze your repositories with AI</CardDescription>
          </div>
        </div>

        {/* Search and controls */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="analyzed">Analyzed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Project</TableHead>
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Files</TableHead>
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Commits</TableHead>
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Language</TableHead>
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Status</TableHead>
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Last Analyzed</TableHead>
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Credits</TableHead>
                <TableHead className="h-12 font-semibold text-gray-700 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100">
                  <TableCell className="py-2 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Github className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="font-medium text-gray-900">{project.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-6">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{project.files}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-6">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{project.commits}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-6">
                    <Badge className={`${getLanguageColor(project.language)} text-xs px-2 py-1 border`}>
                      {project.language}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-6">
                    <Badge className={`${getStatusColor(project.status)} text-xs px-2 py-1 border`}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{project.lastAnalyzed}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-6">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-gray-900">{project.credits}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-6">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 