// lib/api-service.ts
// API service to interact with the backend through Kong API Gateway
const API_BASE_URL = "http://localhost:8000"

interface ApiService {
  getAllListings(): Promise<any>;
  getListingById(listingId: number): Promise<any>;
  addListing(listingData: any): Promise<any>;
  getAllOrgans(): Promise<any>;
  getOrganById(organId: string): Promise<any>;
  addOrgan(organData: any): Promise<any>;
  getListingBids(listingId: number): Promise<any>;
  placeBid(listingId: number, bidderId: number, bidAmount: number): Promise<any>;
  getListingsWithBids(): Promise<any>;
  getListingProof(listingId: number): Promise<any>;
}

export const apiService: ApiService = {
  // List Service
  async getAllListings() {
    const response = await fetch(`${API_BASE_URL}/listing/api/listings`)
    if (!response.ok) {
      throw new Error("Failed to fetch listings")
    }
    return await response.json()
  },

  async getListingById(listingId: number) {
    const response = await fetch(`${API_BASE_URL}/listing/api/listings/${listingId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch listing")
    }
    return await response.json()
  },

  async addListing(listingData: any) {
    const response = await fetch(`${API_BASE_URL}/listing/api/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(listingData),
    })
    if (!response.ok) {
      throw new Error("Failed to add listing")
    }
    return await response.json()
  },

  // Organ Service
  async getAllOrgans() {
    console.log("Fetching organs from:", `${API_BASE_URL}/listing/api/organs`); // Add this log
    const response = await fetch(`${API_BASE_URL}/listing/api/organs`)
    if (!response.ok) {
      console.error("Error fetching organs:", response.status, await response.text()); // Add this log
      throw new Error("Failed to fetch organs")
    }
    return await response.json()
  },

  async getOrganById(organId: string) {
    const response = await fetch(`${API_BASE_URL}/listing/api/organs/${organId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch organ")
    }
    return await response.json()
  },

  async addOrgan(organData: any) {
    const response = await fetch(`${API_BASE_URL}/listing/api/organs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(organData),
    })
    if (!response.ok) {
      throw new Error("Failed to add organ")
    }
    return await response.json()
  },

  // Bid Service
  async getListingBids(listingId: number) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/bidding/get_history/${listingId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch bids")
    }
    return await response.json()
  },

  async placeBid(listingId: number,bidderId: number, bidAmount: number) {
    const response = await fetch(`${API_BASE_URL}/bidding/api/bidding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listing_id: listingId,
        bidderid: bidderId,
        bid_amt: bidAmount,

      }),
    })
    if (!response.ok) {
      throw new Error("Failed to place bid")
    }
    return await response.json()
  },
  async getListingsWithBids() {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/listings-with-bids`)
    if (!response.ok) {
      throw new Error("Failed to fetch listings with bids")
    }
    return await response.json()
  },

  // Proofing Service
  async getListingProof(listingId: number) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/proof/get_proof/listing/${listingId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch proof")
    }
    return await response.json()
  },
}