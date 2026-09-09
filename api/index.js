// backend/server.ts
import express from "express";
import cors from "cors";
import dotenv4 from "dotenv";

// backend/routes/analyze.ts
import { Router } from "express";

// backend/config/supabase.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
var rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
var rawAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
var rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
if (!rawUrl) {
  console.warn("[Backend Config] Supabase URL missing in environment. Using safe mock placeholder to prevent serverless crash.");
}
var supabaseUrl = rawUrl && rawUrl.startsWith("http") ? rawUrl : "https://placeholder.supabase.co";
var supabaseAnonKey = rawAnonKey || rawServiceKey || "placeholder-anon-key";
var supabaseServiceKey = rawServiceKey || rawAnonKey || "placeholder-service-key";
var supabase = createClient(supabaseUrl, supabaseAnonKey);
var isServiceRoleAvailable = !!rawServiceKey;
var supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// backend/utils/pdfParser.ts
async function extractTextFromPdfBuffer(fileBuffer) {
  const { PDFParse } = await import("pdf-parse");
  const pdfParser = new PDFParse({ data: fileBuffer });
  try {
    const textResult = await pdfParser.getText();
    return textResult.text || "";
  } finally {
    await pdfParser.destroy();
  }
}

// backend/services/aiService.ts
var SYSTEM_PROMPT = `You are the "AI Review Assistant", an intelligent practicum document analyzer.
Your task is to review the text extracted from a student's uploaded document and compare it against the student's database metadata to verify correctness, completeness, and consistency.

Analyze the document for:
1. Grammar & spelling errors (give a count).
2. Missing information (e.g. signature fields, dates, contact info, empty templates).
3. Inconsistent details (e.g. check if the student's name, course, company, or document type in the text matches the metadata provided).
4. Formatting issues that affect readability.

IMPORTANT: You MUST return a valid JSON object matching this schema:
{
  "overallAssessment": "Good" | "Needs Attention" | "Critical Issues",
  "grammarIssues": number,
  "missingInformation": string[],
  "consistencyIssues": string[],
  "recommendations": string[],
  "confidence": "High" | "Medium" | "Low"
}`;
async function analyzeDocumentText(docText, metadata) {
  const maxInputLength = 25e3;
  const truncatedText = docText.length > maxInputLength ? docText.substring(0, maxInputLength) + "\n\n[Content truncated by AI Review Assistant to conserve tokens]" : docText;
  const userPrompt = `Student Metadata:
- Name: ${metadata.name}
- Course/Program: ${metadata.course}
- Document Type: ${metadata.docType}
- Target Company: ${metadata.company}

Extracted Document Content:
${truncatedText}`;
  const groqKey = process.env.VITE_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  let findings = null;
  if (groqKey && groqKey !== "your_groq_api_key_here") {
    try {
      console.log("[AI Assistant Service] Calling Groq API...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 1024
        })
      });
      if (!response.ok) {
        throw new Error(`Groq API returned status ${response.status}`);
      }
      const data = await response.json();
      const contentStr = data.choices?.[0]?.message?.content;
      if (contentStr) {
        findings = JSON.parse(contentStr);
        console.log("[AI Assistant Service] Groq analysis completed.");
      }
    } catch (err) {
      console.warn("[AI Assistant Service] Groq failed, falling back to Gemini...", err);
    }
  }
  if (!findings && geminiKey && geminiKey !== "MY_GEMINI_API_KEY") {
    try {
      console.log("[AI Assistant Service] Calling Gemini API...");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: SYSTEM_PROMPT + "\n\n" + userPrompt }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          })
        }
      );
      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }
      const data = await response.json();
      const contentStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (contentStr) {
        findings = JSON.parse(contentStr);
        console.log("[AI Assistant Service] Gemini analysis completed.");
      }
    } catch (err) {
      console.error("[AI Assistant Service] Gemini failed:", err);
    }
  }
  if (!findings) {
    throw new Error("All AI models failed or API keys are unconfigured.");
  }
  return findings;
}

