# Organ Donation Marketplace - HTML Frontend

This is an HTML/CSS/JavaScript-based frontend for the Organ Donation Marketplace application. It provides a UI for working with the microservices backend.

## Features

- View all organ listings with filtering by status (active/ended)
- View listing details with bid history
- Place bids on active listings
- Create new organ listings
- Manage organ types for listings

## File Structure

- `index.html` - Main listings page
- `listing-details.html` - Listing details page with bidding functionality
- `create-listing.html` - Form for creating new listings
- `manage-organs.html` - Interface for managing organ types
- `/css/styles.css` - Custom CSS styles
- `/js/` - JavaScript files:
  - `api-service.js` - Service for API communication with the backend
  - `listings.js` - Logic for the listings page
  - `listing-details.js` - Logic for the listing details page
  - `create-listing.js` - Logic for the create listing form
  - `manage-organs.js` - Logic for the manage organs page

## Setup and Running

1. Make sure the backend microservices are running.
2. Ensure Kong API Gateway is configured and running on `http://localhost:8000`.
3. Host these HTML files on a web server or open them directly in a browser.

## API Integration

This frontend integrates with the following backend microservices through Kong API Gateway:

- **Listing Service**: For listing management and organ type management
- **Bidding Service**: For bid operations
- **Composite Service**: For aggregated listing data with bids

## Notes

- This is a static HTML implementation that replaces the React-based frontend
- Styling is done with TailwindCSS for a clean, responsive design
- The frontend uses the same API routes as the original React frontend 