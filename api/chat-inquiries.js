import { google } from 'googleapis';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, question, timestamp } = req.body;

    // Validate required fields
    if (!name || !email || !question) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Set up Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Append data to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Chat Inquiries!A:E', // Assuming sheet name is "Chat Inquiries"
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            timestamp || new Date().toISOString(),
            name,
            email,
            phone || '',
            question
          ]
        ]
      }
    });

    return res.status(200).json({ success: true, message: 'Inquiry saved successfully' });
  } catch (error) {
    console.error('Error saving chat inquiry:', error);
    return res.status(500).json({ error: 'Failed to save inquiry', details: error.message });
  }
}