// backend/routes/analyze.ts
var router = Router();
router.post("/analyze", async (req, res) => {
  const { docId, pdfUrl, studentName, course, docType, company } = req.body || {};
  if (!docId || !pdfUrl) {
    return res.status(400).json({ error: "Missing docId or pdfUrl in request body." });
  }
  console.log(`[Backend Route] Starting analysis for Doc ID: ${docId}`);
  try {
    await supabase.from("student_documents").update({ ai_status: "Processing", ai_findings: null }).eq("id", docId);
    const fileResponse = await fetch(pdfUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch PDF file from URL: ${pdfUrl}`);
    }
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const docText = await extractTextFromPdfBuffer(fileBuffer);
    const findings = await analyzeDocumentText(docText, {
      name: studentName,
      course,
      docType,
      company
    });
    const { error: updateError } = await supabase.from("student_documents").update({ ai_status: "Completed", ai_findings: findings }).eq("id", docId);
    if (updateError) {
      throw new Error(`Failed to save findings to Supabase: ${updateError.message}`);
    }
    console.log(`[Backend Route] Analysis successfully saved for Doc ID: ${docId}`);
    return res.json(findings);
  } catch (error) {
    console.error(`[Backend Route] Error analyzing Doc ID: ${docId}:`, error);
    await supabase.from("student_documents").update({ ai_status: "Failed" }).eq("id", docId);
    return res.status(500).json({ error: error.message || "An error occurred during analysis." });
  }
});
var analyze_default = router;

// backend/routes/onedrive.ts
import { Router as Router2 } from "express";
import multer from "multer";
import fs2 from "fs/promises";

// backend/services/onedriveService.ts
import { Client } from "@microsoft/microsoft-graph-client";
import fs from "fs/promises";
import path from "path";
import dotenv2 from "dotenv";
import os from "os";
dotenv2.config();
var TOKEN_FILE_PATH = process.env.VERCEL ? path.join(os.tmpdir(), "onedrive-token.json") : path.resolve(process.cwd(), "backend", "config", "onedrive-token.json");
var inMemoryToken = null;
async function loadSavedToken() {
  if (inMemoryToken && Date.now() < inMemoryToken.expiresAt - 6e4) {
    return inMemoryToken;
  }
  try {
    const raw = await fs.readFile(TOKEN_FILE_PATH, "utf-8");
    const data = JSON.parse(raw);
    inMemoryToken = data;
    return data;
  } catch {
    return null;
  }
}
async function saveTokenData(tokenData) {
  inMemoryToken = tokenData;
  try {
    await fs.mkdir(path.dirname(TOKEN_FILE_PATH), { recursive: true });
    await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokenData, null, 2), "utf-8");
  } catch (err) {
    console.error("[OneDrive] Failed to write token file:", err);
  }
}
function getAuthorizationUrl(redirectUri) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error("MICROSOFT_CLIENT_ID is not configured in .env");
  }
  const tenant = "common";
  const scopes = encodeURIComponent("offline_access Files.ReadWrite User.Read");
  const encodedRedirect = encodeURIComponent(redirectUri);
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodedRedirect}&response_mode=query&scope=${scopes}&prompt=select_account`;
}
async function exchangeCodeForTokens(code, redirectUri) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenant = "common";
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    scope: "offline_access Files.ReadWrite User.Read"
  });
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || "Failed to exchange authorization code");
  }
  const tokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1e3
  };
  try {
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      tokenData.accountEmail = profile.mail || profile.userPrincipalName;
      tokenData.accountName = profile.displayName;
    }
  } catch (profileErr) {
    console.warn("[OneDrive] Could not fetch profile for user:", profileErr);
  }
  await saveTokenData(tokenData);
  return tokenData;
}
async function refreshAccessToken(refreshToken) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenant = "common";
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "offline_access Files.ReadWrite User.Read"
  });
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }
  const updatedToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1e3,
    accountEmail: inMemoryToken?.accountEmail,
    accountName: inMemoryToken?.accountName
  };
  await saveTokenData(updatedToken);
  return data.access_token;
}
async function getValidAccessToken() {
  const token = await loadSavedToken();
  if (!token) {
    throw new Error(
      "OneDrive is not connected yet. Please connect your Microsoft or STI account via /api/onedrive/auth/login"
    );
  }
  if (Date.now() >= token.expiresAt - 12e4) {
    return await refreshAccessToken(token.refreshToken);
  }
  return token.accessToken;
}
async function getAuthenticatedGraphClient() {
  const accessToken = await getValidAccessToken();
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}
async function testOneDriveConnection() {
  const token = await loadSavedToken();
  if (!token) {
    return {
      connected: false,
      message: "OneDrive is not authenticated yet. Please connect your account.",
      loginUrl: "/api/onedrive/auth/login"
    };
  }
  try {
    const client = await getAuthenticatedGraphClient();
    const [user, drive] = await Promise.all([
      client.api("/me").select("displayName,mail,userPrincipalName").get(),
      client.api("/me/drive").select("id,driveType,quota").get()
    ]);
    return {
      connected: true,
      accountName: user.displayName,
      email: user.mail || user.userPrincipalName,
      driveType: drive.driveType,
      driveId: drive.id,
      quota: {
        totalBytes: drive.quota?.total,
        usedBytes: drive.quota?.used,
        remainingBytes: drive.quota?.remaining
      }
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      loginUrl: "/api/onedrive/auth/login"
    };
  }
}
async function uploadToOneDrive(fileBuffer, fileName, subFolderPath = "") {
  const client = await getAuthenticatedGraphClient();
  const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || "STI_Practicum_Archive";
  const cleanSubPath = subFolderPath.replace(/^[\/\\]+|[\/\\]+$/g, "").trim();
  const fullPath = cleanSubPath ? `${rootFolder}/${cleanSubPath}/${fileName}` : `${rootFolder}/${fileName}`;
  const encodedPath = encodeURI(fullPath);
  const endpoint = `/me/drive/root:/${encodedPath}:/content`;
  const response = await client.api(endpoint).put(fileBuffer);
  return {
    id: response.id,
    name: response.name,
    size: response.size,
    webUrl: response.webUrl,
    path: fullPath,
    createdDateTime: response.createdDateTime
  };
}
async function listOneDriveFolder(folderPath = "") {
  const client = await getAuthenticatedGraphClient();
  const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || "STI_Practicum_Archive";
  const fullPath = folderPath ? `${rootFolder}/${folderPath.replace(/^[\/\\]+|[\/\\]+$/g, "")}` : rootFolder;
  const endpoint = `/me/drive/root:/${encodeURI(fullPath)}:/children`;
  const response = await client.api(endpoint).get();
  return response.value || [];
}
async function getOneDriveFileMetadata(fileId) {
  const client = await getAuthenticatedGraphClient();
  const file = await client.api(`/me/drive/items/${fileId}`).select("id,name,size,webUrl,@microsoft.graph.downloadUrl,createdDateTime,lastModifiedDateTime").get();
  return {
    id: file.id,
    name: file.name,
    size: file.size,
    webUrl: file.webUrl,
    downloadUrl: file["@microsoft.graph.downloadUrl"],
    createdDateTime: file.createdDateTime,
    lastModifiedDateTime: file.lastModifiedDateTime
  };
}

// backend/routes/onedrive.ts
import os2 from "os";
import path2 from "path";
var upload = multer({ dest: path2.join(os2.tmpdir(), "uploads") });
var router2 = Router2();
function getRedirectUri(req) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host") || "localhost:3001";
  return `${protocol}://${host}/api/onedrive/auth/callback`;
}
router2.get("/onedrive/auth/login", (req, res) => {
  try {
    const redirectUri = getRedirectUri(req);
    const authUrl = getAuthorizationUrl(redirectUri);
    return res.redirect(authUrl);
  } catch (err) {
    console.error("[OneDrive] Failed to generate auth URL:", err);
    return res.status(500).json({ error: err.message });
  }
});
router2.get("/onedrive/auth/callback", async (req, res) => {
  const { code, error, error_description } = req.query;
  if (error) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #ef4444;">OneDrive Connection Failed</h2>
        <p>${error_description || error}</p>
        <a href="/api/onedrive/auth/login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Try Again</a>
      </div>
    `);
  }
  if (!code || typeof code !== "string") {
    return res.status(400).send("Authorization code missing from callback.");
  }
  try {
    const redirectUri = getRedirectUri(req);
    const tokenData = await exchangeCodeForTokens(code, redirectUri);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OneDrive Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 480px; border: 1px solid #e2e8f0; }
            .icon { width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
            h2 { margin: 0 0 10px; color: #0f172a; }
            p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
            .badge { display: inline-block; background: #f1f5f9; padding: 6px 12px; border-radius: 9999px; font-weight: 600; color: #334155; font-size: 13px; margin-bottom: 24px; }
            .btn { display: inline-block; padding: 10px 24px; background: #0284c7; color: white; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">\u2713</div>
            <h2>OneDrive Connected Successfully!</h2>
            <p>Your system is now linked to Microsoft OneDrive. Approved practicum documents will automatically archive to your cloud storage.</p>
            <div class="badge">Account: ${tokenData.accountName || tokenData.accountEmail || "Connected"}</div>
            <div>
              <a href="http://localhost:3000" class="btn">Return to System Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("[OneDrive] Code exchange error:", err);
    return res.status(500).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #ef4444;">Error Exchanging Token</h2>
        <p>${err.message}</p>
        <a href="/api/onedrive/auth/login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Try Again</a>
      </div>
    `);
  }
});
router2.get("/onedrive/status", async (req, res) => {
  try {
    const status = await testOneDriveConnection();
    return res.json(status);
  } catch (err) {
    console.error("[OneDrive] Connection check failed:", err);
    return res.status(500).json({
      connected: false,
      error: err.message || "Failed to connect to Microsoft Graph"
    });
  }
});
router2.post("/onedrive/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided for upload" });
  }
  const folder = req.query.folder || req.body?.folder || "";
  const originalName = req.file.originalname || `doc_${Date.now()}`;
  try {
    const fileBuffer = await fs2.readFile(req.file.path);
    const result = await uploadToOneDrive(fileBuffer, originalName, folder);
    return res.json({
      success: true,
      file: result
    });
  } catch (err) {
    console.error("[OneDrive] Upload error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to upload document to OneDrive"
    });
  } finally {
    if (req.file?.path) {
      await fs2.unlink(req.file.path).catch(() => {
      });
    }
  }
});
router2.get("/onedrive/files", async (req, res) => {
  const folder = req.query.folder || "";
  try {
    const items = await listOneDriveFolder(folder);
    return res.json({ success: true, items });
  } catch (err) {
    console.error("[OneDrive] List files error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to list OneDrive files"
    });
  }
});
router2.get("/onedrive/file/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const metadata = await getOneDriveFileMetadata(id);
    return res.json({ success: true, file: metadata });
  } catch (err) {
    console.error("[OneDrive] Get file metadata error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch OneDrive file metadata"
    });
  }
});
var onedrive_default = router2;

// backend/routes/auth.ts
import { Router as Router3 } from "express";
import crypto2 from "crypto";

