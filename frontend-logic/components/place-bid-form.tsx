"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

export function PlaceBidForm({
  listingId,
  currentBid,
  minIncrement,
}: {
  listingId: number
  currentBid: number
  minIncrement: number
}) {
  const [bidAmount, setBidAmount] = useState<number>(currentBid + minIncrement)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value)) {
      setBidAmount(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (bidAmount <= currentBid) {
      toast({
        title: "Bid too low",
        description: `Your bid must be higher than the current bid of $${currentBid.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    if (bidAmount < currentBid + minIncrement) {
      toast({
        title: "Bid increment too small",
        description: `Your bid must be at least $${minIncrement.toLocaleString()} more than the current bid`,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await apiService.placeBid(listingId, bidAmount)

      toast({
        title: "Bid placed successfully!",
        description: `Your bid of $${bidAmount.toLocaleString()} has been placed.`,
      })

      // Refresh the page to show the new bid
      window.location.reload()
    } catch (error) {
      console.error("Error placing bid:", error)
      toast({
        title: "Failed to place bid",
        description: "There was an error placing your bid. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place a Bid</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-bid">Current Bid</Label>
              <Input id="current-bid" value={`$${currentBid.toLocaleString()}`} disabled />
            </div>
            <div>
              <Label htmlFor="min-bid">Minimum Bid</Label>
              <Input id="min-bid" value={`$${(currentBid + minIncrement).toLocaleString()}`} disabled />
              <p className="text-xs text-muted-foreground mt-1">Minimum increment: ${minIncrement.toLocaleString()}</p>
            </div>
            <div>
              <Label htmlFor="bid-amount">Your Bid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="bid-amount"
                  type="number"
                  min={currentBid + minIncrement}
                  step="0.01"
                  value={bidAmount}
                  onChange={handleBidChange}
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Bid...
              </>
            ) : (
              "Place Bid"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

