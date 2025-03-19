document.addEventListener('DOMContentLoaded', function() {
    const tabAll = document.getElementById('tab-all');
    const tabActive = document.getElementById('tab-active');
    const tabEnded = document.getElementById('tab-ended');

    const tabContentAll = document.getElementById('tab-content-all');
    const tabContentActive = document.getElementById('tab-content-active');
    const tabContentEnded = document.getElementById('tab-content-ended');

    const loadingIndicator = document.getElementById('loading-indicator');
    const listingsContainer = document.getElementById('listings-container');
    const listingDetailContainer = document.getElementById('listing-detail-container');

    // Fetch and display listings
    async function fetchListings() {
        try {
            const data = await apiService.getListingsWithBids();
            
            // Hide the loading indicator and show the listings container
            loadingIndicator.classList.add('hidden');
            listingsContainer.classList.remove('hidden');
            
            // Render all listings
            renderListings(data, tabContentAll);
            
            // Filter and render active listings
            const activeListings = data.filter(listing => listing.status === 'active');
            renderListings(activeListings, tabContentActive);
            
            // Filter and render ended listings
            const endedListings = data.filter(listing => listing.status === 'ended');
            renderListings(endedListings, tabContentEnded);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
            loadingIndicator.innerHTML = `<p class="text-red-500">Error loading listings: ${error.message}</p>`;
        }
    }

    // Render listings to a container element
    function renderListings(listings, container) {
        // Clear container first
        container.innerHTML = '';
        
        // Check if there are any listings
        if (listings.length === 0) {
            container.innerHTML = '<p class="text-center py-8 text-gray-500">No listings available</p>';
            return;
        }
        
        // Clone the template for each listing and append to container
        listings.forEach(listing => {
            const template = document.getElementById('listing-card-template');
            const clone = document.importNode(template.content, true);
            
            // Set listing data
            clone.querySelector('.listing-title').textContent = listing.name;
            clone.querySelector('.listing-id').textContent = `ID: ${listing.listing_id}`;
            
            // Set status badge
            const statusBadge = clone.querySelector('.listing-status');
            const isActive = listing.status === 'active';
            statusBadge.textContent = isActive ? 'Active' : 'Ended';
            statusBadge.classList.add(isActive ? 'status-active' : 'status-ended');
            
            // Set pricing data
            clone.querySelector('.listing-start-bid').textContent = `$${listing.start_bid.toLocaleString()}`;
            
            // Set current bid
            const currentBidElement = clone.querySelector('.listing-current-bid');
            if (listing.current_bid) {
                currentBidElement.textContent = `$${listing.current_bid.toLocaleString()}`;
            } else {
                currentBidElement.textContent = 'No bids yet';
            }
            
            // Set bids count
            clone.querySelector('.listing-bids-count').textContent = listing.bids_count;
            
            // Set time remaining if active
            const timeRemainingContainer = clone.querySelector('.time-remaining-container');
            const timeRemainingElement = clone.querySelector('.listing-time-remaining');
            
            if (isActive) {
                timeRemainingElement.textContent = getTimeRemaining(listing.time_end);
            } else {
                timeRemainingContainer.classList.add('hidden');
            }
            
            // Set up view details button
            const viewDetailsBtn = clone.querySelector('.view-details-btn');
            viewDetailsBtn.addEventListener('click', () => {
                window.location.href = `listing-details.html?id=${listing.listing_id}`;
            });
            
            container.appendChild(clone);
        });
    }

    // Get formatted time remaining string
    function getTimeRemaining(endTimeStr) {
        const endTime = new Date(endTimeStr).getTime();
        const now = new Date().getTime();
        
        if (now > endTime) return "Ended";
        
        const diff = endTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h remaining`;
        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    }

    // Tab switching functionality
    tabAll.addEventListener('click', () => {
        setActiveTab(tabAll, tabContentAll);
    });
    
    tabActive.addEventListener('click', () => {
        setActiveTab(tabActive, tabContentActive);
    });
    
    tabEnded.addEventListener('click', () => {
        setActiveTab(tabEnded, tabContentEnded);
    });

    function setActiveTab(activeTab, activeContent) {
        // Reset all tabs
        [tabAll, tabActive, tabEnded].forEach(tab => {
            tab.classList.remove('tab-selected', 'bg-white', 'text-indigo-600');
            tab.classList.add('text-gray-500');
        });
        
        // Reset all content areas
        [tabContentAll, tabContentActive, tabContentEnded].forEach(content => {
            content.classList.add('hidden');
        });
        
        // Set active tab
        activeTab.classList.add('tab-selected', 'bg-white');
        activeTab.classList.remove('text-gray-500');
        
        // Show active content
        activeContent.classList.remove('hidden');
    }

    // Initialize the page
    fetchListings();
}); 