# WalletConnect Setup Guide

To enable full wallet functionality including WalletConnect, Coinbase Wallet, and other providers, you need a WalletConnect Project ID.

## Quick Setup (2 minutes)

### Step 1: Create WalletConnect Account
1. Visit [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Click "Sign Up" or "Get Started"
3. Sign in with GitHub, Google, or Email

### Step 2: Create New Project
1. Click "Create New Project"
2. Enter project details:
   - **Project Name**: ChainVault
   - **Homepage URL**: http://localhost:5173 (for development)
3. Click "Create"

### Step 3: Copy Project ID
1. Once created, you'll see your **Project ID**
2. Copy the Project ID (format: `abc123def456...`)

### Step 4: Update Configuration
1. Open `src/config/wagmi.js` in your code editor
2. Find the line:
   ```javascript
   projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
   ```
3. Replace `'YOUR_WALLETCONNECT_PROJECT_ID'` with your actual Project ID:
   ```javascript
   projectId: 'abc123def456...',
   ```
4. Save the file

### Step 5: Restart Dev Server
```bash
npm run dev
```

## ✅ Done!

Your app now supports:
- ✅ MetaMask
- ✅ WalletConnect (mobile wallets)
- ✅ Coinbase Wallet
- ✅ Rainbow Wallet
- ✅ Trust Wallet
- ✅ And many more!

## Troubleshooting

### "Invalid Project ID" Error
- Make sure you copied the entire Project ID
- Check for extra spaces or quotes
- Project ID should be a long alphanumeric string

### WalletConnect Not Loading
- Clear browser cache
- Restart the development server
- Check console for specific errors

### Mobile Wallets Not Connecting
- Ensure you're using HTTPS in production
- For local development, use the desktop bridge or ngrok tunnel

## Production Deployment

When deploying to production:
1. Update **Homepage URL** in WalletConnect dashboard to your production URL
2. Add your production domain to **Allowed Origins**
3. Keep your Project ID secure (though it's public-facing)

## Support

- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [RainbowKit Documentation](https://rainbowkit.com/docs/installation)
- [GitHub Issues](https://github.com/yashjain197/chainvalut/issues)
