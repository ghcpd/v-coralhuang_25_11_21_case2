# UI Bug: The Clipped Dropdown

## Problem Description
The dropdown menu inside the "Settings" card is being clipped/cut off. Users cannot see the last few items (especially "Delete Account").

## Setup Environment
1. Install dependencies:
   ```bash
   npm install
   ```

## Running the App
1. Start the server:
   ```bash
   npm start
   ```
2. Open `http://localhost:8080` in your browser.

## Testing the Fix
We have provided an automated test script using Puppeteer to verify if the bug is fixed.

1. Run the test:
   ```bash
   npm test
   ```

If the test passes, it means the dropdown is no longer clipped by the parent container.
