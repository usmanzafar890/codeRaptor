import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function CreditsUsage() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-500" />
          Credits Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Used this month</span>
              <span>753 / 1,500</span>
            </div>
            <Progress value={50} className="h-2" />
          </div>
          <div className="text-xs text-gray-600">
            <p>• File analysis: 1 credit per file</p>
            <p>• AI queries: 2 credits per query</p>
            <p>• Meeting transcription: 5 credits per hour</p>
          </div>
          <Button className="w-full bg-transparent" variant="outline">
            Upgrade Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 