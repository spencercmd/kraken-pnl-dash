# Kraken PnL Dashboard

A real-time profit and loss (PnL) tracking dashboard for Kraken cryptocurrency exchange. This application provides a user-friendly interface to monitor your trading performance, calculate realized and unrealized profits, and view your trading history.

## Features

- 🔐 Secure API key authentication
- 💰 Real-time PnL calculations
- 📊 Comprehensive trading metrics:
  - Total PnL (Realized + Unrealized)
  - Realized PnL from completed trades
  - Unrealized PnL for current positions
  - Current positions and their market value
  - Average buy price per asset
  - Recent trade history
- 🔄 Auto-refresh functionality
- 📱 Responsive design for desktop and mobile

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)
- A Kraken account with API keys ([Create here](https://www.kraken.com/u/security/api))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kraken-pnl-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
SESSION_SECRET=your_session_secret_here
PORT=3000 # Optional, defaults to 3000
```

## Running the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The application will be available at `http://localhost:3000` (or your configured PORT).

## Using the Dashboard

1. **Authentication**
   - Click "Authenticate with Kraken" in the top right
   - Enter your Kraken API Key and Secret
   - API keys should have the following permissions:
     - Query Funds
     - Query Open Orders & Trades
     - Query Closed Orders & Trades

2. **Viewing PnL Data**
   - After authentication, your PnL data will automatically load
   - Each asset you've traded will have its own card showing:
     - Total PnL
     - Realized PnL
     - Unrealized PnL
     - Current Position
     - Current Market Price
     - Average Buy Price
     - Recent Trades

3. **Refreshing Data**
   - Click the "Refresh Data" button to get the latest prices and calculations
   - Logout button is available to clear your session

## Security Features

- API keys are stored only in session memory
- Session data is cleared on logout
- No sensitive data is stored on the server
- Secure cookie handling
- Rate limiting on API requests

## Technical Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **API Integration**: Kraken API
- **Session Management**: express-session
- **Data Processing**: Real-time calculations for:
  - Position tracking
  - PnL calculations
  - Trade history aggregation

## Limitations

- Trade history is limited by Kraken API's pagination
- Price updates require manual refresh
- Historical price data is based on trade execution prices

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.