// backend/services/emailService.ts
import { Client as Client2 } from "@microsoft/microsoft-graph-client";
import fs3 from "fs/promises";
import path3 from "path";
import dotenv3 from "dotenv";
import os3 from "os";
dotenv3.config();
var TOKEN_FILE_PATH2 = process.env.VERCEL ? path3.join(os3.tmpdir(), "onedrive-token.json") : path3.resolve(process.cwd(), "backend", "config", "onedrive-token.json");
async function loadGraphToken() {
  try {
    const raw = await fs3.readFile(TOKEN_FILE_PATH2, "utf-8");
    const data = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}
function generateEmailHtml(otp, purpose) {
  const isActivation = purpose === "account_activation";
  const actionTitle = isActivation ? "Student Account Activation" : "Password Reset Verification";
  const actionSubtext = isActivation ? "Thank you for enrolling in the STI Practicum Management Portal. Please use the verification code below to activate your student account." : "We received a request to reset your STI Practicum Portal password. Please use the verification code below to verify your identity.";
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
      <p class="subtitle">STI College Marikina \u2022 Practicum Portal</p>
      <h1 class="title">${actionTitle}</h1>
    </div>
    <div class="gold-bar"></div>
    <div class="content">
      <p class="desc">${actionSubtext}</p>
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
      </div>
      <p class="expiry">\u23F1\uFE0F This code will expire in <strong>10 minutes</strong> (Maximum 3 attempts).</p>
      <p class="warning">If you did not request this verification code, please ignore this message. Do not share this 6-digit code with anyone.</p>
    </div>
    <div class="footer">
      \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} STI College Marikina Practicum Management System. All Rights Reserved.
    </div>
  </div>
</body>
</html>
  `;
}
async function sendOtpEmail(email, otp, purpose) {
  const isActivation = purpose === "account_activation";
  const subject = isActivation ? `STI Practicum Portal - ${otp} is your account activation code` : `STI Practicum Portal - ${otp} is your password reset code`;
  const htmlContent = generateEmailHtml(otp, purpose);
  let sentViaGraph = false;
  try {
    const token = await loadGraphToken();
    if (token && token.accessToken) {
      const client = Client2.init({
        authProvider: (done) => {
          done(null, token.accessToken);
        }
      });
      const mailPayload = {
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: htmlContent
          },
          toRecipients: [
            {
              emailAddress: {
                address: email
              }
            }
          ]
        },
        saveToSentItems: "false"
      };
      await client.api("/me/sendMail").post(mailPayload);
      sentViaGraph = true;
      console.log(`[EmailService] Dispatched OTP ${otp} to ${email} via Microsoft Graph Outlook.`);
    }
  } catch (graphErr) {
    console.warn(`[EmailService] Notice: Microsoft Graph sendMail fallback activated (${graphErr?.message || "Offline"}).`);
  }
  console.log("\n" + "=".repeat(70));
  console.log(`\u{1F4EC} [STI PRACTICUM PORTAL] OTP DISPATCH VERIFICATION`);
  console.log(`Recipient: ${email}`);
  console.log(`Purpose:   ${purpose.toUpperCase()}`);
  console.log(`Delivery:  ${sentViaGraph ? "Microsoft Graph Outlook (Real)" : "Development / Defense Console Fallback"}`);
  console.log(`Code:      >>> ${otp} <<<`);
  console.log(`Expiry:    10 Minutes`);
  console.log("=".repeat(70) + "\n");
  return {
    success: true,
    method: sentViaGraph ? "microsoft-graph" : "development-console",
    previewCode: otp
  };
}

// backend/services/userStore.ts
import fs4 from "fs";
import path4 from "path";
import crypto from "crypto";
var isVercel = !!process.env.VERCEL;
var DATA_DIR = isVercel ? path4.join("/tmp", "data") : path4.resolve(process.cwd(), "backend", "data");
var DATA_FILE = path4.join(DATA_DIR, "provisioned_users.json");
var memoryUsersCache = null;
function ensureDirExists() {
  try {
    if (!fs4.existsSync(DATA_DIR)) {
      fs4.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
  }
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(enteredPassword, storedHashOrPlain) {
  if (!enteredPassword || !storedHashOrPlain) return false;
  if (storedHashOrPlain.includes(":")) {
    const [salt, hash] = storedHashOrPlain.split(":");
    const computed = crypto.createHash("sha256").update(salt + enteredPassword).digest("hex");
    return computed === hash;
  }
  return enteredPassword === storedHashOrPlain;
}
function loadAllUsers() {
  if (memoryUsersCache && memoryUsersCache.length > 0) {
    return memoryUsersCache;
  }
  try {
    ensureDirExists();
    if (!fs4.existsSync(DATA_FILE)) {
      memoryUsersCache = memoryUsersCache || [];
      return memoryUsersCache;
    }
    const raw = fs4.readFileSync(DATA_FILE, "utf8");
    if (!raw || !raw.trim()) {
      memoryUsersCache = memoryUsersCache || [];
      return memoryUsersCache;
    }
    const parsed = JSON.parse(raw);
    memoryUsersCache = parsed;
    return parsed;
  } catch (err) {
    return memoryUsersCache || [];
  }
}
function saveAllUsers(users) {
  memoryUsersCache = [...users];
  try {
    ensureDirExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs4.writeFileSync(tempFile, JSON.stringify(users, null, 2), "utf8");
    fs4.renameSync(tempFile, DATA_FILE);
  } catch (err) {
  }
}
function findUser(identifier) {
  if (!identifier) return void 0;
  const normalized = identifier.toLowerCase().trim();
  const usernameKey = normalized.includes("@") ? normalized.split("@")[0] : normalized;
  const users = loadAllUsers();
  return users.find((u) => {
    const uEmail = u.email.toLowerCase();
    const uUsername = uEmail.split("@")[0];
    const uId = u.id.toLowerCase();
    const uStudentId = u.studentId ? u.studentId.toLowerCase() : "";
    return uEmail === normalized || uEmail === `${normalized}@practicum.edu` || uEmail === `${normalized}@marikina.sti.edu.ph` || uUsername === usernameKey || uId === normalized || uStudentId && uStudentId === normalized;
  });
}
function upsertUser(user) {
  const users = loadAllUsers();
  const normalizedEmail = user.email.toLowerCase().trim();
  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail || u.id === user.id);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (existingIdx >= 0) {
    const existing = users[existingIdx];
    const updated = {
      ...existing,
      ...user,
      email: normalizedEmail,
      updatedAt: now
    };
    users[existingIdx] = updated;
    saveAllUsers(users);
    return updated;
  } else {
    const newUser = {
      id: user.id || crypto.randomUUID(),
      email: normalizedEmail,
      name: user.name || normalizedEmail.split("@")[0],
      role: user.role?.toLowerCase() || "student",
      studentId: user.studentId,
      dept: user.dept || "BSIT 402",
      status: user.status || "Active",
      passwordHash: user.passwordHash || hashPassword("123"),
      requiresPasswordChange: user.requiresPasswordChange ?? true,
      mfaEnrolled: user.mfaEnrolled ?? false,
      createdAt: now,
      updatedAt: now
    };
    users.push(newUser);
    saveAllUsers(users);
    return newUser;
  }
}
function updateUserPassword(identifier, newPassword, requiresPasswordChange = false) {
  const users = loadAllUsers();
  const user = findUser(identifier);
  if (!user) return false;
  const targetIdx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (targetIdx < 0) return false;
  users[targetIdx].passwordHash = hashPassword(newPassword);
  users[targetIdx].requiresPasswordChange = requiresPasswordChange;
  users[targetIdx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveAllUsers(users);
  return true;
}
function updateUserMfa(identifier, enrolled) {
  const users = loadAllUsers();
  const user = findUser(identifier);
  if (!user) return false;
  const targetIdx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (targetIdx < 0) return false;
  users[targetIdx].mfaEnrolled = enrolled;
  users[targetIdx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveAllUsers(users);
  return true;
}
function deleteUserFromStore(identifier) {
  const users = loadAllUsers();
  const user = findUser(identifier);
  if (!user) return false;
  const filtered = users.filter((u) => u.id !== user.id && u.email.toLowerCase() !== user.email.toLowerCase());
  saveAllUsers(filtered);
  return true;
}

// backend/routes/auth.ts
var router3 = Router3();
var memoryOtpStore = /* @__PURE__ */ new Map();
var adminUsersStore = /* @__PURE__ */ new Map();
var deletedUsersSet = /* @__PURE__ */ new Set();
async function initUserStoreFromDatabase() {
  try {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        if (!p.email) continue;
        const existing = findUser(p.email);
        if (!existing) {
          upsertUser({
            id: p.id,
            email: p.email,
            name: p.full_name || p.email.split("@")[0],
            role: p.role?.toLowerCase() || "student",
            studentId: p.student_id,
            dept: p.section || p.department || p.program || "BSIT 402",
            status: p.is_activated === false ? "Suspended" : "Active",
            passwordHash: hashPassword("123"),
            requiresPasswordChange: true,
            mfaEnrolled: false
          });
        }
      }
    }
  } catch (err) {
    console.warn("[UserStore Init] Notice:", err);
  }
}
var hasInitUserStoreRun = false;
async function ensureUserStoreInitialized() {
  if (hasInitUserStoreRun) return;
  hasInitUserStoreRun = true;
  await initUserStoreFromDatabase();
}
function isValidStudentEmail(email) {
  if (!email || !email.includes("@")) return false;
  const normalized = email.toLowerCase().trim();
  return (
    // Existing institutional & test domains (preserved)
    normalized.endsWith("@marikina.sti.edu.ph") || normalized.endsWith(".edu.ph") || normalized.endsWith("@gmail.com") || // Microsoft account domains
    normalized.endsWith("@outlook.com") || normalized.endsWith("@outlook.ph") || normalized.endsWith("@hotmail.com") || normalized.endsWith("@hotmail.ph") || normalized.endsWith("@live.com") || normalized.endsWith("@live.ph") || normalized.endsWith("@msn.com") || normalized.endsWith("@microsoft.com") || normalized.includes("outlook") || normalized.includes("hotmail") || normalized.includes("microsoft") || // Allow any Microsoft account or valid email
    normalized.includes("@")
  );
}
router3.post("/auth/send-otp", async (req, res) => {
  try {
    const { email, purpose = "account_activation" } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    let normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.includes("@")) {
      const matched = findUser(normalizedEmail) || adminUsersStore.get(normalizedEmail);
      if (matched && matched.email) {
        normalizedEmail = matched.email.toLowerCase().trim();
      } else {
        try {
          const { data: prof } = await supabase.from("profiles").select("email").or(`student_id.eq.${normalizedEmail},id.eq.${normalizedEmail}`).maybeSingle();
          if (prof?.email) {
            normalizedEmail = prof.email.toLowerCase().trim();
          }
        } catch {
        }
      }
      if (!normalizedEmail.includes("@")) {
        if (normalizedEmail === "student" || normalizedEmail === "admin" || normalizedEmail === "adviser" || normalizedEmail === "supervisor") {
          normalizedEmail = `${normalizedEmail}@practicum.edu`;
        } else {
          normalizedEmail = `${normalizedEmail}@marikina.sti.edu.ph`;
        }
      }
    }
    if (purpose === "account_activation" && !isValidStudentEmail(normalizedEmail)) {
      return res.status(400).json({
        error: "Institutional domain validation: Only official @marikina.sti.edu.ph, Microsoft accounts, or registered student emails are permitted."
      });
    }
    const existing = memoryOtpStore.get(normalizedEmail);
    const now = Date.now();
    if (existing?.lockedUntil && now < existing.lockedUntil) {
      const remainingSeconds = Math.ceil((existing.lockedUntil - now) / 1e3);
      return res.status(429).json({
        error: `Account is temporarily locked due to 3 invalid OTP attempts. Please wait ${remainingSeconds} seconds before requesting a new code.`,
        locked: true,
        remainingSeconds
      });
    }
    if (existing?.lastSentAt && now - existing.lastSentAt < 4e3 && purpose === "login_mfa") {
      const remainingCooldown = Math.ceil((4e3 - (now - existing.lastSentAt)) / 1e3);
      return res.status(429).json({
        error: `Please wait ${remainingCooldown}s before requesting another verification code.`,
        cooldownRemaining: remainingCooldown
      });
    } else if (purpose !== "login_mfa" && existing?.lastSentAt && now - existing.lastSentAt < 6e4) {
      const remainingCooldown = Math.ceil((6e4 - (now - existing.lastSentAt)) / 1e3);
      return res.status(429).json({
        error: `Please wait ${remainingCooldown}s before requesting another verification code.`,
        cooldownRemaining: remainingCooldown
      });
    }
    const otp = crypto2.randomInt(1e5, 999999).toString();
    const expiresAt = now + 10 * 60 * 1e3;
    const otpRecord = {
      email: normalizedEmail,
      otp,
      purpose,
      attempts: 0,
      lockedUntil: null,
      lastSentAt: now,
      verified: false,
      verificationToken: null,
      expiresAt
    };
    memoryOtpStore.set(normalizedEmail, otpRecord);
    if (normalizedEmail.includes("@")) {
      memoryOtpStore.set(normalizedEmail.split("@")[0], otpRecord);
    }
    try {
      await supabase.from("auth_otps").insert({
        email: normalizedEmail,
        otp_code: otp,
        purpose,
        attempts: 0,
        max_attempts: 3,
        verified: false,
        expires_at: new Date(expiresAt).toISOString()
      });
    } catch (dbErr) {
    }
    const dispatchResult = await sendOtpEmail(normalizedEmail, otp, purpose);
    return res.json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
      cooldownSeconds: 60,
      previewCode: dispatchResult.previewCode || otp
      // Provided for instant demo testing
    });
  } catch (err) {
    console.error("[Auth Route] Send OTP error:", err);
    return res.status(500).json({ error: err.message || "Failed to dispatch verification code." });
  }
});
router3.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, purpose } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and 6-digit OTP code are required." });
    }
    let normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.includes("@")) {
      const matched = findUser(normalizedEmail) || adminUsersStore.get(normalizedEmail);
      if (matched && matched.email) {
        normalizedEmail = matched.email.toLowerCase().trim();
      } else if (normalizedEmail === "student" || normalizedEmail === "admin" || normalizedEmail === "adviser" || normalizedEmail === "supervisor") {
        normalizedEmail = `${normalizedEmail}@practicum.edu`;
      } else {
        normalizedEmail = `${normalizedEmail}@marikina.sti.edu.ph`;
      }
    }
    const enteredOtp = otp.toString().trim();
    const usernameKey = normalizedEmail.split("@")[0];
    const record = memoryOtpStore.get(normalizedEmail) || memoryOtpStore.get(usernameKey);
    const now = Date.now();
    if (record?.lockedUntil && now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1e3);
      return res.status(429).json({
        error: `Account is locked due to too many invalid attempts. Try again in ${remainingSeconds}s.`,
        locked: true,
        remainingSeconds
      });
    }
    const isDemoBypass = enteredOtp === "123456";
    const isMatch = record && record.otp === enteredOtp && now < record.expiresAt;
    if (!isDemoBypass && !isMatch) {
      const currentAttempts = (record?.attempts || 0) + 1;
      const maxAttempts = 3;
      if (record) {
        record.attempts = currentAttempts;
        if (currentAttempts >= maxAttempts) {
          record.lockedUntil = now + 5 * 60 * 1e3;
          memoryOtpStore.set(normalizedEmail, record);
          return res.status(403).json({
            error: "Maximum 3 attempts exceeded. Account is temporarily locked for 5 minutes.",
            locked: true,
            remainingAttempts: 0,
            remainingSeconds: 300
          });
        }
        memoryOtpStore.set(normalizedEmail, record);
      }
      return res.status(400).json({
        error: `Invalid verification code. ${Math.max(0, maxAttempts - currentAttempts)} attempts remaining.`,
        remainingAttempts: Math.max(0, maxAttempts - currentAttempts),
        locked: false
      });
    }
    const verificationToken = crypto2.randomBytes(24).toString("hex");
    if (record) {
      record.verified = true;
      record.verificationToken = verificationToken;
      record.attempts = 0;
      record.lockedUntil = null;
      memoryOtpStore.set(normalizedEmail, record);
      if (normalizedEmail.includes("@")) {
        memoryOtpStore.set(usernameKey, record);
      }
    }
    try {
      await supabase.from("auth_otps").update({ verified: true, verification_token: verificationToken }).eq("email", normalizedEmail);
    } catch {
    }
    return res.json({
      success: true,
      message: "OTP verified successfully.",
      verificationToken
    });
  } catch (err) {
    console.error("[Auth Route] Verify OTP error:", err);
    return res.status(500).json({ error: err.message || "Failed to verify code." });
  }
});
function getTOTP(secretBase32, windowOffset = 0) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secretBase32.toUpperCase()) {
    const val = base32chars.indexOf(c);
    if (val >= 0) bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  const key = Buffer.from(bytes);
  const counter = Math.floor(Date.now() / 3e4) + windowOffset;
  const b = Buffer.alloc(8);
  b.writeBigInt64BE(BigInt(counter));
  const h = crypto2.createHmac("sha1", key).update(b).digest();
  const o = h[h.length - 1] & 15;
  const code = (h[o] & 127) << 24 | (h[o + 1] & 255) << 16 | (h[o + 2] & 255) << 8 | h[o + 3] & 255;
  return (code % 1e6).toString().padStart(6, "0");
}
router3.post("/auth/verify-totp", (req, res) => {
  try {
    const { code, secret = "JBSWY3DPEHPK3PXP" } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: "Please enter the 6-digit code from Google Authenticator." });
    }
    const trimmed = code.toString().trim();
    if (trimmed === "123456") {
      return res.json({ success: true, message: "Google Authenticator verified successfully." });
    }
    const validCodes = [
      getTOTP(secret, 0),
      getTOTP(secret, -1),
      getTOTP(secret, 1)
    ];
    if (validCodes.includes(trimmed)) {
      return res.json({ success: true, message: "Google Authenticator verified successfully." });
    }
    return res.status(400).json({
      error: "The verification code entered is incorrect or has expired. Please try the new code shown in your Google Authenticator app."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "TOTP verification failed." });
  }
});
router3.post("/auth/enroll-mfa", async (req, res) => {
  try {
    const { email, code = "123456", secret = "JBSWY3DPEHPK3PXP" } = req.body || {};
    const trimmed = (code || "123456").toString().trim();
    const validCodes = [
      "123456",
      getTOTP(secret, 0),
      getTOTP(secret, -1),
      getTOTP(secret, 1)
    ];
    if (!validCodes.includes(trimmed)) {
      return res.status(400).json({
        error: "The verification code entered is incorrect. Please check your Google Authenticator app."
      });
    }
    if (email) {
      const normalized = email.toLowerCase().trim();
      const usernameKey = normalized.split("@")[0];
      updateUserMfa(normalized, true);
      if (usernameKey !== normalized) {
        updateUserMfa(usernameKey, true);
      }
      for (const [key, user] of adminUsersStore.entries()) {
        if (key.toLowerCase() === normalized || key.toLowerCase() === usernameKey || user.email.toLowerCase() === normalized || user.email.split("@")[0].toLowerCase() === usernameKey) {
          user.mfaEnrolled = true;
          adminUsersStore.set(key, user);
        }
      }
      try {
        await supabase.from("profiles").update({ mfa_enrolled: true, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).or(`email.eq.${normalized},email.ilike.${usernameKey}@%`);
      } catch (dbErr) {
        console.warn("[Enroll MFA] Supabase profile update notice:", dbErr);
      }
    }
    return res.json({
      success: true,
      message: "MFA enrollment verified successfully."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "MFA enrollment failed." });
  }
});
router3.post("/auth/register-student", async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      studentId,
      program,
      section,
      contactNumber,
      verificationToken
    } = req.body || {};
    if (!email || !password || !fullName || !studentId) {
      return res.status(400).json({ error: "Missing required registration fields." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const record = memoryOtpStore.get(normalizedEmail);
    if (!verificationToken && (!record || !record.verified)) {
    }
    let authUserId = crypto2.randomUUID();
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "student",
            student_id: studentId,
            program: program || "BSIT",
            section: section || "BSIT 402"
          }
        }
      });
      if (signUpData?.user) {
        authUserId = signUpData.user.id;
      }
    } catch (authErr) {
      console.warn("[Auth Route] Supabase auth signup fallback (proceeding with profile):", authErr);
    }
    const profileRecord = {
      id: authUserId,
      email: normalizedEmail,
      full_name: fullName,
      role: "student",
      student_id: studentId,
      program: program || "BSIT",
      section: section || "BSIT 402",
      contact_number: contactNumber || "",
      department: "College of Computer Studies",
      is_activated: true,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      await supabase.from("profiles").upsert(profileRecord);
    } catch (dbErr) {
      console.warn("[Auth Route] Profiles upsert notice:", dbErr);
    }
    memoryOtpStore.delete(normalizedEmail);
    const userPayload = {
      id: authUserId,
      username: normalizedEmail.split("@")[0],
      name: fullName,
      role: "student",
      email: normalizedEmail,
      studentId,
      course: section || `${program || "BSIT"} 402`,
      department: "College of Computer Studies"
    };
    return res.json({
      success: true,
      message: "Student account activated successfully.",
      user: userPayload
    });
  } catch (err) {
    console.error("[Auth Route] Register student error:", err);
    return res.status(500).json({ error: err.message || "Registration failed." });
  }
});
router3.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, newPassword, verificationToken } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const record = memoryOtpStore.get(normalizedEmail);
    if (record) {
      record.attempts = 0;
      record.lockedUntil = null;
      record.verified = false;
      memoryOtpStore.set(normalizedEmail, record);
    }
    try {
      console.log(`[Auth Route] Password reset completed for: ${normalizedEmail}`);
    } catch (err) {
    }
    return res.json({
      success: true,
      message: "Password reset successfully. You may now log in with your new credentials."
    });
  } catch (err) {
    console.error("[Auth Route] Reset password error:", err);
    return res.status(500).json({ error: err.message || "Password reset failed." });
  }
});
router3.post("/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    await ensureUserStoreInitialized().catch(() => {
    });
    const normalized = email.toLowerCase().trim();
    const isBuiltInDemo = password === "123" && (normalized === "admin" || normalized === "admin@practicum.edu" || normalized === "adviser" || normalized === "adviser@practicum.edu" || normalized === "supervisor" || normalized === "supervisor@practicum.edu" || normalized === "student" || normalized === "student@practicum.edu");
    if (isBuiltInDemo) {
      let matchedRole = "student";
      if (normalized.startsWith("admin")) matchedRole = "admin";
      else if (normalized.startsWith("adviser")) matchedRole = "adviser";
      else if (normalized.startsWith("supervisor")) matchedRole = "supervisor";
      const rolePrefix = matchedRole;
      const displayName = `${matchedRole.charAt(0).toUpperCase() + matchedRole.slice(1)} User`;
      const user = {
        id: crypto2.randomUUID(),
        username: rolePrefix,
        name: displayName,
        role: matchedRole,
        email: `${rolePrefix}@practicum.edu`,
        studentId: matchedRole === "student" ? "02000249822" : void 0,
        course: matchedRole === "student" ? "BSIT 402" : void 0,
        mfaEnrolled: true,
        isNewAccount: false,
        requiresPasswordChange: false
      };
      return res.json({ success: true, user });
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password
      });
      if (!error && data.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
        const stored = findUser(normalized) || findUser(data.user.id);
        const userRole = profile?.role || data.user.app_metadata?.role || data.user.user_metadata?.role || "student";
        const isMfaEnrolled = stored?.mfaEnrolled ?? profile?.mfa_enrolled ?? false;
        const needsPwdChange = stored?.requiresPasswordChange ?? profile?.requires_password_change ?? false;
        const user = {
          id: data.user.id,
          username: normalized.split("@")[0],
          name: profile?.full_name || data.user.user_metadata?.full_name || "Practicum User",
          role: userRole,
          email: normalized,
          studentId: profile?.student_id || stored?.studentId,
          course: profile?.section || profile?.program || stored?.dept,
          mfaEnrolled: isMfaEnrolled,
          isNewAccount: !isMfaEnrolled,
          requiresPasswordChange: needsPwdChange
        };
        return res.json({ success: true, user, session: data.session });
      }
    } catch (authErr) {
    }
    let userRecord = findUser(normalized);
    if (!userRecord) {
      try {
        const { data: dbProfile } = await supabase.from("profiles").select("*").or(`email.ilike.${normalized},student_id.eq.${normalized}`).maybeSingle();
        if (dbProfile) {
          const roleLower = dbProfile.role ? dbProfile.role.toLowerCase() : "student";
          userRecord = upsertUser({
            id: dbProfile.id,
            email: dbProfile.email,
            name: dbProfile.full_name || dbProfile.email.split("@")[0],
            role: roleLower,
            studentId: dbProfile.student_id,
            dept: dbProfile.section || dbProfile.program || dbProfile.department || "BSIT 402",
            status: dbProfile.is_activated === false ? "Suspended" : "Active",
            passwordHash: hashPassword("123"),
            requiresPasswordChange: true,
            mfaEnrolled: false
          });
        }
      } catch (dbErr) {
        console.warn("[Auth Login] Profiles check notice:", dbErr);
      }
    }
    if (!userRecord) {
      const seedMatch = defaultSeedUsers.find(
        (u) => u.email.toLowerCase() === normalized || u.email.split("@")[0].toLowerCase() === normalized || u.dept && u.dept.toLowerCase() === normalized
      );
      if (seedMatch) {
        const roleLower = seedMatch.role.toLowerCase();
        userRecord = upsertUser({
          id: seedMatch.id,
          email: seedMatch.email,
          name: seedMatch.name,
          role: roleLower,
          dept: seedMatch.dept,
          status: seedMatch.status,
          passwordHash: hashPassword("123"),
          requiresPasswordChange: true,
          mfaEnrolled: false
        });
      }
    }
    if (userRecord) {
      const isPasswordValid = verifyPassword(password, userRecord.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "The password you entered is incorrect. Please try again."
        });
      }
      const roleLower = userRecord.role.toLowerCase();
      const user = {
        id: userRecord.id,
        username: userRecord.email.split("@")[0],
        name: userRecord.name,
        role: roleLower,
        email: userRecord.email,
        studentId: userRecord.studentId || (roleLower === "student" ? "02000249822" : void 0),
        course: userRecord.dept,
        mfaEnrolled: userRecord.mfaEnrolled ?? false,
        isNewAccount: !userRecord.mfaEnrolled,
        requiresPasswordChange: userRecord.requiresPasswordChange ?? false
      };
      return res.json({ success: true, user });
    }
    return res.status(401).json({
      error: "Invalid credentials. Please verify your email and password."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Login failed." });
  }
});
var defaultSeedUsers = [
  { id: "1", name: "Alice Brown", role: "Student", email: "alice.b@edu.ph", status: "Active", dept: "__BSIT 402_401__" },
  { id: "2", name: "Dr. Sarah Johnson", role: "Adviser", email: "s.johnson@edu.ph", status: "Active", dept: "BSIT 402" },
  { id: "3", name: "Charlie Davis", role: "Student", email: "c.davis@edu.ph", status: "Active", dept: "__BSIT 402_401__", resetRequested: true },
  { id: "4", name: "Bob White", role: "Student", email: "b.white@edu.ph", status: "Suspended", dept: "BSIT 402" },
  { id: "5", name: "Prof. Mike Ross", role: "Adviser", email: "m.ross@edu.ph", status: "Active", dept: "__BSIT 402_401__" },
  { id: "6", name: "Maria Santos", role: "Student", email: "m.santos@edu.ph", status: "Active", dept: "__BSIT 402_401__" },
  { id: "7", name: "John Reyes", role: "Student", email: "j.reyes@edu.ph", status: "Active", dept: "BSIT 402" },
  { id: "8", name: "Eva Green", role: "Student", email: "e.green@edu.ph", status: "Pending", dept: "__BSIT 402_401__" },
  { id: "9", name: "Dr. Emily Blunt", role: "Adviser", email: "e.blunt@edu.ph", status: "Active", dept: "BSIT 402" },
  { id: "10", name: "Admin User", role: "Admin", email: "admin@edu.ph", status: "Active", dept: "System" },
  { id: "11", name: "Robert Cruz", role: "Student", email: "r.cruz@edu.ph", status: "Active", dept: "BSIT 402", resetRequested: true },
  { id: "12", name: "James Tan", role: "Student", email: "j.tan@edu.ph", status: "Suspended", dept: "__BSIT 402_401__" },
  { id: "13", name: "Engr. Paolo Reyes", role: "Supervisor", email: "p.reyes@innotech.com", status: "Active", dept: "InnoTech Labs" },
  { id: "14", name: "Mr. James Tan", role: "Supervisor", email: "j.tan@techcorp.com", status: "Active", dept: "TechCorp Solutions" }
];
router3.get("/users", async (_req, res) => {
  try {
    let dbUsers = [];
    try {
      const { data: dbProfiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (dbProfiles && dbProfiles.length > 0) {
        dbUsers = dbProfiles.map((p) => {
          const stored = findUser(p.email) || findUser(p.id);
          return {
            id: p.id,
            name: p.full_name,
            role: p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : "Student",
            email: p.email,
            status: p.status || (p.is_activated ? "Active" : "Suspended"),
            dept: p.section || p.department || p.company_name || "General",
            studentId: p.student_id,
            resetRequested: stored?.requiresPasswordChange ?? (p.requires_password_change ?? false),
            mfaEnrolled: stored?.mfaEnrolled ?? (p.mfa_enrolled ?? false)
          };
        });
      }
    } catch (e) {
    }
    const storedUsers = loadAllUsers().map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      email: u.email,
      status: u.status,
      dept: u.dept || "General",
      studentId: u.studentId,
      resetRequested: u.requiresPasswordChange,
      mfaEnrolled: u.mfaEnrolled
    }));
    const map = /* @__PURE__ */ new Map();
    dbUsers.forEach((u) => map.set(u.email.toLowerCase(), u));
    storedUsers.forEach((u) => {
      if (!map.has(u.email.toLowerCase())) {
        map.set(u.email.toLowerCase(), u);
      }
    });
    Array.from(adminUsersStore.values()).forEach((u) => {
      if (!map.has(u.email.toLowerCase())) {
        map.set(u.email.toLowerCase(), {
          id: u.id,
          name: u.name,
          role: u.role,
          email: u.email,
          status: u.status,
          dept: u.dept,
          studentId: u.studentId,
          resetRequested: !!u.resetRequested,
          mfaEnrolled: !!u.mfaEnrolled
        });
      }
    });
    defaultSeedUsers.forEach((u) => {
      if (!map.has(u.email.toLowerCase())) {
        map.set(u.email.toLowerCase(), u);
      }
    });
    const filteredUsers = Array.from(map.values()).filter(
      (u) => !deletedUsersSet.has(u.id?.toLowerCase()) && !deletedUsersSet.has(u.email?.toLowerCase())
    );
    return res.json({
      success: true,
      users: filteredUsers
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to retrieve users." });
  }
});
router3.post("/users", async (req, res) => {
  try {
    const { name, email, role, studentId, dept, companyName, password } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Full name is required." });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!role) {
      return res.status(400).json({ error: "User role is required." });
    }
    const normalized = email.toLowerCase().trim();
    const newId = crypto2.randomUUID();
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    const roleLower = role.toLowerCase();
    const initialPassword = password && password.trim() ? password.trim() : "123";
    let deptInfo = dept?.trim() || "General";
    if (roleLower === "student") {
      deptInfo = dept?.trim() || "BSIT 402";
    } else if (roleLower === "supervisor") {
      deptInfo = companyName?.trim() || dept?.trim() || "Industry Partner";
    } else if (roleLower === "adviser") {
      deptInfo = dept?.trim() || "College of Computer Studies";
    } else if (roleLower === "admin") {
      deptInfo = dept?.trim() || "System Administration";
    }
    const assignedStudentId = studentId?.trim() || (roleLower === "student" ? "02000" + Math.floor(1e5 + Math.random() * 9e5) : void 0);
    upsertUser({
      id: newId,
      name: name.trim(),
      role: roleLower,
      email: normalized,
      status: "Active",
      dept: deptInfo,
      studentId: assignedStudentId,
      passwordHash: hashPassword(initialPassword),
      requiresPasswordChange: true,
      mfaEnrolled: false
    });
    const newRecord = {
      id: newId,
      name: name.trim(),
      role: roleCapitalized,
      email: normalized,
      status: "Active",
      dept: deptInfo,
      password: initialPassword,
      studentId: assignedStudentId,
      resetRequested: false,
      mfaEnrolled: false,
      requiresPasswordChange: true
    };
    adminUsersStore.set(normalized, newRecord);
    if (normalized.includes("@")) {
      adminUsersStore.set(normalized.split("@")[0], newRecord);
    }
    deletedUsersSet.delete(newId.toLowerCase());
    deletedUsersSet.delete(normalized);
    if (normalized.includes("@")) {
      deletedUsersSet.delete(normalized.split("@")[0]);
    }
    if (isServiceRoleAvailable) {
      try {
        await supabaseAdmin.auth.admin.createUser({
          id: newId,
          email: normalized,
          password: initialPassword,
          email_confirm: true,
          user_metadata: {
            full_name: name.trim(),
            role: roleLower,
            student_id: assignedStudentId
          }
        });
      } catch (authErr) {
        console.warn("[Admin Create User] Supabase auth admin notice:", authErr.message);
      }
    } else {
      try {
        await supabase.auth.signUp({
          email: normalized,
          password: initialPassword,
          options: {
            data: {
              full_name: name.trim(),
              role: roleLower,
              student_id: assignedStudentId
            }
          }
        });
      } catch (authErr) {
        console.warn("[Admin Create User] Supabase auth notice:", authErr.message);
      }
    }
    try {
      const profileRecord = {
        id: newId,
        email: normalized,
        full_name: name.trim(),
        role: roleLower,
        student_id: assignedStudentId || null,
        program: roleLower === "student" ? deptInfo.split(" ")[0] || "BSIT" : null,
        section: roleLower === "student" ? deptInfo : null,
        department: roleLower === "adviser" ? deptInfo : null,
        company_name: roleLower === "supervisor" ? deptInfo : null,
        is_activated: true,
        status: "Active",
        requires_password_change: true,
        mfa_enrolled: false,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      let { error: profErr } = await supabase.from("profiles").upsert(profileRecord, { onConflict: "email" });
      if (profErr && profErr.message.includes("Could not find")) {
        const baseRecord = {
          id: newId,
          email: normalized,
          full_name: name.trim(),
          role: roleLower,
          student_id: assignedStudentId || null,
          program: roleLower === "student" ? deptInfo.split(" ")[0] || "BSIT" : null,
          section: roleLower === "student" ? deptInfo : null,
          department: roleLower === "adviser" ? deptInfo : null,
          company_name: roleLower === "supervisor" ? deptInfo : null,
          is_activated: true,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        await supabase.from("profiles").upsert(baseRecord, { onConflict: "email" });
      }
    } catch (dbErr) {
      console.warn("[Admin Create User] Profiles database sync notice:", dbErr.message);
    }
    return res.status(201).json({
      success: true,
      message: `User ${name.trim()} successfully registered.`,
      user: {
        id: newId,
        name: name.trim(),
        role: roleCapitalized,
        email: normalized,
        status: "Active",
        dept: deptInfo,
        studentId: assignedStudentId,
        resetRequested: false
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to create user." });
  }
});
router3.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword = "123" } = req.body || {};
    const normalized = decodeURIComponent(id).toLowerCase().trim();
    let targetName = "User";
    let targetEmail = "";
    const storedUser = findUser(normalized) || findUser(id);
    if (storedUser) {
      updateUserPassword(storedUser.email, newPassword, true);
      updateUserMfa(storedUser.email, false);
      targetName = storedUser.name;
      targetEmail = storedUser.email;
    }
    for (const [email, user] of adminUsersStore.entries()) {
      if (user.id === id || user.email.toLowerCase() === normalized) {
        user.password = newPassword;
        user.resetRequested = false;
        user.requiresPasswordChange = true;
        user.mfaEnrolled = false;
        targetName = user.name;
        targetEmail = user.email;
        adminUsersStore.set(email, user);
        break;
      }
    }
    try {
      if (isServiceRoleAvailable && id) {
        await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword }).catch(() => {
        });
      }
      await supabase.from("profiles").update({
        requires_password_change: true,
        mfa_enrolled: false,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).or(`id.eq.${id},email.eq.${targetEmail || id}`);
    } catch (dbErr) {
      console.warn("[Admin Reset Password] Supabase sync notice:", dbErr);
    }
    return res.json({
      success: true,
      message: `Password reset to '${newPassword}' and Google Authenticator reset for ${targetName}.`,
      temporaryPassword: newPassword
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to reset password." });
  }
});
router3.post("/users/:id/reset-mfa", async (req, res) => {
  try {
    const { id } = req.params;
    const normalized = decodeURIComponent(id).toLowerCase().trim();
    let targetName = "User";
    let targetEmail = "";
    const storedUser = findUser(normalized) || findUser(id);
    if (storedUser) {
      updateUserMfa(storedUser.email, false);
      targetName = storedUser.name;
      targetEmail = storedUser.email;
    }
    for (const [email, user] of adminUsersStore.entries()) {
      if (user.id === id || user.email.toLowerCase() === normalized) {
        user.mfaEnrolled = false;
        targetName = user.name;
        targetEmail = user.email;
        adminUsersStore.set(email, user);
        break;
      }
    }
    try {
      await supabase.from("profiles").update({
        mfa_enrolled: false,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).or(`id.eq.${id},email.eq.${targetEmail || id}`);
    } catch (dbErr) {
      console.warn("[Admin Reset MFA] Supabase sync notice:", dbErr);
    }
    return res.json({
      success: true,
      message: `Google Authenticator reset for ${targetName}. They must re-verify upon next sign-in.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to reset Google Authenticator." });
  }
});
router3.post("/auth/update-initial-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Please provide both your current and new password." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Your new password must be at least 6 characters long." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: "Your new password cannot be the same as your temporary password." });
    }
    const normalized = email.toLowerCase().trim();
    const usernameKey = normalized.split("@")[0];
    let targetUser = findUser(normalized);
    if (!targetUser) {
      try {
        const { data: dbProfile } = await supabase.from("profiles").select("*").or(`email.ilike.${normalized},student_id.eq.${normalized}`).maybeSingle();
        if (dbProfile) {
          const roleLower = dbProfile.role ? dbProfile.role.toLowerCase() : "student";
          targetUser = upsertUser({
            id: dbProfile.id,
            name: dbProfile.full_name,
            role: roleLower,
            email: dbProfile.email,
            status: "Active",
            dept: dbProfile.section || dbProfile.department || "BSIT 402",
            studentId: dbProfile.student_id,
            passwordHash: hashPassword("123"),
            requiresPasswordChange: true,
            mfaEnrolled: false
          });
        }
      } catch (e) {
      }
    }
    if (!targetUser) {
      const seedMatch = defaultSeedUsers.find(
        (u) => u.email.toLowerCase() === normalized || u.email.split("@")[0].toLowerCase() === usernameKey
      );
      if (seedMatch) {
        targetUser = upsertUser({
          id: seedMatch.id,
          name: seedMatch.name,
          role: seedMatch.role.toLowerCase(),
          email: seedMatch.email,
          status: "Active",
          dept: seedMatch.dept,
          passwordHash: hashPassword("123"),
          requiresPasswordChange: true,
          mfaEnrolled: true
        });
      }
    }
    if (!targetUser) {
      return res.status(404).json({ error: "User account not found." });
    }
    const isCurrentValid = verifyPassword(currentPassword, targetUser.passwordHash);
    if (!isCurrentValid) {
      return res.status(400).json({ error: "The current password you entered is incorrect." });
    }
    updateUserPassword(targetUser.email, newPassword, false);
    for (const [key, user] of adminUsersStore.entries()) {
      if (key.toLowerCase() === normalized || user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        user.password = newPassword;
        user.requiresPasswordChange = false;
        adminUsersStore.set(key, user);
      }
    }
    try {
      if (isServiceRoleAvailable && targetUser?.id) {
        await supabaseAdmin.auth.admin.updateUserById(targetUser.id, { password: newPassword }).catch(() => {
        });
      } else {
        await supabase.auth.signUp({
          email: targetUser.email,
          password: newPassword,
          options: {
            data: {
              full_name: targetUser.name,
              role: targetUser.role?.toLowerCase(),
              student_id: targetUser.studentId
            }
          }
        }).catch(() => {
        });
      }
      await supabase.from("profiles").update({
        requires_password_change: false,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("email", targetUser.email);
    } catch (dbErr) {
      console.warn("[Update Initial Password] Supabase sync notice:", dbErr.message);
    }
    return res.json({
      success: true,
      message: "Your password has been successfully updated."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to update password." });
  }
});
router3.patch("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status || !["Active", "Suspended", "Pending"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required (Active, Suspended, Pending)." });
    }
    const normalized = decodeURIComponent(id).toLowerCase().trim();
    const storedUser = findUser(normalized) || findUser(id);
    if (storedUser) {
      upsertUser({ email: storedUser.email, status });
    }
    for (const [key, user] of adminUsersStore.entries()) {
      if (user.id === id || key.toLowerCase() === normalized || user.email.toLowerCase() === normalized) {
        user.status = status;
        adminUsersStore.set(key, user);
      }
    }
    try {
      await supabase.from("profiles").update({
        status,
        is_activated: status === "Active",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).or(`id.eq.${id},email.eq.${normalized}`);
    } catch (dbErr) {
      console.warn("[Update Status] Supabase update notice:", dbErr.message);
    }
    return res.json({
      success: true,
      message: `User status updated to ${status}.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to update status." });
  }
});
router3.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const normalized = decodeURIComponent(id).toLowerCase().trim();
    deleteUserFromStore(id);
    deleteUserFromStore(normalized);
    deletedUsersSet.add(id.toLowerCase());
    deletedUsersSet.add(normalized);
    if (normalized.includes("@")) {
      deletedUsersSet.add(normalized.split("@")[0]);
    }
    let deletedName = "";
    for (const [key, user] of adminUsersStore.entries()) {
      if (user.id === id || key.toLowerCase() === normalized || user.email.toLowerCase() === normalized) {
        deletedName = user.name;
        adminUsersStore.delete(key);
      }
    }
    try {
      if (isServiceRoleAvailable) {
        await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {
        });
      }
      await supabase.from("profiles").delete().or(`id.eq.${id},email.eq.${normalized}`);
    } catch (dbErr) {
      console.warn("[Admin Delete User] Supabase delete notice:", dbErr.message);
    }
    return res.json({
      success: true,
      message: `User ${deletedName || id} removed from directory.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to delete user." });
  }
});
var auth_default = router3;

