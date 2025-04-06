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
            
            // Check for resolved listings first
            await checkResolutionsBeforeFilter(data);
            
            // Filter and render listings for each tab
            
            // Active tab: Only listings with 'active' status
            const activeListings = data.filter(listing => listing.status === 'active');
            renderListings(activeListings, tabContentActive);
            
            // Ended tab: Any with 'ended' status, any with resolution, or any expired
            const endedListings = data.filter(listing => 
                listing.status === 'ended' || 
                listing.is_resolved || 
                new Date(listing.time_end) <= new Date()
            );
            renderListings(endedListings, tabContentEnded);
            
            // All tab: All listings
            renderListings(data, tabContentAll);
            
            // Update the tab counts
            document.getElementById('active-count').textContent = activeListings.length;
            document.getElementById('ended-count').textContent = endedListings.length;
            document.getElementById('all-count').textContent = data.length;
        } catch (error) {
            loadingIndicator.innerHTML = `<p class="text-red-500">Error loading listings: ${error.message}</p>`;
        }
    }

    // Check for resolutions before filtering listings
    async function checkResolutionsBeforeFilter(listings) {
        const resolutionPromises = [];
        
        for (const listing of listings) {
            const checkPromise = async () => {
                    const resolutionServiceUrl = 'http://localhost:8000/resolve';
                    const res = await fetch(`${resolutionServiceUrl}/api/resolutions/listing/${listing.listing_id}`, {
                        // Add this option to silence the console errors for failed requests
                        cache: 'no-cache',
                        // Prevent fetch from throwing network errors to console
                        silent: true
                    }).catch(() => ({ok: false}));  // Catch network errors and return a "not ok" response
                    
                    if (res.ok) {
                        const resolution = await res.json();
                        // Mark the listing as resolved
                        listing.is_resolved = true;
                        listing.resolution_status = resolution.status; // early, accepted, cancelled
                        listing.status = 'ended'; // Force status to ended for any resolved listing
                        
                        // Also store winner info
                        if (resolution.winner_id) {
                            listing.winner_id = resolution.winner_id;
                            listing.winning_bid = resolution.winning_bid;
                        }
                    } else {
                        // If no resolution is found, compute status based on time
                        const isExpired = new Date(listing.time_end) <= new Date();
                        listing.status = isExpired ? 'ended' : 'active';
                    }
            };
            
            // Add the promise to our array
            resolutionPromises.push(checkPromise());
        }
        
        // Wait for all resolution checks to complete
        await Promise.all(resolutionPromises);
        
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
        
        // Get resolutions and organ types for all listings
        const checkResolutionsAndOrgans = async () => {
            for (const listing of listings) {
                // Check for resolution status
                if (listing.status === 'ended') {
                    try {
                        const resolutionServiceUrl = 'http://localhost:8000/resolve';
                        const res = await fetch(`${resolutionServiceUrl}/api/resolutions/listing/${listing.listing_id}`, {
                            signal: controller.signal
                        }).catch(() => null);  // Silently catch network errors
                        
                        if (res.ok) {
                            const resolution = await res.json();
                            listing.resolution_status = resolution.status; // early, accepted, cancelled
                        }
                    } catch (error) {
                        console.warn(`Could not fetch resolution for listing ${listing.listing_id}:`, error);
                    }
                }
                
                // Fetch organ type if we have an organ_id but no organ_type yet
                if (listing.organ_id && !listing.organ_type) {
                    try {
                        const organ = await apiService.getOrganById(listing.organ_id);
                        if (organ && organ.type) {
                            listing.organ_type = organ.type;
                        }
                    } catch (error) {
                        console.warn(`Could not fetch organ type for listing ${listing.listing_id}:`, error);
                    }
                }
            }
            renderListingsWithStatus(listings);
        };
        
        // Render listings with resolution status
        function renderListingsWithStatus(listings) {
            // Clone the template for each listing and append to container
            listings.forEach(listing => {
                const template = document.getElementById('listing-card-template');
                const clone = document.importNode(template.content, true);
                
                // Set listing data
                clone.querySelector('.listing-title').textContent = listing.name;
                clone.querySelector('.listing-id').textContent = `ID: ${listing.listing_id}`;
                
                // Set organ type with proper fallbacks
                const organTypeElement = clone.querySelector('.organ-id');
                if (organTypeElement) {
                    // Check for organ type in different possible locations
                    const organType = listing.organ_type || 
                                     (listing.organ && listing.organ.type) || 
                                     listing.organType || 
                                     'Unknown';
                    organTypeElement.textContent = `Organ: ${organType}`;
                }
                // Set listing image
                if (clone.querySelector('.listing-image')) {
                    // Try to load the image through the apiService
                    const imageElement = clone.querySelector('.listing-image');
                    loadListingImage(listing.image)
                        .then(imageUrl => {
                            imageElement.src = imageUrl;
                        })
                }
                
                // Set status badge (based on computed status and resolution status)
                const statusBadge = clone.querySelector('.listing-status');
                if (statusBadge) {
                    if (listing.status === 'ended') {
                        // Always show "Ended" as the primary status for all ended listings
                        statusBadge.textContent = 'Ended';
                        statusBadge.classList.add('bg-gray-300', 'text-gray-700', 'px-2', 'py-1', 'rounded', 'text-xs', 'font-semibold');
                        
                        // If we have resolution status, add a small badge with the specific type
                        if (listing.resolution_status) {
                            // Create sub-status badge
                            const subStatusBadge = document.createElement('span');
                            let subStatusText = '';
                            let subStatusClass = '';
                            
                            switch(listing.resolution_status) {
                                case 'early':
                                    subStatusText = '(Early)';
                                    subStatusClass = 'bg-yellow-100 text-yellow-800';
                                    break;
                                case 'accepted':
                                    subStatusText = '(Accepted)';
                                    subStatusClass = 'bg-green-100 text-green-800';
                                    break;
                                case 'cancelled':
                                    subStatusText = '(Cancelled)';
                                    subStatusClass = 'bg-red-100 text-red-800';
                                    break;
                            }
                            
                            if (subStatusText) {
                                subStatusBadge.textContent = subStatusText;
                                subStatusBadge.classList.add('ml-1', 'px-1', 'py-0.5', 'rounded', 'text-xxs', 'font-medium');
                                subStatusClass.split(' ').forEach(cls => subStatusBadge.classList.add(cls));
                                
                                // Append sub-status after the main status badge
                                const badgeContainer = statusBadge.parentNode;
                                badgeContainer.appendChild(subStatusBadge);
                            }
                        }
                    } else if (listing.status === 'active') {
                        statusBadge.textContent = 'Active';
                        statusBadge.classList.add('bg-green-100', 'text-green-800', 'px-2', 'py-1', 'rounded', 'text-xs', 'font-semibold');
                    } else {
                        statusBadge.textContent = listing.status;
                    }
                }
                
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
                
                // Set time remaining
                const timeRemainingContainer = clone.querySelector('.time-remaining-container');
                const timeRemainingElement = clone.querySelector('.listing-time-remaining');
                
                // Check if listing is expired based on time_end
                const isActive = new Date(listing.time_end) > new Date() && listing.status !== 'ended';
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
        
        // Call the async function to check resolutions and render listings
        checkResolutionsAndOrgans();
    }

    // Function to load listing image using apiService
    async function loadListingImage(imageName) {
        try {
            
            // Use the apiService to get the image URL
            const imageUrl = await apiService.getImage(imageName);
            return imageUrl;
        } catch (error) {
            console.error('Error loading image:', error);
            return 'images/default-organ.jpg';
        }
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

    setInterval(() => {
        fetchListings(); // Re-fetch listings to reflect expired ones
      }, 30000); // check every 30 seconds
      
}); 