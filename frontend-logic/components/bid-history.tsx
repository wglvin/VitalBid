"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type Bid = {
  bid_id: number
  listing_id: number
  time_placed: string
  bid_amt: number
}

export function BidHistory({ bids }: { bids: Bid[] }) {
  const sortedBids = [...bids].sort((a, b) => new Date(b.time_placed).getTime() - new Date(a.time_placed).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bid History</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedBids.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No bids placed yet</p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {sortedBids.map((bid) => (
                <div key={bid.bid_id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">${bid.bid_amt.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Bid #{bid.bid_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{new Date(bid.time_placed).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

