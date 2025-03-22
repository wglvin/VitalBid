const axios = require('axios');

const BASE_URL = 'http://localhost:3003';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Sleep function to wait between retries
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to check if service is available
const checkServiceAvailable = async () => {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

// Test function with retry logic
async function testNotifications() {
  console.log('--- Testing Notification Service ---');
  
  // Check if service is available
  console.log('Checking if notification service is available...');
  let available = await checkServiceAvailable();
  let retries = 0;
  
  while (!available && retries < MAX_RETRIES) {
    console.log(`Service not available, retrying in ${RETRY_DELAY/1000} seconds... (${retries + 1}/${MAX_RETRIES})`);
    await sleep(RETRY_DELAY);
    available = await checkServiceAvailable();
    retries++;
  }
  
  if (!available) {
    console.error(`
ERROR: Could not connect to the notification service at ${BASE_URL}
Please ensure:
1. The notification service is running
2. It's accessible on port 3003
3. There are no network issues or firewall rules blocking access

To start the service:
- Using docker: docker-compose up -d notification
- Locally: cd notification && node index.js
`);
    return;
  }
  
  console.log('Service is available! Running tests...');
  
  try {
    // Test 1: Health Check
    console.log('\n1. Testing Health Check:');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('Health Status:', healthResponse.data);
    
    // Test 2: Direct Notification
    console.log('\n2. Testing Direct Notification:');
    const directResponse = await axios.post(`${BASE_URL}/notify`, {
      userId: '1',
      message: 'Test direct notification message'
    });
    console.log('Direct Notification Response:', directResponse.data);
    
    // Test 3: Email with Direct Address
    console.log('\n3. Testing Email with Direct Address:');
    const emailResponse = await axios.post(`${BASE_URL}/notify/email`, {
      email: 'moses.kng.2023@smu.edu.sg',
      subject: 'Test Email Subject',
      text: 'This is a test email body sent directly to an email address.'
    });
    console.log('Email Response:', emailResponse.data);
    
    // Test 4: Email with User ID
    console.log('\n4. Testing Email with User ID:');
    const userEmailResponse = await axios.post(`${BASE_URL}/notify/email/user/2`, {
      subject: 'Test Email for User 2',
      text: 'This is a test email body for user ID 2.'
    });
    console.log('User Email Response:', userEmailResponse.data);
    
    console.log('\n--- All Tests Completed Successfully! ---');
  } catch (error) {
    console.error('\n--- Test Failed ---');
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error(`Server responded with error status: ${error.response.status}`);
      console.error('Error details:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. The service might be running but not responding properly.');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    console.error('\nTroubleshooting steps:');
    console.error('1. Check if notification service is running');
    console.error('2. Verify the service is listening on port 3000 inside the container');
    console.error('3. Ensure port mapping is correct in docker-compose.yaml (3003:3000)');
    console.error('4. Try accessing the service directly in a browser at http://localhost:3003/health');
  }
}

// Run tests
testNotifications();
