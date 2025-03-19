"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type Bid = {
  id: number
  listingId: number
  bidderId: number
  amount: number
  bidTime: string
  status: string
}

export function BidHistory({ bids }: { bids: Bid[] }) {
  const sortedBids = [...bids].sort((a, b) => 
    new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime()
  )

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
                <div key={bid.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">${bid.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Bid #{bid.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(bid.bidTime).toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {bid.status}
                    </Badge>
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

