document.addEventListener('DOMContentLoaded', function() {
    const createListingForm = document.getElementById('create-listing-form');
    const organSelect = document.getElementById('organ-id');
    const formError = document.getElementById('form-error');
    
    // Set minimum date for expiry date (1 minute from now)
    const expiryDateInput = document.getElementById('expiry-date');
    
    // Get current time in GMT+8
    const now = new Date();
    // Convert to GMT+8 by adding 8 hours (8 * 60 * 60 * 1000 milliseconds)
    const gmt8Offset = 8 * 60 * 60 * 1000;
    const gmt8Now = new Date(now.getTime() + gmt8Offset);
    
    // Set minimum time to 1 minute from now
    const minExpiryTime = new Date(gmt8Now.getTime() + (1 * 60 * 1000)); // Add 1 minute
    
    // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
    const formattedMinDate = minExpiryTime.toISOString().slice(0, 16);
    expiryDateInput.min = formattedMinDate;
    
    // Set default value to current GMT+8 time + 1 day (common listing duration)
    const defaultExpiryTime = new Date(gmt8Now.getTime() + (24 * 60 * 60 * 1000)); // Add 1 day
    const formattedDefaultDate = defaultExpiryTime.toISOString().slice(0, 16);
    expiryDateInput.value = formattedDefaultDate;
    
    // Load organs for dropdown
    async function loadOrgans() {
        try {
            const organs = await apiService.getAllOrgans();
            
            // Populate organ select
            organs.forEach(organ => {
                const option = document.createElement('option');
                option.value = organ.id;
                option.textContent = `${organ.type} - ${organ.description}`;
                organSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading organs:', error);
            showError('Failed to load organs. Please try again later.');
        }
    }
    
    // Handle form submission
    createListingForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Clear previous errors
        hideError();
        
        try {
            // Get input expiry date
            const expiryDateValue = document.getElementById('expiry-date').value;
            const expiryDate = new Date(expiryDateValue);
            
            // Verify expiry date is at least 1 minute in the future
            if (expiryDate <= minExpiryTime) {
                showError('Expiry time must be at least 1 minute from now.');
                return;
            }
            
            const listingData = {
                name: document.getElementById('listing-name').value,
                description: document.getElementById('listing-description').value,
                organ_id: document.getElementById('organ-id').value,
                start_bid: parseFloat(document.getElementById('starting-bid').value),
                time_end: expiryDate.toISOString(),
                status: "active"
            };
            
            // Validate data
            if (!listingData.name) {
                showError('Please enter a listing title');
                return;
            }
            
            if (!listingData.organ_id) {
                showError('Please select an organ');
                return;
            }
            
            if (isNaN(listingData.start_bid) || listingData.start_bid <= 0) {
                showError('Please enter a valid starting bid greater than 0');
                return;
            }
            
            // Submit listing
            const response = await apiService.addListing(listingData);
            
            // Redirect to the listing page using the correct ID property
            window.location.href = `listing-details.html?id=${response.id}`;
        } catch (error) {
            console.error('Error creating listing:', error);
            showError(error.message || 'Failed to create listing');
        }
    });
    
    function showError(message) {
        formError.textContent = message;
        formError.classList.remove('hidden');
    }
    
    function hideError() {
        formError.textContent = '';
        formError.classList.add('hidden');
    }
    
    // Initialize the page
    loadOrgans();
}); 