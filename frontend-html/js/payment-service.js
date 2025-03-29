document.addEventListener("DOMContentLoaded", function () {
    const placeBidBtn = document.getElementById("placeBidBtn");
  
    if (placeBidBtn) {
      placeBidBtn.addEventListener("click", function () {
        const amount = document.getElementById("bid-amount").value;
        const title = document.getElementById("listing-title").textContent;
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("id");
  
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
          const errorEl = document.getElementById("bid-error");
          errorEl.textContent = "Please enter a valid bid amount";
          errorEl.classList.remove("hidden");
          return;
        }
  
        const query = new URLSearchParams({
          listingId: id,
          listingTitle: title,
          amount: parseFloat(amount)
        }).toString();
  
        window.location.href = `payment.html?${query}`;
      });
    }
  });