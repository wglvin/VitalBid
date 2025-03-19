"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, DollarSign, Loader2, Users } from "lucide-react"
import { BidHistory } from "@/components/bid-history"
import { PlaceBidForm } from "@/components/place-bid-form"
import { ProofSection } from "@/components/proof-section"
import { apiService } from "@/lib/api-service"
import type { Listing } from "@/components/listings"

type ListingWithBids = {
  id: number
  title: string
  description: string
  startingPrice: number
  expiryDate: string
  donorId: number
  organId: number
  status: string
  organ?: {
    id: number
    type: string
    description: string
  }
  bids: Array<{
    id: number           // Changed from bid_id
    listingId: number    // Changed from listing_id
    bidderId: number     // Added to match backend
    amount: number       // Changed from bid_amt
    bidTime: string      // Changed from time_placed
    status: string       // Added to match backend
  }>
  proof?: {
    proof_id: number
    proof_url: string
    verified: boolean
  }
  image_proof?: {
    proof_id: number
    image_url: string
    verified: boolean
  }
}

export function ListingDetails({
  listingId,
  onBack,
}: {
  listingId: number
  onBack: () => void
}) {
  const [listing, setListing] = useState<ListingWithBids | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setLoading(true)
        const listingData = await apiService.getListingById(listingId)
        const bidsData = await apiService.getBidsByListing(listingId)
        const proofData = await apiService.getListingProof(listingId).catch(() => null)
        const imageProofData = await apiService.getImageProof(listingId).catch(() => null)

        setListing({
          ...listingData,
          bids: bidsData.map(bid => ({
            ...bid,
            amount: bid.amount,
            bidTime: bid.bidTime
          })),
          proof: proofData,
          image_proof: imageProofData,
        })
      } catch (err) {
        console.error("Error fetching listing details:", err)
        setError("Failed to load listing details")
      } finally {
        setLoading(false)
      }
    }

    fetchListingDetails()
  }, [listingId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading listing details...</span>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || "Listing not found"}</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
        </Button>
      </div>
    )
  }

  const isActive = listing.status === "ACTIVE"
  const highestBid = listing.bids.length > 0 ? Math.max(...listing.bids.map((b) => b.amount)) : listing.startingPrice

  return (
    <div className="w-full max-w-4xl">
      <Button onClick={onBack} variant="outline" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{listing.title}</CardTitle>
                  <CardDescription>ID: {listing.id}</CardDescription>
                </div>
                <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Ended"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Starting Bid</p>
                    <p className="font-medium">${listing.startingPrice.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Bid</p>
                    <p className="font-medium">${highestBid.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Time</p>
                    <p className="font-medium">{new Date(listing.expiryDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bids</p>
                    <p className="font-medium">{listing.bids.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="bids" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bids">Bid History</TabsTrigger>
              <TabsTrigger value="proof">Verification</TabsTrigger>
            </TabsList>
            <TabsContent value="bids" className="mt-4">
              <BidHistory bids={listing.bids} />
            </TabsContent>
            <TabsContent value="proof" className="mt-4">
              <ProofSection listingId={listing.id} proof={listing.proof} imageProof={listing.image_proof} />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          {isActive && (
            <PlaceBidForm listingId={listing.id} currentBid={highestBid} minIncrement={listing.bids[0].amount - listing.startingPrice} />
          )}
        </div>
      </div>
    </div>
  )
}

