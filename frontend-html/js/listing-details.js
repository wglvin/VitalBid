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
        
        // Set status badge
        const isActive = listing.status === 'active';
        statusElement.textContent = isActive ? 'Active' : 'Ended';
        statusElement.classList.add(isActive ? 'status-active' : 'status-ended');
        
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
        console.log("Listing data:", listing);
        console.log("Current user ID:", currentUserId);
        console.log("Listing owner_id:", listing.owner_id);
        
        // Check if the listing has an owner_id property and if it matches the current user ID
        isListingOwner = (listing.owner_id === currentUserId);
        console.log("Is current user the owner?", isListingOwner);
        
        // If user is the listing owner, show accept bid buttons
        const ownerControls = document.getElementById('owner-controls');
        if (isListingOwner) {
            console.log("Showing owner controls");
            ownerControls.classList.remove('hidden');
        } else {
            console.log("Owner controls remain hidden");
            // For debugging purposes, temporarily force-show the owner controls
            // ownerControls.classList.remove('hidden'); // Uncomment this for testing
        }
        
        // Render bid history
        renderBidHistory(listing.bids);
        
        // Show/hide bid form based on listing status
        if (!isActive) {
            placeBidForm.classList.add('hidden');
        } else {
            // Set minimum bid amount
            const minimumBid = listing.current_bid ? listing.current_bid + 1 : listing.start_bid;
            bidAmountInput.min = minimumBid;
            bidAmountInput.placeholder = minimumBid.toLocaleString();
        }
    }
    
    // Render bid history
    function renderBidHistory(bids) {
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
            const template = document.getElementById('bid-item-template');
            const clone = document.importNode(template.content, true);
            
            clone.querySelector('.bid-amount').textContent = `$${bid.bid_amt.toLocaleString()}`;
            clone.querySelector('.bid-id').textContent = `Bidder #${bid.bidder_id}`;
            clone.querySelector('.bid-time').textContent = new Date(bid.bid_time).toLocaleString();
            
            // Set a default status for now to retrieve from resolving service later
            const bidStatus = 'active';

            const statusElement = clone.querySelector('.bid-status');
            statusElement.textContent = bidStatus;
            statusElement.classList.add(`bid-status-${bidStatus.toLowerCase()}`);
            
            // Add accept button for active bids if user is the listing owner
            if (isListingOwner && bidStatus === 'active') {
                const acceptButton = document.createElement('button');
                acceptButton.textContent = 'Accept Bid';
                acceptButton.classList.add('accept-bid-btn', 'ml-2', 'px-2', 'py-1', 'text-xs', 
                    'bg-green-500', 'text-white', 'rounded', 'hover:bg-green-600');
                
                acceptButton.addEventListener('click', async (event) => {
                    event.preventDefault(); // Prevent default action
                    try {
                        console.log("Accepting bid:", bid.bid_id);
                        await acceptBid(bid.bid_id);
                        // Refresh the page to show updated statuses
                        window.location.reload();
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
    
    // Function to accept a bid
    async function acceptBid(bidId) {
        try {
            const response = await apiService.acceptBid(bidId);
            return response;
        } catch (error) {
            console.error('Error accepting bid:', error);
            throw error;
        }
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
            // Get user data from localStorage instead of hardcoding bidderId
            const userData = JSON.parse(localStorage.getItem("userData") || '{"userid": 1, "email": "guest@example.com", "username": "Guest"}');
            console.log("Using user data for bid placement:", userData);
            
            // Use userid from userData as the bidderId
            const bidderId = userData.userid;
            console.log("Using bidder ID:", bidderId);
            
            const response = await apiService.placeBid(listingId, bidderId, bidAmount);
            
            // Refresh the page to show the new bid
            window.location.reload();
        } catch (error) {
            console.error('Error placing bid:', error);
            showBidError(error.message || 'Failed to place bid');
        }
    });
        
    function showBidError(message) {
        bidErrorElement.textContent = message;
        bidErrorElement.classList.remove('hidden');
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