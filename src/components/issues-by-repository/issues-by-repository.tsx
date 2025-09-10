import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const repositories = [
  {
    name: "twoleet-platform",
    issueCount: 7,
    hasIcon: true,
  },
  {
    name: "twoleet-agent",
    issueCount: 2,
    hasIcon: true,
  },
  {
    name: "twoleet-portal",
    issueCount: 2,
    hasIcon: true,
  },
  {
    name: "twoleet-mdm",
    issueCount: 2,
    hasIcon: true,
  },
  {
    name: "Other",
    issueCount: 6,
    hasIcon: false,
  },
]

export function IssuesByRepository() {
  return (
    <Card className="h-full bg-gray-100 border border-gray-200 rounded-2xl">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">Issues by Repository</CardTitle>
          <span className="text-sm text-gray-500">Last 60 days</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-0 -mt-1">
        <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[180px] mx-0">
          <div className="space-y-2">
            {repositories.map((repository, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {repository.hasIcon && (
                    <div className="w-6 h-6 bg-red-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TL</span>
                    </div>
                  )}
                  <span className="text-base font-medium text-gray-900">/ {repository.name}</span>
                </div>
                <span className="text-base font-semibold text-gray-900">{repository.issueCount}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
