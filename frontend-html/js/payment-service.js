document.addEventListener("DOMContentLoaded", function () {
    const placeBidBtn = document.getElementById("placeBidBtn");
  
    if (placeBidBtn) {
      placeBidBtn.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default form submission
        
        const bidAmountInput = document.getElementById("bid-amount");
        const amount = parseFloat(bidAmountInput.value);
        const errorEl = document.getElementById("bid-error");
        const title = document.getElementById("listing-title").textContent;
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get("id");

        // Basic amount validation
        if (!amount || isNaN(amount) || amount <= 0) {
          errorEl.textContent = "Please enter a valid bid amount";
          errorEl.classList.remove("hidden");
          return;
        }

        // Get current highest bid from the frontend
        const formCurrentBid = document.getElementById("form-current-bid");
        const currentBidText = formCurrentBid.textContent;
        // Extract the number from the text (removes the "$" and any "(starting bid)" text)
        const currentHighestBid = parseFloat(currentBidText.replace(/[^0-9.]/g, ''));

        // Validate that the new bid is higher than the current highest bid
        if (amount <= currentHighestBid) {
          errorEl.textContent = `Your bid must be higher than the current highest bid ($${currentHighestBid.toLocaleString()})`;
          errorEl.classList.remove("hidden");
          return;
        }

        // If validation passes, proceed with payment redirect
        const query = new URLSearchParams({
          listingId: listingId,
          listingTitle: title,
          amount: amount
        }).toString();

        window.location.href = `payment.html?${query}`;
      });
    }
  });