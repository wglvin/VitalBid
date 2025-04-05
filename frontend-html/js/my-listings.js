document.addEventListener('DOMContentLoaded', function() {
    // Get elements from the page
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const contentContainer = document.getElementById('content-container');
    const myListingsContainer = document.getElementById('my-listings');
    const myBidsContainer = document.getElementById('my-bids');

    // Get current user data from localStorage
    function getCurrentUserData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{"userid": 1, "email": "guest@example.com", "username": "Guest"}');
        // console.log("Retrieved user data from localStorage:", userData);
        return userData;
    }

    // Get current user ID
    function getCurrentUserId() {
        const userData = getCurrentUserData();
        return userData.userid || userData.id || 1;
    }

    // Show error message
    function showError(message) {
        loadingIndicator.classList.add('hidden');
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    // Create a listing card element
    function createListingCard(listing) {
        const template = document.getElementById('listing-card-template');
        const clone = document.importNode(template.content, true);

        // Set basic listing info
        clone.querySelector('.listing-title').textContent = listing.name;
        clone.querySelector('.listing-id').textContent = `ID: ${listing.listing_id}`;

        // Set organ type with proper fallbacks
        const organTypeElement = clone.querySelector('.listing-organ-type');
        if (organTypeElement) {
            // Check for organ type in different possible locations
            const organType = listing.organ_type || 
                             (listing.organ && listing.organ.type) || 
                             listing.organType || 
                             'Unknown';
            organTypeElement.textContent = `Organ: ${organType}`;
        }

        // Set listing image
        const imageElement = clone.querySelector('.listing-image');
        if (imageElement) {
            // Handle image loading
            if (listing.image && listing.image !== 'default-organ.jpg') {
                // Use a function to load the image asynchronously
                loadListingImage(listing.image)
                    .then(imageUrl => {
                        imageElement.src = imageUrl;
                    })
                    .catch(error => {
                        console.error('Failed to load image:', error);
                        imageElement.src = 'images/default-organ.jpg';
                    });
            } else {
                imageElement.src = 'images/default-organ.jpg';
            }
            
            imageElement.alt = listing.name;
        }

        // Set status badge based on expiry and resolution status
        const currentTime = new Date();
        const expiryTime = new Date(listing.time_end);
        const isActive = currentTime < expiryTime && !listing.is_resolved;

        const statusElement = clone.querySelector('.listing-status');
        
        if (isActive) {
            // For active listings
            statusElement.textContent = 'Active';
            statusElement.classList.add('status-active', 'bg-green-100', 'text-green-800');
        } else {
            // For ended listings
            if (listing.resolution_status) {
                // If we have resolution status, show it
                let statusText = 'Ended';
                let statusClass = 'bg-gray-300 text-gray-700';
                
                // Add a separate resolution badge if needed
                const statusContainer = statusElement.parentNode;
                const resolutionBadge = document.createElement('span');
                resolutionBadge.classList.add('ml-1', 'px-1', 'py-0.5', 'rounded', 'text-xxs', 'font-medium');
                
                // Set styles based on resolution type
                switch(listing.resolution_status) {
                    case 'early':
                        resolutionBadge.textContent = '(Early)';
                        resolutionBadge.classList.add('bg-yellow-100', 'text-yellow-800');
                        break;
                    case 'accepted':
                        resolutionBadge.textContent = '(Accepted)';
                        resolutionBadge.classList.add('bg-green-100', 'text-green-800');
                        break;
                    case 'cancelled':
                        resolutionBadge.textContent = '(Cancelled)';
                        resolutionBadge.classList.add('bg-red-100', 'text-red-800');
                        break;
                }
                
                statusElement.textContent = statusText;
                statusElement.classList.add('bg-gray-300', 'text-gray-700');
                statusContainer.appendChild(resolutionBadge);
            } else {
                // Standard ended listing
                statusElement.textContent = 'Ended';
                statusElement.classList.add('bg-gray-300', 'text-gray-700');
            }
        }

        // Set pricing and time data
        clone.querySelector('.listing-start-bid').textContent = `$${listing.start_bid.toLocaleString()}`;
        
        if (listing.current_bid) {
            clone.querySelector('.listing-current-bid').textContent = `$${listing.current_bid.toLocaleString()}`;
        } else {
            clone.querySelector('.listing-current-bid').textContent = 'No bids yet';
        }
        
        clone.querySelector('.listing-end-time').textContent = expiryTime.toLocaleString();
        clone.querySelector('.listing-bids-count').textContent = listing.bids_count;

        // Set up view details button
        const viewDetailsBtn = clone.querySelector('.view-details-btn');
        viewDetailsBtn.addEventListener('click', () => {
            window.location.href = `listing-details.html?id=${listing.listing_id}`;
        });

        return clone;
    }

    // Function to load listing image using apiService
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

    // Create a bid row element
    function createBidRow(listing, bid) {
        const row = document.createElement('tr');
        const currentTime = new Date();
        const expiryTime = new Date(listing.time_end);
        const isActive = currentTime < expiryTime && !listing.is_resolved;

        // Get organ type with proper fallbacks
        const organType = listing.organ_type || 
                         (listing.organ && listing.organ.type) || 
                         listing.organType || 
                         'Unknown';

        // Prepare status display
        let statusHTML = '';
        if (isActive) {
            statusHTML = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>`;
        } else if (listing.resolution_status) {
            // Main status badge
            statusHTML = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-300 text-gray-700">Ended</span>`;
            
            // Resolution type badge
            let resolutionClass = '';
            let resolutionText = '';
            
            switch(listing.resolution_status) {
                case 'early':
                    resolutionClass = 'bg-yellow-100 text-yellow-800';
                    resolutionText = '(Early)';
                    break;
                case 'accepted':
                    resolutionClass = 'bg-green-100 text-green-800';
                    resolutionText = '(Accepted)';
                    break;
                case 'cancelled':
                    resolutionClass = 'bg-red-100 text-red-800';
                    resolutionText = '(Cancelled)';
                    break;
            }
            
            // Add the resolution badge if we have a status
            if (resolutionText) {
                statusHTML += ` <span class="ml-1 px-1 py-0.5 inline-flex text-xxs leading-4 font-medium rounded ${resolutionClass}">${resolutionText}</span>`;
            }
        } else {
            statusHTML = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-300 text-gray-700">Ended</span>`;
        }

        // Add bid status if available
        let bidStatusHTML = '';
        if (bid.status) {
            let statusClass = '';
            let statusText = '';
            
            if (bid.status === 'accepted') {
                statusClass = 'bg-green-100 text-green-800';
                statusText = 'Accepted';
            } else if (bid.status === 'cancelled') {
                statusClass = 'bg-red-100 text-red-800';
                statusText = 'Rejected';
            }
            
            if (statusText) {
                bidStatusHTML = ` <span class="ml-1 px-1 py-0.5 inline-flex text-xxs leading-4 font-medium rounded ${statusClass}">${statusText}</span>`;
            }
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${listing.name}</div>
                <div class="text-sm text-gray-500">ID: ${listing.listing_id}</div>
                <div class="text-sm text-gray-500">Organ: ${organType}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusHTML}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $${bid.bid_amt.toLocaleString()}${bidStatusHTML}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${expiryTime.toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="window.location.href='listing-details.html?id=${listing.listing_id}'" 
                        class="text-indigo-600 hover:text-indigo-900">
                    View Details
                </button>
            </td>
        `;

        return row;
    }

    // Fetch and display user's listings and bids
    async function fetchUserListingsAndBids() {
        try {
            const currentUserId = getCurrentUserId();

            // Fetch all listings with bids
            const listings = await apiService.getListingsWithBids();

            // Check all listings for resolutions before filtering
            await checkResolutionsForListings(listings);

            // Filter listings owned by the current user
            const userListings = listings.filter(listing => listing.owner_id === currentUserId);

            // Filter listings where the user has placed bids
            const userBids = listings.filter(listing => 
                listing.bids && listing.bids.some(bid => bid.bidder_id === currentUserId)
            );

            // Clear existing content
            myListingsContainer.innerHTML = '';
            myBidsContainer.innerHTML = '';

            // Render user's listings
            if (userListings.length > 0) {
                userListings.forEach(listing => {
                    myListingsContainer.appendChild(createListingCard(listing));
                });
            } else {
                myListingsContainer.innerHTML = `
                    <div class="col-span-full text-center py-8 text-gray-500">
                        You haven't created any listings yet.
                    </div>
                `;
            }

            // Render user's bids in table format
            if (userBids.length > 0) {
                const tableHTML = `
                    <div class="w-full overflow-x-auto">
                        <table class="w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                        Listing
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                        Status
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                        Your Bid
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                                        End Time
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${userBids.map(listing => {
                                    const userBid = listing.bids.find(bid => bid.bidder_id === currentUserId);
                                    return createBidRow(listing, userBid).outerHTML;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                myBidsContainer.innerHTML = tableHTML;
            } else {
                myBidsContainer.innerHTML = `
                    <div class="w-full text-center py-8 text-gray-500">
                        You haven't placed any bids yet.
                    </div>
                `;
            }

            // Hide loading indicator and show content
            loadingIndicator.classList.add('hidden');
            contentContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error fetching user listings and bids:', error);
            showError(error.message || 'Failed to load your listings and bids');
        }
    }

    // Check all listings for resolution status
    async function checkResolutionsForListings(listings) {
        const resolutionPromises = [];
        
        for (const listing of listings) {
            const checkPromise = async () => {
                try {
                    const resolutionServiceUrl = 'http://localhost:8000/resolve';
                    const res = await fetch(`${resolutionServiceUrl}/api/resolutions/listing/${listing.listing_id}`);
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
                        
                        // Mark bids with proper status
                        if (listing.bids && listing.bids.length > 0) {
                            // Find the winning bid
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
                        // If no resolution is found, compute status based on time
                        const isExpired = new Date(listing.time_end) <= new Date();
                        listing.status = isExpired ? 'ended' : 'active';
                    }
                } catch (error) {
                    // If error fetching resolution, compute status based on time
                    const isExpired = new Date(listing.time_end) <= new Date();
                    listing.status = isExpired ? 'ended' : 'active';
                }
                
                // Fetch organ type if not already available
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
            };
            
            // Add the promise to our array
            resolutionPromises.push(checkPromise());
        }
        
        // Wait for all resolution checks to complete
        await Promise.all(resolutionPromises);
    }

    // Initialize the page
    fetchUserListingsAndBids();
}); 