// ItemListing.js
const ItemListing = ({ item }) => (
    <div className="item-card">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <p>Current Highest Bid: ${item.currentBid}</p>
      <button>Place Bid</button>
    </div>
  );