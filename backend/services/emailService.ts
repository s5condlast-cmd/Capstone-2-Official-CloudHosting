import { Client } from '@microsoft/microsoft-graph-client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN_FILE_PATH = path.resolve(process.cwd(), 'backend', 'config', 'onedrive-token.json');

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountEmail?: string;
  accountName?: string;
}

/**
 * Loads cached Microsoft Graph token from disk.
 */
async function loadGraphToken(): Promise<TokenData | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
    const data: TokenData = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

/**
 * Generates official STI College Marikina branded HTML email template.
 */
function generateEmailHtml(otp: string, purpose: string): string {
  const isActivation = purpose === 'account_activation';
  const actionTitle = isActivation ? 'Student Account Activation' : 'Password Reset Verification';
  const actionSubtext = isActivation
    ? 'Thank you for enrolling in the STI Practicum Management Portal. Please use the verification code below to activate your student account.'
    : 'We received a request to reset your STI Practicum Portal password. Please use the verification code below to verify your identity.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${actionTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .header { background: #0038A8; padding: 28px 24px; text-align: center; color: #ffffff; position: relative; }
    .gold-bar { height: 5px; background: #FDC82F; width: 100%; }
    .title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; color: #ffffff; }
    .subtitle { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #FDC82F; margin: 0; }
    .content { padding: 32px 28px; text-align: center; }
    .desc { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 28px 0; }
    .otp-box { background: #f1f5f9; border: 2px dashed #0038A8; border-radius: 12px; padding: 18px 24px; margin: 0 auto 28px; display: inline-block; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #0038A8; padding-left: 12px; margin: 0; }
    .expiry { font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 20px 0; }
    .warning { font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin: 0; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="subtitle">STI College Marikina • Practicum Portal</p>
      <h1 class="title">${actionTitle}</h1>
    </div>
    <div class="gold-bar"></div>
    <div class="content">
      <p class="desc">${actionSubtext}</p>
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
      </div>
      <p class="expiry">⏱️ This code will expire in <strong>10 minutes</strong> (Maximum 3 attempts).</p>
      <p class="warning">If you did not request this verification code, please ignore this message. Do not share this 6-digit code with anyone.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} STI College Marikina Practicum Management System. All Rights Reserved.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatches 6-digit verification OTP to the target recipient.
 * Supports Microsoft 365 Outlook, external emails (Gmail, Yahoo), and local terminal development fallback.
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: 'account_activation' | 'password_reset' | 'login_verify'
): Promise<{ success: boolean; method: string; previewCode: string }> {
  const isActivation = purpose === 'account_activation';
  const subject = isActivation
    ? `STI Practicum Portal - ${otp} is your account activation code`
    : `STI Practicum Portal - ${otp} is your password reset code`;

  const htmlContent = generateEmailHtml(otp, purpose);

  // 1. Attempt dispatch via Microsoft Graph Outlook API
  let sentViaGraph = false;
  try {
    const token = await loadGraphToken();
    if (token && token.accessToken) {
      const client = Client.init({
        authProvider: (done) => {
          done(null, token.accessToken);
        },
      });

      const mailPayload = {
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: htmlContent,
          },
          toRecipients: [
            {
              emailAddress: {
                address: email,
              },
            },
          ],
        },
        saveToSentItems: 'false',
      };

      await client.api('/me/sendMail').post(mailPayload);
      sentViaGraph = true;
      console.log(`[EmailService] Dispatched OTP ${otp} to ${email} via Microsoft Graph Outlook.`);
    }
  } catch (graphErr: any) {
    console.warn(`[EmailService] Notice: Microsoft Graph sendMail fallback activated (${graphErr?.message || 'Offline'}).`);
  }

  // 2. Clear Terminal Display Banner for Instant Testing / Defense Demonstration
  console.log('\n' + '='.repeat(70));
  console.log(`📬 [STI PRACTICUM PORTAL] OTP DISPATCH VERIFICATION`);
  console.log(`Recipient: ${email}`);
  console.log(`Purpose:   ${purpose.toUpperCase()}`);
  console.log(`Delivery:  ${sentViaGraph ? 'Microsoft Graph Outlook (Real)' : 'Development / Defense Console Fallback'}`);
  console.log(`Code:      >>> ${otp} <<<`);
  console.log(`Expiry:    10 Minutes`);
  console.log('='.repeat(70) + '\n');

  return {
    success: true,
    method: sentViaGraph ? 'microsoft-graph' : 'development-console',
    previewCode: otp,
  };
}
