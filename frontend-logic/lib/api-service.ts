// lib/api-service.ts
// API service to interact with the backend through Kong API Gateway

const API_BASE_URL = "http://localhost:8000"


export const apiService = {
  // List Service
  async getAllListings() {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/listings/all_listing`)
    if (!response.ok) {
      throw new Error("Failed to fetch listings")
    }
    return await response.json()
  },

  async getListingById(listingId: number) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/listings/get_listing/${listingId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch listing")
    }
    return await response.json()
  },

  async addListing(listingData: any) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/listings/add_listing`, {
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
    console.log("Fetching organs from:", `${API_BASE_URL}/get_listing_bids/api/organs/all`); // Add this log
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/organs/all`)
    if (!response.ok) {
      console.error("Error fetching organs:", response.status, await response.text()); // Add this log
      throw new Error("Failed to fetch organs")
    }
    return await response.json()
  },

  async getOrganById(organId: string) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/organs/${organId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch organ")
    }
    return await response.json()
  },

  async addOrgan(organData: any) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/organs/add`, {
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

  async placeBid(listingId: number, bidAmount: number) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/bidding/add_bid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listing_id: listingId,
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

  async getImageProof(listingId: number) {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/proof/get_proof/image/${listingId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch image proof")
    }
    return await response.json()
  },

  async uploadProof(listingId: number, file: File) {
    const formData = new FormData()
    formData.append("listing_id", listingId.toString())
    formData.append("proof_file", file)

    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/proof/upload_proof`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error("Failed to upload proof")
    }
    return await response.json()
  },

  async uploadImageProof(listingId: number, file: File) {
    const formData = new FormData()
    formData.append("listing_id", listingId.toString())
    formData.append("image_file", file)

    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/proof/upload_image_proof`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error("Failed to upload image proof")
    }
    return await response.json()
  },
}