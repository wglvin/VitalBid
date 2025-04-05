document.addEventListener('DOMContentLoaded', function() {
    const createListingForm = document.getElementById('create-listing-form');
    const organSelect = document.getElementById('organ-id');
    const formError = document.getElementById('form-error');
    const imageInput = document.getElementById('listing-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    // Image preview functionality
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showError('Image size must be less than 5MB');
                imageInput.value = '';
                imagePreview.classList.add('hidden');
                return;
            }

            // Validate file type
            if (!file.type.match('image.*')) {
                showError('Please upload an image file (JPG, PNG, or GIF)');
                imageInput.value = '';
                imagePreview.classList.add('hidden');
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.classList.add('hidden');
        }
    });
    
    // Set minimum date for expiry date (1 minute from now)
    const expiryDateInput = document.getElementById('expiry-date');
    
    // Get current time (already in local timezone)
    const now = new Date();
    
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
    
    // Format dates properly for input field using local time
    const formattedMinDate = formatDateForInput(minExpiryTime);
    expiryDateInput.min = formattedMinDate;
    
    // Set default value to current time + 1 day (common listing duration)
    const defaultExpiryTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Add 1 day
    
    const formattedDefaultDate = formatDateForInput(defaultExpiryTime);
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
            
            // When we parse a date string without timezone info, it's interpreted as local time
            const expiryDate = new Date(expiryDateValue);
            // Compare using timestamps for accurate comparison regardless of timezone
            // console.log("Comparing timestamps:");
            // console.log("- Expiry timestamp:", expiryDate.getTime());
            // console.log("- Min expiry timestamp:", minExpiryTime.getTime());
            // console.log("- Difference (ms):", expiryDate.getTime() - minExpiryTime.getTime());
            
            // Verify expiry date is at least 1 minute in the future
            if (expiryDate.getTime() <= minExpiryTime.getTime()) {
                showError('Expiry time must be at least 1 minute from now.');
                return;
            }
            
            
            // For backend submission, use ISO format (converts to UTC)
            const timeEndISO = expiryDate.toISOString();
            // Get user data from localStorage
            const userData = JSON.parse(localStorage.getItem("userData") || '{"userid": 1, "email": "guest@example.com", "username": "Guest"}');
            // Store the actual email in localStorage for debugging
            localStorage.setItem("lastUsedEmail", userData.email);

            // Handle image upload first
            const imageFile = imageInput.files[0];
            if (!imageFile) {
                showError('Please upload an image for the listing');
                return;
            }

            try {
                // Use apiService to upload the image
                const uploadResult = await apiService.uploadImage(imageFile);
                // Now create the listing with the image filename
                const listingData = {
                    name: document.getElementById('listing-name').value,
                    description: document.getElementById('listing-description').value,
                    organ_id: document.getElementById('organ-id').value,
                    start_bid: parseFloat(document.getElementById('starting-bid').value),
                    time_end: timeEndISO,
                    status: "active",
                    owner_id: userData.userid,
                    image: uploadResult.filename // Add the uploaded image filename
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
                
                try {
                    const response = await apiService.addListing(listingData);
                    
                    // Redirect to the listing page using the correct ID property
                    window.location.href = "index.html";
                } catch (error) {
                    console.error('Error creating listing:', error);
                    showError(error.message || 'Failed to create listing');
                    
                    // Try to clean up the uploaded image if listing creation fails
                    try {
                        if (uploadResult && uploadResult.filename) {
                            await apiService.deleteImage(uploadResult.filename);
                        }
                    } catch (cleanupError) {
                        console.error("Failed to clean up image:", cleanupError);
                    }
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                showError(error.message || 'Failed to upload image. Please try again.');
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