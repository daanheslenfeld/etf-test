# Email Setup Instructions for PIGG

## What You Need to Do:

### Step 1: Set Up Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left menu
3. Make sure **2-Step Verification** is turned ON
   - If not, enable it first
4. Search for "App Passwords" or go to: https://myaccount.google.com/apppasswords
5. Click **Select app** → Choose "Mail"
6. Click **Select device** → Choose "Windows Computer"
7. Click **Generate**
8. Google will show you a 16-character password (like: "abcd efgh ijkl mnop")
9. **Copy this password** - you'll need it in the next step

### Step 2: Create Your .env File

1. In your project folder, create a new file called `.env` (just .env, no .txt)
2. Copy and paste this into the file:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
NOTIFICATION_EMAIL=your-email@gmail.com
```

3. Replace:
   - `your-email@gmail.com` with your actual Gmail address
   - `your-16-character-app-password` with the password from Step 1
   - `your-email@gmail.com` (second one) with the email where you want to receive notifications

### Step 3: Start the Backend Server

Open a **NEW** terminal/command prompt and run:

```
node server/index.js
```

You should see: "Server running on port 3001"

**Keep this terminal window open!** The server needs to run while your app is running.

### Step 4: Start Your React App

In your **ORIGINAL** terminal (not the one running the server), run:

```
npm start
```

Now both will run at the same time:
- React app on http://localhost:3000
- Server on http://localhost:3001

### Step 5: Test It!

1. Go to your website
2. Click "Start nu" or "Begin met beleggen"
3. Fill in the registration form
4. Click register
5. Check your email - you should receive a notification!

## Troubleshooting:

**"Invalid login" error:**
- Make sure you're using the App Password, not your regular Gmail password
- Make sure 2-Step Verification is enabled

**"Connection refused" error:**
- Make sure the backend server is running (node server/index.js)

**Nothing happens when registering:**
- Check the terminal where the server is running for error messages
- Make sure your .env file is in the root folder (same folder as package.json)

## Need Help?

If something doesn't work, check:
1. Is the .env file created correctly?
2. Is the backend server running?
3. Are there any error messages in the terminal?
