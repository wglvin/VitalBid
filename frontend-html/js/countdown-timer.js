// Shared countdown timer functionality
function createCountdown(expiryDateString, elementToUpdate, options = {}) {
    // Parse the expiry date
    const expiryDate = new Date(expiryDateString);
    
    // Function to update the countdown
    function updateCountdown() {
        const now = new Date();
        const timeLeftMs = expiryDate.getTime() - now.getTime();
        
        if (timeLeftMs <= 0) {
            // Auction has ended
            elementToUpdate.textContent = "Auction ended";
            elementToUpdate.classList.remove('text-yellow-500', 'animate-pulse');
            elementToUpdate.classList.add('text-red-600');
            clearInterval(countdownInterval);
            
            // Refresh the page after a short delay if specified
            if (options.refreshOnEnd) {
                setTimeout(() => {
                    location.reload();
                }, 3000);
            }
            return;
        }
        
        // Calculate days, hours, minutes, seconds
        const totalSeconds = Math.floor(timeLeftMs / 1000);
        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        
        // Format the time remaining - ALWAYS include seconds
        let timeText = "";
        if (days > 0) {
            timeText += `${days}d `;
        }
        if (hours > 0 || days > 0) {
            timeText += `${hours}h `;
        }
        if (minutes > 0 || hours > 0 || days > 0) {
            timeText += `${minutes}m `;
        }
        // Always show seconds
        timeText += `${seconds}s`;
        
        // Display the time remaining
        elementToUpdate.textContent = options.showPrefix ? `Time left: ${timeText}` : timeText;
        
        // Change color to yellow for last 5 seconds
        if (totalSeconds <= 5) {
            elementToUpdate.classList.add('text-yellow-500', 'animate-pulse');
        } else {
            elementToUpdate.classList.remove('text-yellow-500', 'animate-pulse');
        }
    }
    
    // Update immediately and then every second
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    
    // Store the interval ID so we can clear it if needed
    return countdownInterval;
} 