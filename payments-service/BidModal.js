// BidModal.js
const BidModal = ({ listingId, onClose, onBidSubmit }) => {
    const [amount, setAmount] = useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      onBidSubmit(listingId, parseFloat(amount));
    };
    
    return (
      <div className="modal">
        <form onSubmit={handleSubmit}>
          <h2>Place Your Bid</h2>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="Enter bid amount"
            required
          />
          <button type="submit">Submit Bid</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    );
  };