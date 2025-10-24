# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing "chainvault-997c7"
3. Enable Google Analytics (optional)

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider:
   - Click on Google
   - Toggle "Enable"
   - Add support email
   - Save
3. (Optional) Enable **Anonymous** if needed for future features

## 3. Setup Realtime Database

1. In Firebase Console, go to **Realtime Database**
2. Click **Create Database**
3. Choose location (e.g., us-central1)
4. Start in **Test mode** (or **Locked mode** and add rules manually)

### Important: Set Database Rules

Copy the rules from `database.rules.json` to your Firebase Realtime Database Rules:

1. Go to **Realtime Database** → **Rules** tab
2. Copy the content from `database.rules.json`
3. Click **Publish**

**OR** use Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init database
# Select your project
# Copy database.rules.json content
firebase deploy --only database
```

## 4. Get WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up / Log in
3. Create a new project
4. Copy your **Project ID**
5. Add to `.env` file:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

## 5. Update Environment Variables

Edit `.env` file with your actual values:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 6. Verify Configuration

1. Check Firebase Console → Project Settings → General
2. Verify all config values in `src/config/firebase.js` match:
   - API Key
   - Auth Domain
   - Database URL
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
   - Measurement ID

## 7. Test the Setup

```bash
npm run dev
```

Visit http://localhost:5173/ and test:
- Wallet connection
- Creating a lending offer (should save to Firebase)
- Profile editing and saving
- Chat functionality

## Troubleshooting

### Permission Denied Error
- Check Firebase Database Rules are deployed
- Verify Database URL in firebase.js includes `-default-rtdb`
- Make sure `.read` and `.write` rules are set to `true` for testing

### Authentication Error
- Verify Google Sign-In is enabled in Firebase Console
- Check API key is correct
- Ensure authDomain matches Firebase project

### WalletConnect 403 Error
- Replace placeholder Project ID with real one from WalletConnect Cloud
- Project ID should be 32 characters long

### 408 Timeout Errors
- These are network/RPC issues
- Consider using different RPC providers in wagmi config
- Temporary - not critical for testing

## Current Database Structure

```
chainvault-997c7-default-rtdb
├── lendingOffers/
│   └── {offerId}/
│       ├── lenderAddress
│       ├── amount
│       ├── interestRate
│       ├── duration
│       ├── status
│       ├── borrower
│       └── createdAt
├── borrows/
│   └── {userAddress}/
│       └── {borrowId}/
│           ├── lenderAddress
│           ├── amount
│           ├── totalRepayment
│           ├── borrowedAt
│           ├── dueDate
│           └── status
├── conversations/
│   └── {conversationId}/
│       ├── participants[]
│       └── createdAt
├── messages/
│   └── {conversationId}/
│       └── {messageId}/
│           ├── sender
│           ├── text
│           └── timestamp
└── profiles/
    └── {userAddress}/
        ├── name
        ├── bio
        ├── email
        ├── phone
        ├── location
        ├── website
        ├── twitter
        ├── github
        ├── telegram
        ├── discord
        ├── walletAddress
        └── updatedAt
```

## Security Note

⚠️ **For Production:**
- Replace test rules with proper authentication-based rules
- Validate user ownership before writes
- Add rate limiting
- Enable App Check for abuse prevention
- Use environment-specific Firebase projects (dev, staging, prod)
