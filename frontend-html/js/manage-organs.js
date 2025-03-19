document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const organForm = document.getElementById('organ-form');
    const organTypeInput = document.getElementById('organ-type');
    const organDescriptionInput = document.getElementById('organ-description');
    const successAlert = document.getElementById('success-alert');
    const successMessage = document.getElementById('success-message');
    const errorAlert = document.getElementById('error-alert');
    const errorMessage = document.getElementById('error-message');
    const loadingIndicator = document.getElementById('loading-indicator');
    const emptyMessage = document.getElementById('empty-message');
    const organsTableContainer = document.getElementById('organs-table-container');
    const organsTableBody = document.getElementById('organs-table-body');

    // Fetch all organs
    async function fetchOrgans() {
        try {
            // Show loading indicator
            loadingIndicator.classList.remove('hidden');
            emptyMessage.classList.add('hidden');
            organsTableContainer.classList.add('hidden');

            // Fetch organs from API
            const organs = await apiService.getAllOrgans();

            // Hide loading indicator
            loadingIndicator.classList.add('hidden');

            // If no organs found, show empty message
            if (organs.length === 0) {
                emptyMessage.classList.remove('hidden');
                return;
            }

            // Show table and render organs
            organsTableContainer.classList.remove('hidden');
            renderOrgans(organs);
        } catch (error) {
            console.error('Failed to fetch organs:', error);
            
            // Hide loading indicator and show error
            loadingIndicator.classList.add('hidden');
            showError('Failed to load organs. Please try again.');
        }
    }

    // Render organs in the table
    function renderOrgans(organs) {
        // Clear existing table rows
        organsTableBody.innerHTML = '';

        // Sort organs alphabetically by type
        organs.sort((a, b) => a.type.localeCompare(b.type));

        // Create a row for each organ
        organs.forEach(organ => {
            const row = document.createElement('tr');
            
            // Organ type cell
            const typeCell = document.createElement('td');
            typeCell.className = 'px-6 py-4 whitespace-nowrap';
            const typeText = document.createElement('div');
            typeText.className = 'text-sm font-medium text-gray-900';
            typeText.textContent = organ.type;
            typeCell.appendChild(typeText);
            
            // Description cell
            const descriptionCell = document.createElement('td');
            descriptionCell.className = 'px-6 py-4 whitespace-nowrap';
            const descriptionText = document.createElement('div');
            descriptionText.className = 'text-sm text-gray-500';
            descriptionText.textContent = organ.description || '-';
            descriptionCell.appendChild(descriptionText);
            
            // ID cell
            const idCell = document.createElement('td');
            idCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            idCell.textContent = organ.id;
            idCell.title = organ.id;
            
            // Append cells to row
            row.appendChild(typeCell);
            row.appendChild(descriptionCell);
            row.appendChild(idCell);
            
            // Append row to table body
            organsTableBody.appendChild(row);
        });
    }

    // Handle form submission
    organForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Clear any existing alerts
        hideAlerts();
        
        // Get form data
        const formData = {
            type: organTypeInput.value.trim(),
            description: organDescriptionInput.value.trim()
        };
        
        // Validate form
        if (!formData.type) {
            showError('Organ type is required');
            return;
        }
        
        try {
            // Submit the form
            await apiService.addOrgan(formData);
            
            // Show success message
            showSuccess('Organ added successfully!');
            
            // Reset form
            organForm.reset();
            
            // Refresh the organ list
            fetchOrgans();
        } catch (error) {
            console.error('Error creating organ:', error);
            showError('Failed to create organ. It may already exist.');
        }
    });

    // Show success alert
    function showSuccess(message) {
        successMessage.textContent = message;
        successAlert.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successAlert.classList.add('hidden');
        }, 5000);
    }

    // Show error alert
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('hidden');
    }

    // Hide all alerts
    function hideAlerts() {
        successAlert.classList.add('hidden');
        errorAlert.classList.add('hidden');
    }

    // Initialize page by fetching organs
    fetchOrgans();
}); 