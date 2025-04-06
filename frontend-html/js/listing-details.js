document.addEventListener('DOMContentLoaded', function() {
    // Get elements from the page
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const listingDetailContainer = document.getElementById('listing-detail-container');
    
    const backButton = document.getElementById('back-btn');
    const backToListingsButton = document.getElementById('back-to-listings');
    
    const titleElement = document.getElementById('listing-title');
    const idElement = document.getElementById('listing-id');
    const statusElement = document.getElementById('listing-status');
    const startBidElement = document.getElementById('listing-start-bid');
    const currentBidElement = document.getElementById('listing-current-bid');
    const endTimeElement = document.getElementById('listing-end-time');
    const bidsCountElement = document.getElementById('listing-bids-count');
    const descriptionElement = document.getElementById('listing-description');
    const listingImageElement = document.getElementById('listing-image');
    
    const bidHistoryContainer = document.getElementById('bid-history-container');
    const noBidsMessage = document.getElementById('no-bids-message');
    const bidsList = document.getElementById('bids-list');
    
    const placeBidForm = document.getElementById('place-bid-form');
    const formCurrentBid = document.getElementById('form-current-bid');
    const bidForm = document.getElementById('bid-form');
    const bidAmountInput = document.getElementById('bid-amount');
    const bidErrorElement = document.getElementById('bid-error');
    
    const tabBids = document.getElementById('tab-bids');
    const tabDetails = document.getElementById('tab-details');
    const tabContentBids = document.getElementById('tab-content-bids');
    const tabContentDetails = document.getElementById('tab-content-details');
    
    // Get listing ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');
    
    if (!listingId) {
        showError('No listing ID provided');
        return;
    }
    
    // Add this variable to track if current user is the listing owner
    let isListingOwner = false;
    
    // Fetch and display listing details
    async function fetchListingDetails() {
        try {
            const listings = await apiService.getListingsWithBids();
            console.log('Listings received:', listings);
            console.log('Looking for listing ID:', listingId);
            
            const numericId = parseInt(listingId);
            const listing = listings.find(l => l.id === numericId || l.listing_id === numericId);
            
            if (!listing) {
                console.log('No listing found with ID:', numericId);
                throw new Error('Listing not found');
            }
            console.log("Listing found:", listing);
            console.log("Listing bids:", listing.bids);
            
            // Always check for resolution status first before rendering
            const resolutionServiceUrl = 'http://localhost:8000/resolve';
            try {
                console.log("Checking for resolution status...");
                const res = await fetch(`${resolutionServiceUrl}/api/resolutions/listing/${listing.listing_id || listing.id}`);
                if (res.ok) {
                    const resolution = await res.json();
                    if (resolution) {
                        console.log("Resolution found:", resolution);
                        // If we found a resolution, mark the listing as resolved
                        listing.is_resolved = true;
                        listing.resolution_status = resolution.status;
                        listing.winning_bid = resolution.winning_bid;
                        listing.winner_id = resolution.winner_id;
                        
                        // Force the listing status to ended if it has been resolved
                        listing.status = 'ended';
                        
                        // Also mark the winning bid as accepted
                        if (listing.bids && listing.bids.length > 0) {
                            const winningBidIdx = listing.bids.findIndex(bid => 
                                bid.bidder_id === resolution.winner_id && 
                                parseFloat(bid.bid_amt) === parseFloat(resolution.winning_bid)
                            );
                            if (winningBidIdx >= 0) {
                                listing.bids[winningBidIdx].status = 'accepted';
                                
                                // Mark other bids as cancelled
                                listing.bids.forEach((bid, idx) => {
                                    if (idx !== winningBidIdx) {
                                        bid.status = 'cancelled';
                                    }
                                });
                            }
                        }
                    } else {
                        console.log("No resolution found for this listing");
                        listing.is_resolved = false;
                    }
                } else {
                    console.log("No resolution found (non-OK response)");
                    listing.is_resolved = false;
                }
            } catch (error) {
                console.warn('Could not check resolution status:', error);
                listing.is_resolved = false;
            }
            
            console.log("Is listing resolved?", listing.is_resolved);
            
            // Fetch organ type if not already available
            if (listing.organ_id && !listing.organ_type) {
                try {
                    const organ = await apiService.getOrganById(listing.organ_id);
                    if (organ && organ.type) {
                        listing.organ_type = organ.type;
                        console.log(`✅ Fetched organ type for listing details: ${organ.type}`);
                    }
                } catch (error) {
                    console.warn('Could not fetch organ type:', error);
                    // Continue without organ type
                }
            }
            
            // Render listing details
            await renderListingDetails(listing);
            
            // Hide loading indicator and show listing details
            loadingIndicator.classList.add('hidden');
            listingDetailContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching listing details:', error);
            showError(error.message || 'Failed to load listing details');
        }
    }
    
    // Show error message
    function showError(message) {
        loadingIndicator.classList.add('hidden');
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }
    
    // Check if a listing is expired based on time or resolution
    function isExpired(listing) {
        // If there's a resolution, the listing is considered expired/ended
        if (listing.is_resolved || listing.status === 'ended') {
            return true;
        }
        
        // Otherwise check the time
        const now = new Date();
        const expiryTime = new Date(listing.expiry_date || listing.time_end);
        return now > expiryTime;
    }
    
    // Render listing details
    async function renderListingDetails(listing) {
        // Set basic listing info
        titleElement.textContent = listing.name;
        idElement.textContent = `ID: ${listing.listing_id}`;
        
        // Add organ type display
        const organTypeElement = document.getElementById('listing-organ-type');
        if (organTypeElement) {
            // Check for organ type in different possible locations
            const organType = listing.organ_type || 
                             (listing.organ && listing.organ.type) || 
                             listing.organType || 
                             'N/A';
            organTypeElement.textContent = `Organ: ${organType}`;
        }
        
        // Load and display the listing image
        if (listing.image) {
            // Try to load the image from the API
            loadListingImage(listing.image)
                .then(imageUrl => {
                    listingImageElement.src = imageUrl;
                    listingImageElement.classList.remove('hidden');
                    listingImageElement.parentElement.classList.remove('hidden');
                })
                .catch(error => {
                    console.error('Failed to load image:', error);
                    // If image loading fails, show default image
                    listingImageElement.src = 'images/default-organ.jpg';
                    listingImageElement.classList.remove('hidden');
                    listingImageElement.parentElement.classList.remove('hidden');
                });
        } else {
            // If no image, show default
            listingImageElement.src = 'images/default-organ.jpg';
            listingImageElement.classList.remove('hidden');
            listingImageElement.parentElement.classList.remove('hidden');
        }
        
        // Check if listing is expired based on resolution or end time
        const expired = isExpired(listing);
        
        if (!expired) {
            monitorExpiry(listing.time_end); // Only monitor if still active
        }
        
        // Set status badge based on expiry and resolution status
        const isActive = !expired;
        
        if (listing.is_resolved) {
            // Show the resolution type if available
            let statusText = '';
            let statusClass = '';
            switch(listing.resolution_status) {
                case 'early':
                    statusText = 'Ended (Early)';
                    statusClass = 'status-ended-early';
                    break;
                case 'accepted':
                    statusText = 'Ended (Accepted)';
                    statusClass = 'status-ended-accepted';
                    break;
                case 'cancelled':
                    statusText = 'Ended (Cancelled)';
                    statusClass = 'status-ended-cancelled';
                    break;
                default:
                    statusText = 'Ended';
                    statusClass = 'status-ended';
            }
            statusElement.textContent = statusText;
            statusElement.classList.remove('status-active', 'status-ended', 'status-ended-early', 'status-ended-accepted', 'status-ended-cancelled');
            statusElement.classList.add(statusClass);
        } else if (isActive) {
            statusElement.textContent = 'Active';
            statusElement.classList.remove('status-ended', 'status-ended-early', 'status-ended-accepted', 'status-ended-cancelled');
            statusElement.classList.add('status-active');
        } else {
            statusElement.textContent = 'Ended';
            statusElement.classList.remove('status-active', 'status-ended-early', 'status-ended-accepted', 'status-ended-cancelled');
            statusElement.classList.add('status-ended');
        }

        // Animate badge
        statusElement.classList.add('transition-all', 'duration-500', 'scale-105');
        setTimeout(() => {
        statusElement.classList.remove('scale-105');
        }, 300);

        // Set pricing and time data
        startBidElement.textContent = `$${listing.start_bid.toLocaleString()}`;
        
        if (listing.current_bid) {
            currentBidElement.textContent = `$${listing.current_bid.toLocaleString()}`;
            formCurrentBid.textContent = `$${listing.current_bid.toLocaleString()}`;
        } else {
            currentBidElement.textContent = 'No bids yet';
            formCurrentBid.textContent = `$${listing.start_bid.toLocaleString()} (starting bid)`;
        }
        
        endTimeElement.textContent = new Date(listing.time_end).toLocaleString();
        bidsCountElement.textContent = listing.bids_count;
        
        // Set description
        descriptionElement.textContent = listing.description || 'No description provided';
        
        // Check if current user is the listing owner
        const currentUserId = getCurrentUserId();
        
        // Debug logging
        console.log("Is listing expired?", expired);
        console.log("Is listing resolved?", listing.is_resolved);
        
        // Check if the listing has an owner_id property and if it matches the current user ID
        isListingOwner = (listing.owner_id === currentUserId);
        console.log("Is current user the owner?", isListingOwner);
        
        // If user is the listing owner AND the listing is not expired, show owner controls
        const ownerControls = document.getElementById('owner-controls');
        if (isListingOwner && isActive) {
            console.log("Showing owner controls - listing is active and user is owner");
            ownerControls.classList.remove('hidden');
        } else {
            console.log("Owner controls remain hidden - " + 
                (expired ? "listing is expired" : "user is not the owner or listing is resolved"));
            ownerControls.classList.add('hidden');
        }
        
        // Pass the isActive flag and the resolution status to renderBidHistory to control accept button visibility
        renderBidHistory(listing.bids, isActive, listing.is_resolved);

        // Handle bid form visibility and winner display
        const winnerContainer = document.getElementById('winner-section-container');

        if (expired || listing.is_resolved) {
            // Hide the bid form if listing is expired or resolved
            placeBidForm.classList.add('hidden');

            // Show winner section if there are bids
            if (listing.bids && listing.bids.length > 0) {
                try {
                    // Check if we already have resolution data
                    if (listing.is_resolved && listing.winner_id && listing.winning_bid) {
                        // Use resolution data from listing
                        winnerContainer.innerHTML = `
                            <div class="bg-green-100 p-4 rounded-md mt-6">
                                <h3 class="text-sm font-medium text-green-800">🏆 Winner Selected</h3>
                                <p class="text-sm text-green-700">
                                    Bidder ID: <strong>${listing.winner_id}</strong> |
                                    Winning Bid: $${listing.winning_bid}
                                </p>
                                <p class="text-xs text-green-700 mt-1">
                                    Resolution Status: <span class="font-medium">${listing.resolution_status.toUpperCase()}</span>
                                </p>
                            </div>
                        `;
                    } else {
                        // Fetch resolution data
                        const resolutionServiceUrl = 'http://localhost:8000/resolve';
                        const res = await fetch(`${resolutionServiceUrl}/api/resolutions/listing/${listing.listing_id || listing.id}`);
                        if (res.ok) {
                            const resolution = await res.json();
                            if (resolution) {
                                winnerContainer.innerHTML = `
                                    <div class="bg-green-100 p-4 rounded-md mt-6">
                                        <h3 class="text-sm font-medium text-green-800">🏆 Winner Selected</h3>
                                        <p class="text-sm text-green-700">
                                            Bidder ID: <strong>${resolution.winner_id}</strong> |
                                            Winning Bid: $${resolution.winning_bid}
                                        </p>
                                        <p class="text-xs text-green-700 mt-1">
                                            Resolution Status: <span class="font-medium">${resolution.status.toUpperCase()}</span>
                                        </p>
                                    </div>
                                `;
                            } else {
                                throw new Error('No resolution data found');
                            }
                        } else {
                            throw new Error('Failed to fetch resolution');
                        }
                    }
                } catch (error) {
                    console.warn('❌ No resolution found yet. Fallback to top bid.');
                    const topBid = [...listing.bids].sort((a, b) => b.bid_amt - a.bid_amt)[0];
            
                    winnerContainer.innerHTML = `
                        <div class="bg-yellow-100 p-4 mt-4 rounded-lg text-center shadow">
                            <p class="text-yellow-800 font-semibold">🏆 Winner: Bidder #${topBid.bidder_id}</p>
                            <p class="text-yellow-700 text-sm mt-1">Winning Bid: $${topBid.bid_amt.toLocaleString()}</p>
                            <p class="text-yellow-700 text-sm mt-1">Description: ${listing.description || 'No description provided'}</p>
                        </div>
                    `;
                }
            } 
        } else {
            // Show the bid form and hide winner section for active listings
            placeBidForm.classList.remove('hidden');
            winnerContainer.innerHTML = ''; // Clear any previous winner content
            
            // Set minimum bid amount
            const minimumBid = listing.current_bid ? listing.current_bid + 1 : listing.start_bid;
            bidAmountInput.min = minimumBid;
            bidAmountInput.placeholder = minimumBid.toLocaleString();
        }  
    }      

    function monitorExpiry(expiryTime) {
        const expiryDate = new Date(expiryTime);
        const interval = setInterval(async () => {
            const now = new Date();
            
            // Check time expiry
            const isTimeExpired = now >= expiryDate;
            
            // Also check for resolution (early acceptance)
            let isResolved = false;
            try {
                const resolutionServiceUrl = 'http://localhost:8000/resolve';
                const res = await fetch(`${resolutionServiceUrl}/api/resolutions/listing/${listingId}`);
                if (res.ok) {
                    const resolution = await res.json();
                    if (resolution) {
                        isResolved = true;
                        console.log("Resolution detected during monitoring:", resolution);
                        
                        // Update the state globally so it persists even after page refresh
                        const urlParams = new URLSearchParams(window.location.search);
                        const currentListingId = urlParams.get('id');
                        
                        // Re-fetch the listing to update with resolution
                        const listings = await apiService.getListingsWithBids();
                        const listing = listings.find(l => l.id === parseInt(currentListingId) || l.listing_id === parseInt(currentListingId));
                        
                        if (listing) {
                            // Update listing with resolution data
                            listing.is_resolved = true;
                            listing.resolution_status = resolution.status;
                            listing.winner_id = resolution.winner_id;
                            listing.winning_bid = resolution.winning_bid;
                            
                            // Force status to ended
                            listing.status = 'ended';
                            
                            console.log("Listing updated with resolution data during monitoring");
                        }
                    }
                }
            } catch (error) {
                // Ignore resolution check errors, we'll try again on next interval
                console.warn("Error checking for resolutions:", error);
            }
            
            if (isTimeExpired || isResolved) {
                clearInterval(interval);
                console.log("⏰ Listing has expired or been resolved. Updating UI...");
                
                if (isResolved) {
                    showToast("This listing has been resolved.");
                } else {
                    showToast("Auction has ended.");
                }
                
                // Re-fetch to update the UI with the current state
                fetchListingDetails(); 
            }
        }, 5000); // check every 5 seconds
    }
    
    // Render bid history
    function renderBidHistory(bids, isActive, isResolved) {
        if (!bids || bids.length === 0) {
            noBidsMessage.classList.remove('hidden');
            bidsList.classList.add('hidden');
            return;
        }
        
        noBidsMessage.classList.add('hidden');
        bidsList.classList.remove('hidden');
        bidsList.innerHTML = '';
        
        // Sort bids by time, newest first
        const sortedBids = [...bids].sort((a, b) => {
            return new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime();
        });
        
        // Create bid history items
        sortedBids.forEach(bid => {
            console.log('Bid object:', bid);
            
            // Add listing_resolved flag to the bid object if the listing is resolved
            if (isResolved) {
                bid.listing_resolved = true;
            }
            
            const template = document.getElementById('bid-item-template');
            const clone = document.importNode(template.content, true);
            
            clone.querySelector('.bid-amount').textContent = `$${bid.bid_amt.toLocaleString()}`;
            clone.querySelector('.bid-id').textContent = `Bidder #${bid.bidder_id}`;
            clone.querySelector('.bid-time').textContent = new Date(bid.bid_time).toLocaleString();
            
            // Get the status element
            const statusElement = clone.querySelector('.bid-status');

            // Check if this bid has a status (accepted or cancelled)
            const isAccepted = bid.status === 'accepted';
            const isCancelled = bid.status === 'cancelled';
            
            if (isAccepted) {
                statusElement.textContent = 'Accepted';
                statusElement.classList.add('bid-status-accepted');
                statusElement.classList.remove('hidden');
            } else if (isCancelled) {
                statusElement.textContent = 'Rejected';
                statusElement.classList.add('bid-status-rejected');
                statusElement.classList.remove('hidden');
            } else {
                // If no status, hide the status element
                statusElement.classList.add('hidden');
            }
            
            // Add accept button for bids if:
            // 1. User is the listing owner AND 
            // 2. Listing is active AND
            // 3. Bid is not already accepted AND
            // 4. Listing is not already resolved
            if (isListingOwner && isActive && !isAccepted && !isResolved) {
                const acceptButton = document.createElement('button');
                acceptButton.textContent = 'Accept Bid';
                acceptButton.classList.add('accept-bid-btn', 'ml-2', 'px-2', 'py-1', 'text-xs', 
                    'bg-green-500', 'text-white', 'rounded', 'hover:bg-green-600');
            
                acceptButton.addEventListener('click', async (event) => {
                    event.preventDefault();
                    
                    // Disable all accept buttons to prevent double acceptance
                    document.querySelectorAll('.accept-bid-btn').forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add('opacity-50', 'cursor-not-allowed');
                    });
                    
                    try {
                        const urlParams = new URLSearchParams(window.location.search);
                        const listingId = urlParams.get('id');
                    
                        // Show toast to indicate processing
                        showToast("Processing bid acceptance...");
                        
                        // Call API to accept the bid
                        const resolution = await apiService.acceptBid(bid.bid_id, listingId);
                        console.log("Resolution result:", resolution);
                        
                        if (!resolution) {
                            throw new Error("Failed to get resolution data from server");
                        }
                    
                        // 🔄 Update status in UI
                        statusElement.textContent = 'Accepted';
                        statusElement.classList.remove('hidden');
                        statusElement.classList.add('bid-status-accepted');
                    
                        // 🚫 Remove the accept button
                        acceptButton.remove();
                    
                        // ✅ Disable all other accept buttons
                        document.querySelectorAll('.accept-bid-btn').forEach(btn => btn.remove());
                        
                        // 🔄 Update the listing status from "Active" to "Ended"
                        const listingStatusElement = document.getElementById('listing-status');
                        // Use the resolution status from the API response
                        const bidAcceptedStatus = resolution && resolution.status ? resolution.status : 'early';
                        
                        // Set different text and style based on resolution status
                        let statusText = '';
                        let statusClass = '';
                        switch(bidAcceptedStatus) {
                            case 'early':
                                statusText = 'Ended (Early)';
                                statusClass = 'status-ended-early';
                                break;
                            case 'accepted':
                                statusText = 'Ended (Accepted)';
                                statusClass = 'status-ended-accepted';
                                break;
                            case 'cancelled':
                                statusText = 'Ended (Cancelled)';
                                statusClass = 'status-ended-cancelled';
                                break;
                            default:
                                statusText = 'Ended (Early)';
                                statusClass = 'status-ended-early';
                        }
                        
                        listingStatusElement.textContent = statusText;
                        listingStatusElement.classList.remove('status-active', 'status-ended', 'status-ended-early', 'status-ended-accepted', 'status-ended-cancelled');
                        listingStatusElement.classList.add(statusClass);
                        
                        // 🚫 Hide the bid form since the listing is now ended
                        const placeBidForm = document.getElementById('place-bid-form');
                        placeBidForm.classList.add('hidden');
                        
                        // 🎯 Show winner section with resolution status
                        const winnerContainer = document.getElementById('winner-section-container');
                        
                        winnerContainer.innerHTML = `
                            <div class="bg-green-100 p-4 rounded-md mt-6">
                                <h3 class="text-sm font-medium text-green-800">🏆 Winner Selected</h3>
                                <p class="text-sm text-green-700">
                                    Bidder ID: <strong>${bid.bidder_id}</strong> | Winning Bid: $${bid.bid_amt}
                                </p>
                                <p class="text-xs text-green-700 mt-1">
                                    Resolution Status: <span class="font-medium">${bidAcceptedStatus.toUpperCase()}</span>
                                </p>
                            </div>
                        `;
                        
                        // 🚫 Hide owner controls since listing is now ended
                        const ownerControls = document.getElementById('owner-controls');
                        ownerControls.classList.add('hidden');
                        
                        // Update the global listing state
                        try {
                            const listings = await apiService.getListingsWithBids();
                            const listing = listings.find(l => l.id === parseInt(listingId) || l.listing_id === parseInt(listingId));
                            
                            if (listing) {
                                // Mark the listing as resolved with the resolution data
                                listing.is_resolved = true;
                                listing.resolution_status = bidAcceptedStatus;
                                listing.winner_id = bid.bidder_id;
                                listing.winning_bid = bid.bid_amt;
                                
                                // Force status to ended
                                listing.status = 'ended';
                                
                                console.log("Global listing state updated with resolution data");
                            }
                        } catch (error) {
                            console.warn("Could not update global listing state:", error);
                        }
                    
                        showToast("✅ Bid accepted successfully! Listing status updated to Ended.");
                        
                    } catch (error) {
                        // Re-enable accept buttons if there was an error
                        document.querySelectorAll('.accept-bid-btn').forEach(btn => {
                            btn.disabled = false;
                            btn.classList.remove('opacity-50', 'cursor-not-allowed');
                        });
                        
                        console.error('Error accepting bid:', error);
                        showError('Failed to accept bid: ' + (error.message || JSON.stringify(error)));
                    }
                });
                
                // Append to controls
                const controlsContainer = clone.querySelector('.bid-controls-container .flex');
                if (controlsContainer) {
                    controlsContainer.appendChild(acceptButton);
                } else {
                    statusElement.parentNode.appendChild(acceptButton);
                }
            }            
            
            bidsList.appendChild(clone);
        });
    }
    
    // Get current user data from localStorage
    function getCurrentUserData() {
        // Use userData key (which is what login.js actually sets)
        const userData = JSON.parse(localStorage.getItem('userData') || '{"userid": 1, "email": "guest@example.com", "username": "Guest"}');
        console.log("Retrieved user data from localStorage:", userData);
        return userData;
    }

    // Get current user ID (implement based on your auth system)
    function getCurrentUserId() {
        // Use the userData key instead of 'user'
        const userData = getCurrentUserData();
        // Support both userid and id formats
        return userData.userid || userData.id || 1;
    }
    
    // Handle submitting a bid
    bidForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Clear previous errors
        bidErrorElement.classList.add('hidden');
        
        const bidAmount = parseFloat(bidAmountInput.value);
        
        if (isNaN(bidAmount)) {
            showBidError('Please enter a valid bid amount');
            return;
        }
        
        try {
            // First check if the listing is resolved (additional client-side validation)
            const resolutionServiceUrl = 'http://localhost:8000/resolve';
            try {
                const res = await fetch(`${resolutionServiceUrl}/api/resolutions/listing/${listingId}`);
                if (res.ok) {
                    const resolution = await res.json();
                    if (resolution) {
                        showBidError('This listing has been resolved. Bidding is no longer available.');
                        // Refresh the page to show the resolved status
                        setTimeout(() => window.location.reload(), 2000);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Error checking resolution status:', error);
                // Continue with time-based checks
            }
            
            // Check if the listing is expired (additional client-side validation)
            const listingData = await apiService.getListingById(listingId);
            const currentTime = new Date();
            const expiryTime = new Date(listingData.time_end || listingData.expiryDate);
            
            if (currentTime > expiryTime) {
                showBidError('This listing has expired. Bidding is no longer available.');
                // Refresh the page to show the expired status
                setTimeout(() => window.location.reload(), 2000);
                return;
            }
            
            // Get user data from localStorage instead of hardcoding bidderId
            const userData = JSON.parse(localStorage.getItem("userData") || '{"userid": 1, "email": "guest@example.com", "username": "Guest"}');
            console.log("Using user data for bid placement:", userData);
            
            // Use userid from userData as the bidderId
            const bidderId = userData.userid;
            console.log("Using bidder ID:", bidderId);
            
            // Submit the bid
            const result = await apiService.placeBid(bidderId, listingId, bidAmount);
            console.log("Bid placed successfully:", result);
            
            // Show success message
            showToast("Bid placed successfully!");
            
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Error placing bid:', error);

            const errorMsg = (typeof error === 'string')
                ? error
                : (error.message || JSON.stringify(error));
            
            // Check if the error contains a message about the listing being expired or resolved
            if (errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('resolved')) {
                showBidError('This listing has ended. Bidding is no longer available.');
                // Refresh the page to update the UI
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showBidError(errorMsg || 'Failed to place bid');
            }
        }
    });
        
    function showBidError(message) {
        bidErrorElement.textContent = message;
        bidErrorElement.classList.remove('hidden');
        
        // Style the error more prominently for expired listings
        if (message.toLowerCase().includes('expired')) {
            bidErrorElement.classList.add('font-medium', 'py-2');
        } else {
            bidErrorElement.classList.remove('font-medium', 'py-2');
        }
    }

    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.remove("opacity-0");
        toast.classList.add("opacity-100");
      
        setTimeout(() => {
          toast.classList.remove("opacity-100");
          toast.classList.add("opacity-0");
        }, 3000); // hide after 3 seconds
      }

    
    // Handle tab switching
    tabBids.addEventListener('click', function() {
        setActiveTab(tabBids, tabContentBids);
    });
    
    tabDetails.addEventListener('click', function() {
        setActiveTab(tabDetails, tabContentDetails);
    });
    
    function setActiveTab(activeTab, activeContent) {
        // Reset all tabs
        [tabBids, tabDetails].forEach(tab => {
            tab.classList.remove('border-indigo-500', 'text-indigo-600');
            tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        });
        
        // Reset all content areas
        [tabContentBids, tabContentDetails].forEach(content => {
            content.classList.add('hidden');
        });
        
        // Set active tab
        activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        activeTab.classList.add('border-indigo-500', 'text-indigo-600');
        
        // Show active content
        activeContent.classList.remove('hidden');
    }
    
    // Back button functionality
    backButton.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    backToListingsButton.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Function to load the listing image
    async function loadListingImage(imageName) {
        try {
            if (imageName === 'default-organ.jpg') {
                return 'images/default-organ.jpg';
            }
            
            // Use the apiService to get the image URL
            const imageUrl = await apiService.getImage(imageName);
            return imageUrl;
        } catch (error) {
            console.error('Error loading image:', error);
            return 'images/default-organ.jpg';
        }
    }
    
    // Initialize the page
    fetchListingDetails();

    
});