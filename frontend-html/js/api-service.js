// API service to interact with the backend through Kong API Gateway
// to change to env var later
const API_BASE_URL = "http://localhost:8000";

const apiService = {
  // Helper function to get user data from localStorage
  getUserData() {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || '{"userid": 1, "email": "guest@example.com", "username": "Guest"}');
      console.log("Retrieved user data from localStorage:", userData);
      return userData;
    } catch (error) {
      console.warn("Error parsing userData from localStorage:", error);
      return { userid: 1, email: "guest@example.com", username: "Guest" };
    }
  },

  // Helper function to add user metadata to any request options
  addUserMetadata(options = {}) {
    const userData = this.getUserData();
    
    // Initialize headers if needed
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add user metadata headers - use properties as shown in testingRedirect.html example
    options.headers['X-User-Email'] = userData.email || "guest@example.com";
    options.headers['X-User-Name'] = userData.username || "Guest";
    options.headers['X-User-ID'] = userData.userid || userData.id || 1;
    
    console.log("Added user metadata to request headers:", {
      email: options.headers['X-User-Email'],
      username: options.headers['X-User-Name'],
      userId: options.headers['X-User-ID']
    });
    
    return options;
  },

  // List Service
  async getAllListings() {
    const options = this.addUserMetadata();
    const response = await fetch(`${API_BASE_URL}/listing/api/listings`, options);
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
    const options = this.addUserMetadata();
    const response = await fetch(`${API_BASE_URL}/listing/api/listings/${listingId}`, options);
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
    try {
      // Get user data from localStorage directly when creating listing
      const userData = this.getUserData();
      console.log("Using user data for listing creation:", userData);
      
      const lastUsedEmail = localStorage.getItem("lastUsedEmail");
      console.log("Comparing emails - Last used:", lastUsedEmail, "Current:", userData.email);
      
      if (userData.email !== lastUsedEmail) {
        console.warn("⚠️ EMAIL MISMATCH - userData email changed between form load and submission");
      }
      
      // Transform the data to match what the backend expects
      const transformedData = {
        title: listingData.name,
        description: listingData.description,
        organId: parseInt(listingData.organ_id),
        startingPrice: parseFloat(listingData.start_bid),
        expiryDate: listingData.time_end,
        image: listingData.image || 'default-organ.jpg',
        ownerId: parseInt(listingData.owner_id),
        // Match field names exactly with the userData JSON structure
        email: userData.email,
        username: userData.username
      };
      
      console.log("Final email being sent to API:", transformedData.email);
      console.log("Data being sent to API with embedded user info:", JSON.stringify(transformedData));
      
      const options = this.addUserMetadata({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedData),
      });

      const response = await fetch(`${API_BASE_URL}/listing/api/listings`, options);

      if (!response.ok) {
        let errorMessage = "Failed to add listing";
        try {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error("API Error Text:", errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in addListing:", error);
      throw error;
    }
  },

  // Organ Service
  async getAllOrgans() {
    console.log("Fetching organs from:", `${API_BASE_URL}/listing/api/organs`);
    const options = this.addUserMetadata();
    const response = await fetch(`${API_BASE_URL}/listing/api/organs`, options);
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
    const options = this.addUserMetadata();
    const response = await fetch(`${API_BASE_URL}/listing/api/organs/${organId}`, options);
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
    
    const options = this.addUserMetadata({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanedData),
    });
    
    const response = await fetch(`${API_BASE_URL}/listing/api/organs`, options);
    if (!response.ok) {
      throw new Error("Failed to add organ");
    }
    return await response.json();
  },

  // Bid Service
  async getListingBids(listingId) {
    const options = this.addUserMetadata();
    const response = await fetch(`${API_BASE_URL}/bidding/api/bids/history/${listingId}`, options);
    if (!response.ok) {
      throw new Error("Failed to fetch bids");
    }
    return await response.json();
  },

  async placeBid(listingId, bidderId, bidAmount) {
    const options = this.addUserMetadata({
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
    
    const response = await fetch(`${API_BASE_URL}/bidding/api/bids`, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to place bid");
    }
    return await response.json();
  },

  async getListingsWithBids() {
    const options = this.addUserMetadata();
    const response = await fetch(`${API_BASE_URL}/get_listing_bids/api/listings-with-bids`, options);
    if (!response.ok) {
      throw new Error("Failed to fetch listings with bids");
    }
    return await response.json();
  },

  acceptBid: async function(bidId) {
    try {
      const options = this.addUserMetadata({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/bidding/api/bids/${bidId}/accept`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept bid');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in acceptBid:', error);
      throw error;
    }
  }
};