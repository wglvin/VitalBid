document.addEventListener('DOMContentLoaded', function() {
    const createListingForm = document.getElementById('create-listing-form');
    const organSelect = document.getElementById('organ-id');
    const formError = document.getElementById('form-error');
    
    // Set minimum date for expiry date
    const expiryDateInput = document.getElementById('expiry-date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format date for datetime-local input
    const formattedDate = tomorrow.toISOString().slice(0, 16);
    expiryDateInput.min = formattedDate;
    
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
            const listingData = {
                name: document.getElementById('listing-name').value,
                description: document.getElementById('listing-description').value,
                organ_id: document.getElementById('organ-id').value,
                start_bid: parseFloat(document.getElementById('starting-bid').value),
                time_end: new Date(document.getElementById('expiry-date').value).toISOString(),
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
            
            // Redirect to the listing page
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