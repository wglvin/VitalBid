// app/create-listing/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService } from "@/lib/api-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

type Organ = {
  id: string
  type: string
  description: string
}

export default function CreateListingPage() {
  const router = useRouter()
  const [organs, setOrgans] = useState<Organ[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_bid: 1000,
    time_end: "",
    organ_id: ""
  })

  useEffect(() => {
    // Fetch all available organs
    const fetchOrgans = async () => {
      try {
        const data = await apiService.getAllOrgans()
        setOrgans(data)
      } catch (error) {
        console.error("Failed to fetch organs:", error)
        setError("Failed to load available organs. Please try again.")
      }
    }

    fetchOrgans()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate form
      if (!formData.name || !formData.organ_id || !formData.time_end || formData.start_bid <= 0) {
        setError("Please fill in all required fields with valid values.")
        setLoading(false)
        return
      }

      // Submit the form
      await apiService.addListing(formData)
      setSuccess(true)
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        start_bid: 1000,
        time_end: "",
        organ_id: ""
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      console.error("Error creating listing:", error)
      setError("Failed to create listing. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Calculate minimum datetime for the expiry date (now + 1 hour)
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Create New Listing</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>New Organ Listing</CardTitle>
          <CardDescription>Create a new listing for an organ donation</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 bg-green-50">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>Listing created successfully. Redirecting...</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Listing Title</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Enter listing title" 
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe the organ condition, source, etc." 
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organ_id">Organ Type</Label>
              <Select 
                name="organ_id" 
                value={formData.organ_id} 
                onValueChange={(value) => handleSelectChange("organ_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an organ type" />
                </SelectTrigger>
                <SelectContent>
                  {organs.map((organ) => (
                    <SelectItem key={organ.id} value={organ.id}>
                      {organ.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start_bid">Starting Price ($)</Label>
              <Input 
                id="start_bid" 
                name="start_bid" 
                type="number"
                min="1"
                step="100"
                placeholder="1000" 
                value={formData.start_bid}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time_end">Listing Expiry Date/Time</Label>
              <Input 
                id="time_end" 
                name="time_end" 
                type="datetime-local" 
                min={minDate}
                value={formData.time_end}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : "Create Listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}