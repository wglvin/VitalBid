"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { ListingDetails } from "@/components/listing-details"
import { apiService } from "@/lib/api-service"

export type Listing = {
  listing_id: number
  name: string
  time_end: string
  start_bid: number
  bid_inc: number
  status: string
  current_bid?: number
  bids_count?: number
}

export function Listings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "detail">("list")

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await apiService.getAllListings()
        setListings(data)
      } catch (error) {
        console.error("Failed to fetch listings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  const handleViewDetails = (listingId: number) => {
    setSelectedListing(listingId)
    setViewMode("detail")
  }

  const handleBackToList = () => {
    setViewMode("list")
    setSelectedListing(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading listings...</span>
      </div>
    )
  }

  if (viewMode === "detail" && selectedListing !== null) {
    return <ListingDetails listingId={selectedListing} onBack={handleBackToList} />
  }

  return (
    <div className="w-full max-w-4xl">
      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Listings</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="ended">Ended</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {listings.length === 0 ? (
            <p className="text-center py-8">No listings available</p>
          ) : (
            listings.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} onViewDetails={handleViewDetails} />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {listings.filter((l) => l.status === "ACTIVE").length === 0 ? (
            <p className="text-center py-8">No active listings available</p>
          ) : (
            listings
              .filter((l) => l.status === "ACTIVE")
              .map((listing) => (
                <ListingCard key={listing.listing_id} listing={listing} onViewDetails={handleViewDetails} />
              ))
          )}
        </TabsContent>

        <TabsContent value="ended" className="space-y-4">
          {listings.filter((l) => l.status === "ENDED").length === 0 ? (
            <p className="text-center py-8">No ended listings available</p>
          ) : (
            listings
              .filter((l) => l.status === "ENDED")
              .map((listing) => (
                <ListingCard key={listing.listing_id} listing={listing} onViewDetails={handleViewDetails} />
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ListingCard({ listing, onViewDetails }: { listing: Listing; onViewDetails: (id: number) => void }) {
  const isActive = listing.status === "ACTIVE"
  const timeRemaining = isActive ? getTimeRemaining(listing.time_end) : null

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{listing.name}</CardTitle>
            <CardDescription>ID: {listing.listing_id}</CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Ended"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Starting Bid</p>
            <p className="font-medium">${listing.start_bid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Bid</p>
            <p className="font-medium">${(listing.current_bid || listing.start_bid).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bid Increment</p>
            <p className="font-medium">${listing.bid_inc.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bids</p>
            <p className="font-medium">{listing.bids_count || 0}</p>
          </div>
        </div>
        {timeRemaining && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Time Remaining</p>
            <p className="font-medium">{timeRemaining}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onViewDetails(listing.listing_id)} className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}

function getTimeRemaining(endTimeStr: string): string {
  const endTime = new Date(endTimeStr).getTime()
  const now = new Date().getTime()

  if (now > endTime) return "Ended"

  const diff = endTime - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

