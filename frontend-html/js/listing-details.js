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

            
            // Render listing details
            renderListingDetails(listing);
            
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
    
    // Render listing details
    function renderListingDetails(listing) {
        // Set basic listing info
        titleElement.textContent = listing.name;
        idElement.textContent = `ID: ${listing.listing_id}`;
        
        // Check if listing is expired based on end time
        const currentTime = new Date();
        const expiryTime = new Date(listing.time_end);
        const isExpired = currentTime > expiryTime;

        if (!isExpired) {
            monitorExpiry(listing.time_end); // Only monitor if still active
        }
        
        // Set status badge based on expiry
        const isActive = !isExpired;
        // statusElement.textContent = isActive ? 'Active' : 'Ended';
        // statusElement.classList.add(isActive ? 'status-active' : 'status-ended');

        statusElement.textContent = isActive ? 'Active' : 'Ended';

        statusElement.classList.remove('status-active', 'status-ended');
        statusElement.classList.add(isActive ? 'status-active' : 'status-ended');

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
        
        endTimeElement.textContent = expiryTime.toLocaleString();
        bidsCountElement.textContent = listing.bids_count;
        
        // Set description
        descriptionElement.textContent = listing.description || 'No description provided';
        
        // Check if current user is the listing owner
        const currentUserId = getCurrentUserId();
        
        // Debug logging
        console.log("Is listing expired?", isExpired);
        
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
                (isExpired ? "listing is expired" : "user is not the owner"));
            ownerControls.classList.add('hidden');
        }
        
        // Pass the isActive flag to renderBidHistory to control accept button visibility
        renderBidHistory(listing.bids, isActive);

        if (isExpired && listing.bids && listing.bids.length > 0) {
            const winnerContainer = document.getElementById('winner-section-container');
            if (winnerContainer) {
                winnerContainer.innerHTML = ''; // Clear old content
        
                const topBid = [...listing.bids].sort((a, b) => b.bid_amt - a.bid_amt)[0];
        
                const winnerSection = document.createElement('div');
                winnerSection.className = 'bg-yellow-100 p-4 mt-4 rounded-lg text-center shadow';
                winnerSection.innerHTML = `
                    <p class="text-yellow-800 font-semibold">🏆 Winner: Bidder #${topBid.bidder_id}</p>
                    <p class="text-yellow-700 text-sm mt-1">Winning Bid: $${topBid.bid_amt.toLocaleString()}</p>
                    <p class="text-yellow-700 text-sm mt-1">Description: ${listing.description || 'No description provided'}</p>
                `;
        
                winnerContainer.appendChild(winnerSection);
            
            }
            } else {
            placeBidForm.classList.remove('hidden');
        
            const existingNotice = document.getElementById('expired-notice');
            if (existingNotice) {
                existingNotice.remove();
            }
        
            const minimumBid = listing.current_bid ? listing.current_bid + 1 : listing.start_bid;
            bidAmountInput.min = minimumBid;
            bidAmountInput.placeholder = minimumBid.toLocaleString();
        }  
    }      

    function monitorExpiry(expiryTime) {
        const expiryDate = new Date(expiryTime);
        const interval = setInterval(() => {
          const now = new Date();
          if (now >= expiryDate) {
            clearInterval(interval);
            console.log("⏰ Listing has expired. Updating UI...");

            //
            showToast("Auction has ended.")
            fetchListingDetails(); // Re-fetch to rerender with expired state
          }
        }, 1000); // check every second
      }
      
    // Render bid history
    function renderBidHistory(bids, isActive) {
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
            const template = document.getElementById('bid-item-template');
            const clone = document.importNode(template.content, true);
            
            clone.querySelector('.bid-amount').textContent = `$${bid.bid_amt.toLocaleString()}`;
            clone.querySelector('.bid-id').textContent = `Bidder #${bid.bidder_id}`;
            clone.querySelector('.bid-time').textContent = new Date(bid.bid_time).toLocaleString();
            
            // Get the status element
            const statusElement = clone.querySelector('.bid-status');
            
            // Check if bid has a meaningful status (e.g., 'accepted')
            // First check if bid has an explicit 'accepted' property that might come from the resolve service
            let isAccepted = bid.accepted === true || bid.status === 'accepted';
            
            // If the bid is accepted, show the status
            if (isAccepted) {
                statusElement.textContent = 'Accepted';
                statusElement.classList.add('bid-status-accepted');
                statusElement.classList.remove('hidden');
            } else {
                // Otherwise hide the status element
                statusElement.classList.add('hidden');
            }
            
            // Add accept button for bids if user is the listing owner AND listing is active
            // Only show the accept button if the bid is not already accepted
            if (isListingOwner && isActive && !isAccepted) {
                const acceptButton = document.createElement('button');
                acceptButton.textContent = 'Accept Bid';
                acceptButton.classList.add('accept-bid-btn', 'ml-2', 'px-2', 'py-1', 'text-xs', 
                    'bg-green-500', 'text-white', 'rounded', 'hover:bg-green-600');
                
                acceptButton.addEventListener('click', async (event) => {
                    event.preventDefault();
                    try {
                        // Get listingId from URL parameter instead of bid object
                        const urlParams = new URLSearchParams(window.location.search);
                        const listingId = urlParams.get('id');
                        
                        console.log("Accepting bid with data:", {
                            bidId: bid.bid_id,
                            listingId: listingId
                        });
                        
                        await apiService.acceptBid(bid.bid_id, listingId);
                        
                        // Show immediate visual feedback before reload
                        statusElement.textContent = 'Accepted';
                        statusElement.classList.add('bid-status-accepted');
                        statusElement.classList.remove('hidden');
                        
                        // Remove the accept button
                        acceptButton.remove();
                        
                        // Short delay before refresh to show the status change
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                        
                    } catch (error) {
                        console.error('Error accepting bid:', error);
                        showError('Failed to accept bid: ' + error.message);
                    }
                });
                
                // Find the container to append the button
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
            
            
            // // Refresh the page to show the new bid
            // window.location.reload();
        } catch (error) {
            console.error('Error placing bid:', error);

            const errorMsg = (typeof error === 'string')
                ? error
                : (error.message || JSON.stringify(error));
            
            // Check if the error contains a message about the listing being expired
            if (errorMsg.toLowerCase().includes('expired')) {
                showBidError('This listing has expired. Bidding is no longer available.');
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
    
    // Initialize the page
    fetchListingDetails();

    
});