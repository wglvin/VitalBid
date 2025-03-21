// API service to interact with the backend through Kong API Gateway
// to change to env var later
const API_BASE_URL = "http://localhost:8000";

const apiService = {
  // List Service
  async getAllListings() {
    const response = await fetch(`${API_BASE_URL}/listing/api/listings`);
    if (!response.ok) {
      throw new Error("Failed to fetch listings");
    }
    const listings = await response.json();
    return listings.map(listing => ({
      ...listing,
      // Add default values for removed fields
      donorId: listing.donorId || null,
      winningBidId: listing.winningBidId || null,
      finalPrice: listing.finalPrice || null
    }));
  },

  async getListingById(listingId) {
    const response = await fetch(`${API_BASE_URL}/listing/api/listings/${listingId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch listing");
    }
    const listing = await response.json();
    return {
      ...listing,
      // Add default values for removed fields
      donorId: listing.donorId || null,
      winningBidId: listing.winningBidId || null,
      finalPrice: listing.finalPrice || null
    };
  },

  async addListing(listingData) {
    // Transform the data to match what the backend expects
    const transformedData = {
      title: listingData.name,
      description: listingData.description,
      organId: parseInt(listingData.organ_id),
      startingPrice: parseFloat(listingData.start_bid),
      expiryDate: listingData.time_end,
      status: listingData.status || 'active'
    };
    
    console.log("Data sent to API:", JSON.stringify(transformedData));
    
    const response = await fetch(`${API_BASE_URL}/listing/api/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transformedData),
    });

    if (!response.ok) {
      // Get the error message from the response
      const errorData = await response.text();
      console.error("API Error:", errorData);
      throw new Error("Failed to add listing");
    }
    
    return await response.json();
  },

  // Organ Service
  async getAllOrgans() {
    console.log("Fetching organs from:", `${API_BASE_URL}/listing/api/organs`);
    const response = await fetch(`${API_BASE_URL}/listing/api/organs`);
    if (!response.ok) {
      console.error("Error fetching organs:", response.status, await response.text());
      throw new Error("Failed to fetch organs");
    }
    // Process response to ensure consistent format even if createdAt/updatedAt are missing
    const organs = await response.json();
    return organs.map(organ => ({
      ...organ,
      // Add empty defaults for any code that might expect these fields
      createdAt: organ.createdAt || null,
      updatedAt: organ.updatedAt || null
    }));
  },

  async getOrganById(organId) {
    const response = await fetch(`${API_BASE_URL}/listing/api/organs/${organId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch organ");
    }
    const organ = await response.json();
    // Add empty defaults for any code that might expect these fields
    return {
      ...organ,
      createdAt: organ.createdAt || null,
      updatedAt: organ.updatedAt || null
    };
  },

  async addOrgan(organData) {
    // Remove createdAt and updatedAt if they exist in the input
    const { createdAt, updatedAt, ...cleanedData } = organData;
    
    const response = await fetch(`${API_BASE_URL}/listing/api/organs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanedData),
    });
    if (!response.ok) {
      throw new Error("Failed to add organ");
    }
    return await response.json();
  },

  // Bid Service
  async getListingBids(listingId) {
    const response = await fetch(`${API_BASE_URL}/bidding/api/bids/history/${listingId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch bids");
    }
    return await response.json();
  },

  async placeBid(listingId, bidderId, bidAmount) {
    const response = await fetch(`${API_BASE_URL}/bidding/api/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId: parseInt(listingId),
        bidderId: parseInt(bidderId),
        amount: parseFloat(bidAmount)
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to place bid");
    }
    return await response.json();
  },

  async getListingsWithBids() {
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/listings-with-bids`);
    if (!response.ok) {
      throw new Error("Failed to fetch listings with bids");
    }
    return await response.json();
  },

  // // Proofing Service
  // async getListingProof(listingId) {
  //   const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/proof/get_proof/listing/${listingId}`);
  //   if (!response.ok) {
  //     throw new Error("Failed to fetch proof");
  //   }
  //   return await response.json();
  // }
}; 