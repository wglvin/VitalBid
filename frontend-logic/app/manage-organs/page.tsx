// app/manage-organs/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiService } from "@/lib/api-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

type Organ = {
  id: string
  type: string
  description: string
}

export default function ManageOrgansPage() {
  const [organs, setOrgans] = useState<Organ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: "",
    description: ""
  })

  const fetchOrgans = async () => {
    try {
      setLoading(true)
      const data = await apiService.getAllOrgans()
      setOrgans(data)
    } catch (error) {
      console.error("Failed to fetch organs:", error)
      setError("Failed to load organs. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgans()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Validate form
      if (!formData.type) {
        setError("Organ type is required")
        return
      }

      // Submit the form
      await apiService.addOrgan(formData)
      setSuccess("Organ added successfully!")
      
      // Reset form
      setFormData({
        type: "",
        description: ""
      })

      // Refresh the organ list
      fetchOrgans()
    } catch (error) {
      console.error("Error creating organ:", error)
      setError("Failed to create organ. It may already exist.")
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Manage Organ Types</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Add New Organ Type</CardTitle>
              <CardDescription>Create a new organ type for listings</CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <Alert className="mb-6 bg-green-50">
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-6" variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Organ Type</Label>
                  <Input 
                    id="type" 
                    name="type" 
                    placeholder="Kidney, Heart, Liver, etc." 
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Brief description of this organ type" 
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <Button type="submit" className="w-full">Add Organ Type</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Available Organ Types</CardTitle>
              <CardDescription>All registered organ types in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading organs...</span>
                </div>
              ) : organs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No organ types registered yet. Add your first one!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organ Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organs.map((organ) => (
                      <TableRow key={organ.id}>
                        <TableCell className="font-medium">{organ.type}</TableCell>
                        <TableCell>{organ.description || "-"}</TableCell>
                        <TableCell className="text-xs truncate" title={organ.id}>
                          {organ.id.substring(0, 8)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}