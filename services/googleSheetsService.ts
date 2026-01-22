
import * as jose from 'jose';
import { Expense } from '../types';

const SERVICE_ACCOUNT = {
  "client_email": "dashboard-expenses@expense-data-485116.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCr9WYUdCnhWMbG\n5oEk3cUZVKbLIjdczPxbWRXT0WjNBfjYfdhFYb6IhRF2FrErEI1oOZcTF/iWMx7Z\nXz+KXSGLZktBQlVGviznLBLJ2+5SS/9XCDexrBhz4KwVTBLyyPPOcUQxVjcEZPZi\n09J7yRijjIBR3vGo20mpLLKMnCmyvUGP9vrG4o2Y4wEshmOh5ZD4W8LzdkECj9kp\nObRMl2DUjF1TFRxraO8bU79SXF2kH7FDuVQ8eFCE3N3cknEKIxzqcIxvTUCqTJAd\nzXPrcxmabi8XmFjyW56qbe2T3qskpAIKsfAkh4aRgsveOSmHyFycE/R+y4op9aDA\nWq6D51kjAgMBAAECggEACsSStx++fMSxGCBGKbVB/RbLOCoCxlh03G05h2Xq3WYW\nMcu+cM059rmvl81OifcaYXchvo4ybmQ7GwQXKhQwTfteAQVuM5u2dq9i14VijYBv\n7rJAm7RQrWRZi2fdHQjlzKF5G4+CYZjHL9Fe+0EZvk5X4iP98tXwf5vqflonVSdz\nGM9TrP5vMgmlrmenFEf+ILYauP4SjVCCcbGJnhql0LA71UkPjkSIR2AsN1C7g0Ts\nzzD+rsv1LXnPXUgBXYSzbuRgof+V4tFLjIvLo0J+sm2bvi1kTiqwRcn2LdaFQ+oN\nST9iGOK2J4FO9x+ufH3I5g0F8RhqaL2svNjJqPfhEQKBgQDv2N6s7Kt1a5/DWCVm\nOreb85M5xcvixqk8HW3rVICQKirJ/TZfpOeFbPlqbv9QBFnuFERDv/BJiSVO1Ydm\n0bhvZPPX0vV2wgQhgSXUxcqVLThbzpY5c6w7RYU3t6S/hrfj6NqH9LaqCarI1qwL\nnDe10cV+UilF5Q5YsDOSjJLb6QKBgQC3ihVXiXhppI+/CvMidgoUqfqOPjM9vIZ2\n+z1Z78anCXIcA5aOMUS34pBTMPV8YDccjSNWD/w5wrPBKqzFBpaosvBFvw6tX9iI\n1uM6XR+6k9lky9aUA2LkNybcbH68vfvenoZToQoI9WrMj/Ramv9OyCegOF/sxoG5\IpEWq4yBKwKBgBWKhsVFJEkRd3HV8tXxpBfvkmN37k3Zxc1OX1bpafqIrvshMMb6\nSojjNqtmeKu5GFKXo2HqVSxlkuI3r0d+wm/Ow0+49K7L0g8oSDuJ4B3xx8QHE9rp\nFqjkH4jXh4ZkFRP1D9tyEQ3IfHw5O453Y1GDG5eyzV4nqlgwyxD4ayAxAoGAVFrx\njicPobZRnuOAdcE8xtyM3N13nZNNVdgJDZHngpQTzw5THw1D4SQPYzzoRv7NtaCk\nsgRsz3tONKTRfUiW6/g5+ERkkYiws8vX6dYtJAqZ6vrIp4Sa6frzMHHpGgRTg7Dm\nWf905kMtj9FF5HLCjsntdHUUmXVu39EkUAAOdrsCgYAsQ7/JyPzclKJpIPfLPLkL\nGv1yIZQkXTm7FopiSVek8lciWvmHEdQg24exXVXM54d91H+up5iTSLh7XqKEtSjv\nBxTeyMl/7p1ygf6R1iChFE9DhdXYvNjdr2gP3xv3NwaS/fq3fqAVz8KZjxyt0rG5\ndc2loSmqNxxWsznQVsXo7w==\n-----END PRIVATE KEY-----\n"
};

const SPREADSHEET_ID = '1IeWkcbIPNHa7BpmJeEIbk_SsKGT-1yXo7KJuWL-he5o';

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new jose.SignJWT({
    iss: SERVICE_ACCOUNT.client_email,
    sub: SERVICE_ACCOUNT.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .sign(await jose.importPKCS8(SERVICE_ACCOUNT.private_key, 'RS256'));

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

/**
 * Helper to parse Indonesian number formats.
 */
const parseIndonesianAmount = (val: any): number => {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim();
  str = str.replace(/Rp/gi, '').replace(/\s/g, '');
  const cleanStr = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

/**
 * Fetches spreadsheet metadata to find the correct sheet title.
 */
async function getFirstSheetTitle(token: string): Promise<string> {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  // Return the first sheet title or fallback to "Sheet1"
  return data.sheets?.[0]?.properties?.title || 'Sheet1';
}

export const fetchExpensesFromSheet = async (): Promise<Expense[]> => {
  try {
    const token = await getAccessToken();
    
    // Dynamically find the sheet name to avoid "Unable to parse range"
    const sheetTitle = await getFirstSheetTitle(token);
    const range = `${sheetTitle}!A2:D`;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await response.json();
    if (data.error) throw new Error(`Sheets API Error: ${data.error.message}`);

    const rows = data.values || [];
    return rows.map((row: any[], index: number) => ({
      id: String(index + 1),
      date: row[0] || '', // Column A: Tanggal
      amount: parseIndonesianAmount(row[1]), // Column B: Jumlah
      category: row[2] || 'Tanpa Kategori', // Column C: Kategori
      paymentMethod: row[3] || 'Tunai', // Column D: Pembayaran
    }));
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    throw error;
  }
};
