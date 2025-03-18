import React from 'react';

const Navbar = () => {
  return (
    <nav>
      <div className="nav-wrapper">
        <a href="/" className="brand-logo">Organ Marketplace</a>
        <ul id="nav-mobile" className="right">
          <li><a href="/marketplace">Marketplace</a></li>
          <li><a href="/my-bids">My Bids</a></li>
          <li><a href="/payment">Payment</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;