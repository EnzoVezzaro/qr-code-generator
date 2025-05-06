"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Ban, Shield, ShieldAlert } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

// Sample blocked IPs
const blockedIPs = [
  { ip: "192.168.1.100", reason: "Excessive scanning", timestamp: "2024-05-01T10:23:45Z" },
  { ip: "192.168.1.101", reason: "Suspicious activity", timestamp: "2024-05-02T14:30:12Z" },
  { ip: "192.168.1.102", reason: "Manual block", timestamp: "2024-05-03T09:15:30Z" },
]

// Sample security logs
const securityLogs = [
  {
    id: 1,
    event: "Suspicious activity detected",
    details: "Multiple rapid scans from IP 192.168.1.100",
    timestamp: "2024-05-01T10:20:30Z",
    severity: "high",
  },
  {
    id: 2,
    event: "IP blocked",
    details: "IP 192.168.1.100 blocked due to excessive scanning",
    timestamp: "2024-05-01T10:23:45Z",
    severity: "medium",
  },
  {
    id: 3,
    event: "QR code deactivated",
    details: "QR code 'product-123' deactivated by admin",
    timestamp: "2024-05-02T15:45:12Z",
    severity: "low",
  },
  {
    id: 4,
    event: "Suspicious activity detected",
    details: "Multiple scans from different IPs for QR code 'event-456'",
    timestamp: "2024-05-03T08:30:00Z",
    severity: "medium",
  },
  {
    id: 5,
    event: "IP blocked",
    details: "IP 192.168.1.102 manually blocked by admin",
    timestamp: "2024-05-03T09:15:30Z",
    severity: "low",
  },
]

export default function SecurityPage() {
  const [newBlockedIP, setNewBlockedIP] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [securitySettings, setSecuritySettings] = useState({
    enableAutoBlock: true,
    notifyOnSuspicious: true,
    scanThreshold: "50",
    timeWindow: "10",
    enableGeoRestriction: false,
    allowedCountries: "",
  })

  const handleAddBlockedIP = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we would add the IP to Supabase here
    console.log("Blocking IP:", newBlockedIP, "Reason:", blockReason)
    setNewBlockedIP("")
    setBlockReason("")
  }

  const handleRemoveBlockedIP = (ip: string) => {
    // In a real app, we would remove the IP from Supabase here
    console.log("Unblocking IP:", ip)
  }

  const handleSettingChange = (key: string, value: any) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Security</h1>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
            <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
            <TabsTrigger value="logs">Security Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security settings for your QR codes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-block">Automatic IP Blocking</Label>
                      <p className="text-sm text-gray-500">Automatically block IPs that exceed scan thresholds</p>
                    </div>
                    <Switch
                      id="auto-block"
                      checked={securitySettings.enableAutoBlock}
                      onCheckedChange={(checked) => handleSettingChange("enableAutoBlock", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-suspicious">Suspicious Activity Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive email notifications for suspicious scanning activity
                      </p>
                    </div>
                    <Switch
                      id="notify-suspicious"
                      checked={securitySettings.notifyOnSuspicious}
                      onCheckedChange={(checked) => handleSettingChange("notifyOnSuspicious", checked)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="scan-threshold">Scan Threshold</Label>
                    <p className="text-sm text-gray-500">
                      Maximum number of scans allowed from a single IP within the time window
                    </p>
                    <Input
                      id="scan-threshold"
                      type="number"
                      value={securitySettings.scanThreshold}
                      onChange={(e) => handleSettingChange("scanThreshold", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="time-window">Time Window (minutes)</Label>
                    <p className="text-sm text-gray-500">Time window for scan threshold calculation</p>
                    <Input
                      id="time-window"
                      type="number"
                      value={securitySettings.timeWindow}
                      onChange={(e) => handleSettingChange("timeWindow", e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="geo-restriction">Geographic Restrictions</Label>
                      <p className="text-sm text-gray-500">Restrict QR code access to specific countries</p>
                    </div>
                    <Switch
                      id="geo-restriction"
                      checked={securitySettings.enableGeoRestriction}
                      onCheckedChange={(checked) => handleSettingChange("enableGeoRestriction", checked)}
                    />
                  </div>

                  {securitySettings.enableGeoRestriction && (
                    <div className="grid gap-2">
                      <Label htmlFor="allowed-countries">Allowed Countries (comma-separated)</Label>
                      <p className="text-sm text-gray-500">
                        List of country codes allowed to access your QR codes (e.g., US,CA,UK)
                      </p>
                      <Input
                        id="allowed-countries"
                        value={securitySettings.allowedCountries}
                        onChange={(e) => handleSettingChange("allowedCountries", e.target.value)}
                        placeholder="US,CA,UK"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="blocked">
            <Card>
              <CardHeader>
                <CardTitle>Blocked IPs</CardTitle>
                <CardDescription>Manage blocked IP addresses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddBlockedIP} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ip-address">IP Address</Label>
                    <Input
                      id="ip-address"
                      placeholder="192.168.1.1"
                      value={newBlockedIP}
                      onChange={(e) => setNewBlockedIP(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="block-reason">Reason for Blocking</Label>
                    <Textarea
                      id="block-reason"
                      placeholder="Reason for blocking this IP"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={!newBlockedIP}>
                    Block IP
                  </Button>
                </form>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Currently Blocked IPs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">IP Address</th>
                          <th className="text-left p-2">Reason</th>
                          <th className="text-left p-2">Blocked On</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockedIPs.map((item) => (
                          <tr key={item.ip} className="border-b">
                            <td className="p-2">{item.ip}</td>
                            <td className="p-2">{item.reason}</td>
                            <td className="p-2">{new Date(item.timestamp).toLocaleString()}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveBlockedIP(item.ip)}>
                                <Ban className="mr-2 h-4 w-4" />
                                Unblock
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {blockedIPs.length === 0 && <div className="py-4 text-center text-gray-500">No blocked IPs</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Security Logs</CardTitle>
                <CardDescription>View security-related events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Event</th>
                        <th className="text-left p-2">Details</th>
                        <th className="text-left p-2">Timestamp</th>
                        <th className="text-left p-2">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityLogs.map((log) => (
                        <tr key={log.id} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {log.severity === "high" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              {log.severity === "medium" && <ShieldAlert className="h-4 w-4 text-amber-500" />}
                              {log.severity === "low" && <Shield className="h-4 w-4 text-green-500" />}
                              {log.event}
                            </div>
                          </td>
                          <td className="p-2">{log.details}</td>
                          <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                              ${
                                log.severity === "high"
                                  ? "bg-red-100 text-red-800"
                                  : log.severity === "medium"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {log.severity}
                            </span>
                          </td>
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
