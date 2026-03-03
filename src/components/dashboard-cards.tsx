import {
  IconQrcode,
  IconScan,
  IconChartBar,
  IconTrendingUp,
} from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card"

const stats = [
  {
    title: "Total QR Codes",
    value: "0",
    description: "Generate your first QR codes",
    icon: IconQrcode,
  },
  {
    title: "Total Scans",
    value: "0",
    description: "Scans will appear here",
    icon: IconScan,
  },
  {
    title: "Active Codes",
    value: "0",
    description: "No active codes yet",
    icon: IconChartBar,
  },
  {
    title: "Scan Rate",
    value: "0%",
    description: "Average scan rate",
    icon: IconTrendingUp,
  },
]

export function DashboardCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
