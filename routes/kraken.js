const express = require('express');
const router = express.Router();
const KrakenClient = require('kraken-api');
const session = require('express-session');

// Add session middleware
router.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Store Kraken client instances for each session
const krakenClients = new Map();

// Authenticate with Kraken API keys
router.post('/authenticate', async (req, res) => {
    try {
        const { apiKey, apiSecret } = req.body;
        
        // Create a new Kraken client with the provided credentials
        const krakenClient = new KrakenClient(apiKey, apiSecret);
        
        // Test the credentials by making a simple API call
        await krakenClient.api('Balance');
        
        // Store the credentials in session
        req.session.krakenCredentials = { apiKey, apiSecret };
        krakenClients.set(req.sessionID, krakenClient);
        
        res.json({ success: true, message: 'Authentication successful' });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid API credentials' });
    }
});

// Check authentication status
router.get('/auth-status', (req, res) => {
    const isAuthenticated = !!req.session.krakenCredentials;
    res.json({ isAuthenticated });
});

// Logout/clear credentials
router.post('/logout', (req, res) => {
    if (krakenClients.has(req.sessionID)) {
        krakenClients.delete(req.sessionID);
    }
    req.session.destroy();
    res.json({ success: true });
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    const client = krakenClients.get(req.sessionID);
    if (!client) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    req.krakenClient = client;
    next();
};

// Get account balance (now protected)
router.get('/balance', requireAuth, async (req, res) => {
    try {
        const balance = await req.krakenClient.api('Balance');
        res.json(balance.result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get comprehensive trade history with PnL calculations (now protected)
router.get('/pnl', requireAuth, async (req, res) => {
    try {
        // Get all trades with pagination
        let allTrades = [];
        let offset = 0;
        let hasMoreTrades = true;

        // Fetch all trades using pagination
        while (hasMoreTrades) {
            const tradesResponse = await req.krakenClient.api('TradesHistory', { ofs: offset });
            const trades = Object.values(tradesResponse.result.trades);
            
            if (trades.length === 0) {
                hasMoreTrades = false;
            } else {
                allTrades = allTrades.concat(trades);
                offset += trades.length;
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Get unique trading pairs from trades
        const tradingPairs = new Set(allTrades.map(trade => trade.pair));
        const pairString = Array.from(tradingPairs).join(',');

        // Get current prices for all traded pairs
        const ticker = await req.krakenClient.api('Ticker', { pair: pairString });
        
        // Process trades and calculate PnL
        const pnlByAsset = {};

        allTrades.forEach(trade => {
            const asset = trade.pair;
            if (!pnlByAsset[asset]) {
                pnlByAsset[asset] = {
                    totalBought: 0,
                    totalSold: 0,
                    totalVolume: 0,
                    realizedPnL: 0,
                    trades: [],
                    avgBuyPrice: 0
                };
            }

            const cost = parseFloat(trade.cost);
            const volume = parseFloat(trade.vol);
            const price = parseFloat(trade.price);

            if (trade.type === 'buy') {
                pnlByAsset[asset].totalBought += cost;
                pnlByAsset[asset].totalVolume += volume;
            } else {
                pnlByAsset[asset].totalSold += cost;
                pnlByAsset[asset].totalVolume -= volume;
                
                // Calculate realized PnL for sells
                if (pnlByAsset[asset].totalVolume > 0) {
                    const avgBuyPrice = pnlByAsset[asset].totalBought / pnlByAsset[asset].totalVolume;
                    pnlByAsset[asset].realizedPnL += (price - avgBuyPrice) * volume;
                }
            }

            // Update average buy price
            if (pnlByAsset[asset].totalVolume > 0) {
                pnlByAsset[asset].avgBuyPrice = pnlByAsset[asset].totalBought / pnlByAsset[asset].totalVolume;
            }

            pnlByAsset[asset].trades.push({
                time: new Date(trade.time * 1000).toISOString(),
                type: trade.type,
                price: price,
                volume: volume,
                cost: cost,
                fee: trade.fee
            });
        });

        // Add current market prices and unrealized PnL
        for (const asset in pnlByAsset) {
            if (ticker.result[asset]) {
                const currentPrice = parseFloat(ticker.result[asset].c[0]);
                pnlByAsset[asset].currentPrice = currentPrice;
                
                // Calculate unrealized PnL based on current position and average buy price
                if (pnlByAsset[asset].totalVolume > 0) {
                    pnlByAsset[asset].unrealizedPnL = 
                        (currentPrice - pnlByAsset[asset].avgBuyPrice) * pnlByAsset[asset].totalVolume;
                } else {
                    pnlByAsset[asset].unrealizedPnL = 0;
                }
            }

            // Sort trades by time (most recent first)
            pnlByAsset[asset].trades.sort((a, b) => new Date(b.time) - new Date(a.time));
        }

        res.json(pnlByAsset);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Keep the original trades endpoint for reference
router.get('/trades', async (req, res) => {
    try {
        const trades = await kraken.api('TradesHistory');
        res.json(trades.result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 