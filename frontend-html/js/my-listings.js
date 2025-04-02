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
        console.log("Retrieved user data from localStorage:", userData);
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

        // Set status badge based on expiry
        const currentTime = new Date();
        const expiryTime = new Date(listing.time_end);
        const isActive = currentTime < expiryTime;

        const statusElement = clone.querySelector('.listing-status');
        statusElement.textContent = isActive ? 'Active' : 'Ended';
        statusElement.classList.remove('status-active', 'status-ended');
        statusElement.classList.add(isActive ? 'status-active' : 'status-ended');

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
        const isActive = currentTime < expiryTime;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${listing.name}</div>
                <div class="text-sm text-gray-500">ID: ${listing.listing_id}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${isActive ? 'Active' : 'Ended'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $${bid.bid_amt.toLocaleString()}
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
            console.log("Fetching listings and bids for user ID:", currentUserId);

            // Fetch all listings with bids
            const listings = await apiService.getListingsWithBids();
            console.log("All listings received:", listings);

            // Filter listings owned by the current user
            const userListings = listings.filter(listing => listing.owner_id === currentUserId);
            console.log("User's listings:", userListings);

            // Filter listings where the user has placed bids
            const userBids = listings.filter(listing => 
                listing.bids && listing.bids.some(bid => bid.bidder_id === currentUserId)
            );
            console.log("User's bids:", userBids);

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

    // Initialize the page
    fetchUserListingsAndBids();
}); 