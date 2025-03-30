document.addEventListener('DOMContentLoaded', function() {
    const createListingForm = document.getElementById('create-listing-form');
    const organSelect = document.getElementById('organ-id');
    const formError = document.getElementById('form-error');
    
    // Set minimum date for expiry date (1 minute from now)
    const expiryDateInput = document.getElementById('expiry-date');
    
    // Get current time (already in local timezone)
    const now = new Date();
    console.log("Current time:", now.toString());
    
    // Function to format date for datetime-local input that preserves local timezone
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Set minimum time to 1 minute from now
    const minExpiryTime = new Date(now.getTime() + (60 * 1000)); // Add 1 minute
    console.log("Minimum expiry time:", minExpiryTime.toString());
    
    // Format dates properly for input field using local time
    const formattedMinDate = formatDateForInput(minExpiryTime);
    console.log("Formatted min date (local):", formattedMinDate);
    expiryDateInput.min = formattedMinDate;
    
    // Set default value to current time + 1 day (common listing duration)
    const defaultExpiryTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Add 1 day
    console.log("Default expiry time:", defaultExpiryTime.toString());
    
    const formattedDefaultDate = formatDateForInput(defaultExpiryTime);
    console.log("Formatted default date (local):", formattedDefaultDate);
    expiryDateInput.value = formattedDefaultDate;
    
    // Load organs for dropdown
    async function loadOrgans() {
        try {
            const organs = await apiService.getAllOrgans();
            console.log("Loaded organs:", organs.length ? "✓" : "None found");
            
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
        console.log("Form submission started");
        
        // Clear previous errors
        hideError();
        
        try {
            // Get input expiry date
            const expiryDateValue = document.getElementById('expiry-date').value;
            console.log("Raw expiry date from input:", expiryDateValue);
            
            // When we parse a date string without timezone info, it's interpreted as local time
            const expiryDate = new Date(expiryDateValue);
            console.log("Parsed expiry date:", expiryDate.toString());
            
            // Compare using timestamps for accurate comparison regardless of timezone
            console.log("Comparing timestamps:");
            console.log("- Expiry timestamp:", expiryDate.getTime());
            console.log("- Min expiry timestamp:", minExpiryTime.getTime());
            console.log("- Difference (ms):", expiryDate.getTime() - minExpiryTime.getTime());
            
            // Verify expiry date is at least 1 minute in the future
            if (expiryDate.getTime() <= minExpiryTime.getTime()) {
                console.log("VALIDATION FAILED: Date not far enough in future");
                showError('Expiry time must be at least 1 minute from now.');
                return;
            }
            
            console.log("Date validation passed");
            
            // For backend submission, use ISO format (converts to UTC)
            const timeEndISO = expiryDate.toISOString();
            console.log("Final ISO time_end value:", timeEndISO);
            
            // Get user data from localStorage
            const userData = JSON.parse(localStorage.getItem("userData") || '{"userid": 1, "email": "guest@example.com", "username": "Guest"}');
            console.log("Using user data for listing creation:", userData);
            
            // Store the actual email in localStorage for debugging
            localStorage.setItem("lastUsedEmail", userData.email);
            console.log("Storing email in localStorage for debugging:", userData.email);
            

            
            const listingData = {
                name: document.getElementById('listing-name').value,
                description: document.getElementById('listing-description').value,
                organ_id: document.getElementById('organ-id').value,
                start_bid: parseFloat(document.getElementById('starting-bid').value),
                time_end: timeEndISO,
                status: "active",
                owner_id: userData.userid,
            };
            
            console.log("Submitting listing data:", listingData);
            
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
            console.log("Calling apiService.addListing...");
            
            try {
                const response = await apiService.addListing(listingData);
                console.log("API response:", response);
                
                // Redirect to the listing page using the correct ID property
                window.location.href = `listing-details.html?id=${response.id}`;
            } catch (error) {
                console.error('Error creating listing:', error);
                showError(error.message || 'Failed to create listing');
            }
        } catch (error) {
            console.error('Error creating listing:', error);
            showError(error.message || 'Failed to create listing');
        }
    });
    
    function showError(message) {
        console.error("Error shown to user:", message);
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