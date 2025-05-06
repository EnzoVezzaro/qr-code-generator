"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUp, Link } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { createBatch, processUrls } from "@/lib/qr-service"

export default function GeneratePage() {
  const { user } = useAuth()
  const [singleUrl, setSingleUrl] = useState("")
  const [bulkUrls, setBulkUrls] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSingleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!user) {
        throw new Error("You must be logged in to generate QR codes")
      }

      if (!singleUrl) {
        throw new Error("Please enter a URL")
      }

      // Validate URL
      try {
        new URL(singleUrl)
      } catch {
        throw new Error("Please enter a valid URL")
      }

      // Create a batch for this QR code
      const batch = await createBatch(
        user.id,
        `Single QR - ${new Date().toISOString()}`,
        `Batch for single QR code: ${singleUrl}`,
      )

      // Process the URL
      const results = await processUrls(user.id, [singleUrl], batch.id)

      if (results[0].success) {
        setSuccess("QR code generated successfully!")
        setSingleUrl("")
      } else {
        throw new Error(results[0].error || "Failed to generate QR code")
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!user) {
        throw new Error("You must be logged in to generate QR codes")
      }

      if (!bulkUrls) {
        throw new Error("Please enter URLs")
      }

      // Split by newline and filter empty lines
      const urls = bulkUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)

      if (urls.length === 0) {
        throw new Error("No valid URLs found")
      }

      // Validate URLs
      for (const url of urls) {
        try {
          new URL(url)
        } catch {
          throw new Error(`Invalid URL: ${url}`)
        }
      }

      // Create a batch for these QR codes
      const batch = await createBatch(
        user.id,
        `Bulk QR - ${new Date().toISOString()}`,
        `Batch containing ${urls.length} QR codes`,
      )

      // Process the URLs
      const results = await processUrls(user.id, urls, batch.id)

      const successCount = results.filter((r) => r.success).length

      if (successCount > 0) {
        setSuccess(`${successCount} QR codes generated successfully!`)
        setBulkUrls("")
      } else {
        throw new Error("Failed to generate any QR codes")
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate QR codes")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!user) {
        throw new Error("You must be logged in to generate QR codes")
      }

      if (!file) {
        throw new Error("Please select a file")
      }

      // Read file content
      const fileContent = await file.text()

      // Split by newline and filter empty lines
      const urls = fileContent
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)

      if (urls.length === 0) {
        throw new Error("No valid URLs found in file")
      }

      // Validate URLs
      for (const url of urls) {
        try {
          new URL(url)
        } catch {
          throw new Error(`Invalid URL in file: ${url}`)
        }
      }

      // Create a batch for these QR codes
      const batch = await createBatch(
        user.id,
        `File Upload - ${file.name}`,
        `Batch from file upload containing ${urls.length} QR codes`,
      )

      // Process the URLs
      const results = await processUrls(user.id, urls, batch.id)

      const successCount = results.filter((r) => r.success).length

      if (successCount > 0) {
        setSuccess(`${successCount} QR codes generated successfully!`)
        setFile(null)
      } else {
        throw new Error("Failed to generate any QR codes")
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate QR codes from file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Generate QR Codes</h1>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Single URL</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Text</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Generate Single QR Code</CardTitle>
                <CardDescription>Enter a URL to generate a QR code</CardDescription>
              </CardHeader>
              <form onSubmit={handleSingleGenerate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="single-url">URL</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="single-url"
                          placeholder="https://example.com"
                          className="pl-9"
                          value={singleUrl}
                          onChange={(e) => setSingleUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading || !singleUrl}>
                    {loading ? "Generating..." : "Generate QR Code"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>Generate Multiple QR Codes</CardTitle>
                <CardDescription>Enter multiple URLs, one per line</CardDescription>
              </CardHeader>
              <form onSubmit={handleBulkGenerate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-urls">URLs (one per line)</Label>
                    <Textarea
                      id="bulk-urls"
                      placeholder="https://example.com
https://example.org
https://example.net"
                      rows={10}
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading || !bulkUrls}>
                    {loading ? "Generating..." : "Generate QR Codes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="file">
            <Card>
              <CardHeader>
                <CardTitle>Upload File with URLs</CardTitle>
                <CardDescription>Upload a CSV or TXT file with URLs (one per line)</CardDescription>
              </CardHeader>
              <form onSubmit={handleFileUpload}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">File (CSV or TXT)</Label>
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="file-upload"
                        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 px-4 py-5 text-center"
                      >
                        <FileUp className="h-8 w-8 text-gray-400" />
                        <div className="mt-2 text-sm text-gray-500">
                          {file ? file.name : "Drag and drop or click to upload"}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">CSV or TXT file with one URL per line</div>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setFile(e.target.files[0])
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading || !file}>
                    {loading ? "Generating..." : "Generate QR Codes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