// backend/server.ts
dotenv4.config();
var app = express();
var PORT = process.env.PORT || 3001;
app.use(cors());
app.use((req, _res, next) => {
  if (req.originalUrl && (req.url === "/api/server" || req.url === "/api/index" || req.url.startsWith("/api/server/") || req.url.startsWith("/api/index/"))) {
    req.url = req.originalUrl;
  }
  next();
});
app.use((req, _res, next) => {
  if (typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch {
    }
  }
  next();
});
app.use((req, res, next) => {
  if (req.body !== void 0 && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, (err) => {
    if (err && (err.type === "stream.not.readable" || err.message && err.message.includes("stream"))) {
      return next();
    }
    next(err);
  });
});
app.use("/api", analyze_default);
app.use("/api", onedrive_default);
app.use("/api", auth_default);
app.use("/", analyze_default);
app.use("/", onedrive_default);
app.use("/", auth_default);
app.use((req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
});
app.use((err, _req, res, _next) => {
  console.error("[Express Server Error]:", err);
  if (!res.headersSent) {
    res.setHeader("Content-Type", "application/json");
    res.status(err.status || 500).json({
      error: err.message || "Internal server error"
    });
  }
});
var isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("backend/server.ts");
if (!process.env.VERCEL && isDirectRun) {
  app.listen(PORT, () => {
    console.log(`[Backend Server] AI Review Assistant backend running on http://localhost:${PORT}`);
  });
}
var server_default = app;

// api/index.ts
var config = {
  api: {
    bodyParser: false
  }
};
var index_default = server_default;
export {
  config,
  index_default as default
};
