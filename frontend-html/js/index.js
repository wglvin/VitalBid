// Event listener for tab clicks
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', async function() {
        // Remove selected class from all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('selected'));
        
        // Add selected class to this tab
        this.classList.add('selected');
        
        // Get the filter value
        const filter = this.getAttribute('data-filter') || 'all';
        
        // Show loading state
        showLoading(true);
        
        try {
            // Get all listings
            const allListings = await apiService.getListingsWithBids();
            
            // Check for resolutions before filtering
            await checkResolutionsBeforeFilter(allListings);
            
            // Filter based on tab
            let filteredListings = [];
            
            if (filter === 'active') {
                filteredListings = allListings.filter(listing => !isExpired(listing));
            } else if (filter === 'ended') {
                filteredListings = allListings.filter(listing => isExpired(listing));
            } else {
                filteredListings = allListings; // 'all' tab shows everything
            }
            
            // Render filtered listings
            await renderListings(filteredListings);
            
            // Hide loading state
            showLoading(false);
        } catch (error) {
            console.error('Error filtering listings:', error);
            listingsContainer.innerHTML = `<p class="text-center py-8 text-red-500">Failed to load listings: ${error.message}</p>`;
            showLoading(false);
        }
    });
}); 