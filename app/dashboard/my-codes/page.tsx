"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, EyeOff, Filter, MoreHorizontal, QrCode, Search, Trash, X } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { getUserQRCodes, getUserBatches, updateQRCodeStatus, deleteQRCode } from "@/lib/qr-service"

export default function MyCodesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [qrCodes, setQrCodes] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)
        const qrCodesData = await getUserQRCodes(user.id)
        const batchesData = await getUserBatches(user.id)

        setQrCodes(qrCodesData)
        setBatches(batchesData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Filter QR codes based on search term and status filter
  const filteredQrCodes = qrCodes.filter((qrCode) => {
    const matchesSearch =
      qrCode.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      qrCode.url.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter ? qrCode.status === statusFilter : true

    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (status: string | null) => {
    setStatusFilter(status)
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      await updateQRCodeStatus(id, newStatus)

      // Update local state
      setQrCodes(qrCodes.map((qrCode) => (qrCode.id === id ? { ...qrCode, status: newStatus } : qrCode)))
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteQRCode(id)

      // Update local state
      setQrCodes(qrCodes.filter((qrCode) => qrCode.id !== id))
    } catch (error) {
      console.error("Error deleting QR code:", error)
    }
  }

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">My QR Codes</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All QR Codes</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>QR Codes</CardTitle>
                <CardDescription>Manage your generated QR codes</CardDescription>
                <div className="flex flex-col gap-4 sm:flex-row mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search QR codes..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        {statusFilter ? `Status: ${statusFilter}` : "Filter by status"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(null)}>All</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange("active")}>Active</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange("inactive")}>Inactive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-gray-500">Loading QR codes...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">URL</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQrCodes.map((qrCode) => (
                          <tr key={qrCode.id} className="border-b">
                            <td className="p-2">{qrCode.name}</td>
                            <td className="p-2 max-w-[200px] truncate">{qrCode.url}</td>
                            <td className="p-2">{new Date(qrCode.created_at).toLocaleDateString()}</td>
                            <td className="p-2">
                              <Badge variant={qrCode.status === "active" ? "default" : "secondary"}>
                                {qrCode.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => window.open(qrCode.svg_path, "_blank")}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    View QR Code
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDownload(qrCode.png_path, `${qrCode.name}.png`)}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PNG
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDownload(qrCode.svg_path, `${qrCode.name}.svg`)}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download SVG
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(qrCode.id, qrCode.status)}>
                                    {qrCode.status === "active" ? (
                                      <>
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(qrCode.id)} className="text-red-600">
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredQrCodes.length === 0 && !loading && (
                      <div className="py-8 text-center text-gray-500">
                        {qrCodes.length === 0
                          ? "No QR codes found. Generate some QR codes to get started!"
                          : "No QR codes found matching your criteria"}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batches">
            <Card>
              <CardHeader>
                <CardTitle>Batches</CardTitle>
                <CardDescription>Manage your QR code batches</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-gray-500">Loading batches...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Batch Name</th>
                          <th className="text-left p-2">Description</th>
                          <th className="text-left p-2">QR Codes</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map((batch) => (
                          <tr key={batch.id} className="border-b">
                            <td className="p-2">{batch.name}</td>
                            <td className="p-2 max-w-[200px] truncate">{batch.description}</td>
                            <td className="p-2">{batch.qr_codes?.length || 0}</td>
                            <td className="p-2">{new Date(batch.created_at).toLocaleDateString()}</td>
                            <td className="p-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Batch
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download All
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete Batch
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {batches.length === 0 && !loading && (
                      <div className="py-8 text-center text-gray-500">
                        No batches found. Generate some QR codes to create batches!
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
