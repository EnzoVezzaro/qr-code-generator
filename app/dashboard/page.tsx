import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { QrCode, Scan, Users, Clock } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

// Sample data for charts
const scanData = [
  { name: "Mon", scans: 120 },
  { name: "Tue", scans: 220 },
  { name: "Wed", scans: 190 },
  { name: "Thu", scans: 310 },
  { name: "Fri", scans: 290 },
  { name: "Sat", scans: 150 },
  { name: "Sun", scans: 180 },
]

const recentScans = [
  { id: 1, qrCode: "product-123", timestamp: "2024-05-06T10:23:45", ip: "192.168.1.1" },
  { id: 2, qrCode: "event-456", timestamp: "2024-05-06T09:15:30", ip: "192.168.1.2" },
  { id: 3, qrCode: "promo-789", timestamp: "2024-05-06T08:45:12", ip: "192.168.1.3" },
  { id: 4, qrCode: "link-101", timestamp: "2024-05-05T22:30:00", ip: "192.168.1.4" },
  { id: 5, qrCode: "contact-202", timestamp: "2024-05-05T21:10:45", ip: "192.168.1.5" },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total QR Codes</p>
                  <h3 className="text-2xl font-bold">1,234</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Scan className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Scans</p>
                  <h3 className="text-2xl font-bold">45,678</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                  <h3 className="text-2xl font-bold">12,345</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg. Scan Time</p>
                  <h3 className="text-2xl font-bold">2.4s</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Scan Analytics</CardTitle>
                <CardDescription>QR code scans over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scanData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="scans" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>Latest QR code scans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">QR Code</th>
                        <th className="text-left p-2">Timestamp</th>
                        <th className="text-left p-2">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentScans.map((scan) => (
                        <tr key={scan.id} className="border-b">
                          <td className="p-2">{scan.qrCode}</td>
                          <td className="p-2">{new Date(scan.timestamp).toLocaleString()}</td>
                          <td className="p-2">{scan.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
