import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const TARGET_BASE_URL = "https://api.cloud.mtos-org.site/api";
const STORAGE_PATH = "/tmp/mtos_storage.json";

// Types
interface SavedFolder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

interface SavedFile {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  folderId?: string | null;
  isStarred?: boolean;
  isTrashed?: boolean;
}

interface SavedBillingLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  cost: number;
  ip: string;
}

interface SavedApiKey {
  userId: string;
  key: string;
}

interface StorageData {
  files: SavedFile[];
  folders: SavedFolder[];
  logs: SavedBillingLog[];
  apiKeys: SavedApiKey[];
}

// Helpers
function loadStorage(): StorageData {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const content = fs.readFileSync(STORAGE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      return {
        files: parsed.files || [],
        folders: parsed.folders || [],
        logs: parsed.logs || [],
        apiKeys: parsed.apiKeys || []
      };
    }
  } catch (e) {
    console.error("Failed to load local storage:", e);
  }
  return { files: [], folders: [], logs: [], apiKeys: [] };
}

function saveStorage(data: any) {
  try {
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save local storage:", e);
  }
}

function getUserIdFromHeaders(authHeader: string | null, apiKeyHeader: string | null): string {
  const storage = loadStorage();

  // 1. Try x-api-key header first
  if (apiKeyHeader) {
    const cleanKey = apiKeyHeader.trim();
    const found = storage.apiKeys.find(k => k.key === cleanKey);
    if (found) return found.userId;
  }

  // 2. Try Authorization header (could be JWT Bearer or direct Bearer API Key)
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    
    // Check if API Key was passed in Bearer
    if (token.startsWith("mtos_live_")) {
      const found = storage.apiKeys.find(k => k.key === token);
      if (found) return found.userId;
    }

    const parts = token.split(".");
    if (parts.length < 2) return "anonymous";
    try {
      // Safe base64url decoding
      let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      const payloadJson = Buffer.from(base64, "base64").toString("utf-8");
      const payload = JSON.parse(payloadJson);
      return payload.data?.id ? String(payload.data.id) : "anonymous";
    } catch (e) {
      return "anonymous";
    }
  }

  return "anonymous";
}

function getUserDetailsFromHeaders(authHeader: string | null): { email: string; country: string } {
  let email = "anonymous@mtos-org.com";
  let country = "Global";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const parts = token.split(".");
    if (parts.length >= 2) {
      try {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
          base64 += "=";
        }
        const payloadJson = Buffer.from(base64, "base64").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        if (payload.data?.email) email = payload.data.email;
        if (payload.data?.country) country = payload.data.country;
      } catch (e) {
        // ignore
      }
    }
  }
  return { email, country };
}

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === "string" ? Buffer.from(str) : str;
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function generateJWT(payload: any, secret: string): string {
  const header = { typ: "JWT", alg: "HS256" };
  const base64Header = base64UrlEncode(JSON.stringify(header));
  const base64Payload = base64UrlEncode(JSON.stringify(payload));
  
  const signatureInput = `${base64Header}.${base64Payload}`;
  const signature = crypto.createHmac("sha256", secret)
    .update(signatureInput)
    .digest();
  const base64Signature = base64UrlEncode(signature);
  
  return `${signatureInput}.${base64Signature}`;
}

async function handleProxy(req: NextRequest, pathSegments: string[]) {
  try {
    const pathStr = pathSegments.join("/");
    const urlObj = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");
    const userId = getUserIdFromHeaders(authHeader, apiKeyHeader);

    // 1. Intercept Sandbox File Operations
    if (pathSegments[0] === "files") {
      if (pathSegments[1] === "list") {
        try {
          const { email, country } = getUserDetailsFromHeaders(authHeader);
          
          // Fetch physical file listing from storage.php
          const listUrl = `https://api.cloud.mtos-org.site/storage.php?list=1&country=${encodeURIComponent(country)}&email=${encodeURIComponent(email)}`;
          const listRes = await fetch(listUrl);
          
          const storage = loadStorage();
          let userFiles = storage.files.filter(f => f.userId === userId);
          
          if (listRes.ok) {
            const listJson = await listRes.json();
            if (listJson.success && Array.isArray(listJson.files)) {
              const remoteFiles = listJson.files;
              const updatedFiles: SavedFile[] = [];
              
              // Keep files belonging to other users
              storage.files.forEach(f => {
                if (f.userId !== userId) {
                  updatedFiles.push(f);
                }
              });
              
              // Map remote files to virtual catalog
              remoteFiles.forEach((rf: any) => {
                const existing = userFiles.find(uf => uf.name === rf.name);
                if (existing) {
                  existing.size = rf.size || existing.size;
                  existing.type = rf.type || existing.type;
                  updatedFiles.push(existing);
                } else {
                  updatedFiles.push({
                    id: crypto.randomUUID(),
                    userId,
                    name: rf.name,
                    size: rf.size || 0,
                    type: rf.type || "application/octet-stream",
                    uploadedAt: rf.modified || new Date().toISOString(),
                    folderId: null,
                    isStarred: false,
                    isTrashed: false
                  });
                }
              });
              
              storage.files = updatedFiles;
              saveStorage(storage);
              userFiles = storage.files.filter(f => f.userId === userId);
              return NextResponse.json({
                success: true,
                files: userFiles,
                quota: listJson.quota
              });
            }
          }
          return NextResponse.json(userFiles);
        } catch (err) {
          console.error("Synced list fallback:", err);
          const storage = loadStorage();
          const userFiles = storage.files.filter(f => f.userId === userId);
          return NextResponse.json(userFiles);
        }
      }
      
      if (pathSegments[1] === "upload") {
        try {
          const formData = await req.formData();
          const fileEntry = formData.get("file") as any;
          const folderId = formData.get("folderId") as string || null;
          if (!fileEntry) {
            return NextResponse.json({ error: "No file uploaded in the payload." }, { status: 400 });
          }
          
          const { email, country } = getUserDetailsFromHeaders(authHeader);
          
          // Forward file physically to storage.php
          const forwardFormData = new FormData();
          forwardFormData.append("country", country);
          forwardFormData.append("email", email);
          forwardFormData.append("file", fileEntry);
          
          const forwardRes = await fetch("https://api.cloud.mtos-org.site/storage.php", {
            method: "POST",
            body: forwardFormData,
          });
          
          if (!forwardRes.ok) {
            const errText = await forwardRes.text();
            return NextResponse.json({ error: `Upload to storage server failed: ${errText}` }, { status: forwardRes.status });
          }
          
          const forwardJson = await forwardRes.json();
          if (!forwardJson.success) {
            return NextResponse.json({ error: forwardJson.message || "Upload rejected by storage server." }, { status: 400 });
          }
          
          const uploadedFile = forwardJson.file || {};
          const storage = loadStorage();
          const newFile: SavedFile = {
            id: crypto.randomUUID(),
            userId,
            name: uploadedFile.name || fileEntry.name || "unnamed_file",
            size: uploadedFile.size || fileEntry.size || 0,
            type: uploadedFile.type || fileEntry.type || "application/octet-stream",
            uploadedAt: new Date().toISOString(),
            folderId: folderId,
            isStarred: false,
            isTrashed: false
          };
          storage.files.push(newFile);
          
          const newLog: SavedBillingLog = {
            id: crypto.randomUUID(),
            userId,
            action: `Upload File: ${newFile.name}`,
            timestamp: new Date().toLocaleString(),
            cost: 0.0005 + (newFile.size / (1024 * 1024)) * 0.001,
            ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
          };
          storage.logs.push(newLog);
          saveStorage(storage);
          
          return NextResponse.json({ success: true, file: newFile });
        } catch (e: any) {
          console.error("Local upload handling error:", e);
          return NextResponse.json({ error: e.message || "Failed to process storage upload" }, { status: 500 });
        }
      }

      if (pathSegments[1] === "delete") {
        try {
          const { fileId, permanent } = await req.json();
          const storage = loadStorage();
          const fileIndex = storage.files.findIndex(f => f.id === fileId && f.userId === userId);
          if (fileIndex === -1) {
            return NextResponse.json({ error: "File not found." }, { status: 404 });
          }
          
          const fileName = storage.files[fileIndex].name;
          if (permanent) {
            const { email, country } = getUserDetailsFromHeaders(authHeader);
            
            // Forward physical delete request to storage.php
            const deleteRes = await fetch("https://api.cloud.mtos-org.site/storage.php", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                country,
                email,
                file: fileName
              })
            });
            
            if (!deleteRes.ok) {
              const errText = await deleteRes.text();
              console.error("Physical delete from server failed:", errText);
            }
            
            storage.files.splice(fileIndex, 1);
          } else {
            storage.files[fileIndex].isTrashed = true;
          }

          const newLog: SavedBillingLog = {
            id: crypto.randomUUID(),
            userId,
            action: permanent ? `Permanently Delete: ${fileName}` : `Move to Trash: ${fileName}`,
            timestamp: new Date().toLocaleString(),
            cost: 0.0001,
            ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
          };
          storage.logs.push(newLog);
          saveStorage(storage);
          return NextResponse.json({ success: true });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Failed to delete file" }, { status: 500 });
        }
      }

      if (pathSegments[1] === "restore") {
        try {
          const { fileId } = await req.json();
          const storage = loadStorage();
          const file = storage.files.find(f => f.id === fileId && f.userId === userId);
          if (!file) {
            return NextResponse.json({ error: "File not found." }, { status: 404 });
          }
          file.isTrashed = false;

          const newLog: SavedBillingLog = {
            id: crypto.randomUUID(),
            userId,
            action: `Restore from Trash: ${file.name}`,
            timestamp: new Date().toLocaleString(),
            cost: 0.0001,
            ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
          };
          storage.logs.push(newLog);
          saveStorage(storage);
          return NextResponse.json({ success: true, file });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Failed to restore file" }, { status: 500 });
        }
      }

      if (pathSegments[1] === "star") {
        try {
          const { fileId, isStarred } = await req.json();
          const storage = loadStorage();
          const file = storage.files.find(f => f.id === fileId && f.userId === userId);
          if (!file) {
            return NextResponse.json({ error: "File not found." }, { status: 404 });
          }
          file.isStarred = isStarred;
          saveStorage(storage);
          return NextResponse.json({ success: true, file });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Failed to star file" }, { status: 500 });
        }
      }

      if (pathSegments[1] === "rename") {
        try {
          const { fileId, name } = await req.json();
          if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
          const storage = loadStorage();
          const file = storage.files.find(f => f.id === fileId && f.userId === userId);
          if (!file) {
            return NextResponse.json({ error: "File not found." }, { status: 404 });
          }
          const oldName = file.name;
          file.name = name;

          const newLog: SavedBillingLog = {
            id: crypto.randomUUID(),
            userId,
            action: `Rename: ${oldName} -> ${name}`,
            timestamp: new Date().toLocaleString(),
            cost: 0.0001,
            ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
          };
          storage.logs.push(newLog);
          saveStorage(storage);
          return NextResponse.json({ success: true, file });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Failed to rename file" }, { status: 500 });
        }
      }

      if (pathSegments[1] === "move") {
        try {
          const { fileId, folderId } = await req.json();
          const storage = loadStorage();
          const file = storage.files.find(f => f.id === fileId && f.userId === userId);
          if (!file) {
            return NextResponse.json({ error: "File not found." }, { status: 404 });
          }
          file.folderId = folderId || null;
          saveStorage(storage);
          return NextResponse.json({ success: true, file });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Failed to move file" }, { status: 500 });
        }
      }
    }

    // 1b. Intercept Folder Operations
    if (pathSegments[0] === "folders") {
      if (pathSegments[1] === "list") {
        const storage = loadStorage();
        const userFolders = storage.folders.filter(f => f.userId === userId);
        return NextResponse.json(userFolders);
      }
      
      if (pathSegments[1] === "create") {
        try {
          const { name } = await req.json();
          if (!name) return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
          const storage = loadStorage();
          const newFolder: SavedFolder = {
            id: crypto.randomUUID(),
            userId,
            name,
            createdAt: new Date().toISOString()
          };
          storage.folders.push(newFolder);

          const newLog: SavedBillingLog = {
            id: crypto.randomUUID(),
            userId,
            action: `Create Folder: ${name}`,
            timestamp: new Date().toLocaleString(),
            cost: 0.0002,
            ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
          };
          storage.logs.push(newLog);
          saveStorage(storage);
          return NextResponse.json({ success: true, folder: newFolder });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Failed to create folder" }, { status: 500 });
        }
      }

      if (pathSegments[1] === "delete") {
        try {
          const { folderId } = await req.json();
          const storage = loadStorage();
          const folderIndex = storage.folders.findIndex(f => f.id === folderId && f.userId === userId);
          if (folderIndex === -1) {
            return NextResponse.json({ error: "Folder not found." }, { status: 404 });
          }
          const folderName = storage.folders[folderIndex].name;
          storage.folders.splice(folderIndex, 1);
          
          // Move folder's files to root
          storage.files.forEach(f => {
            if (f.folderId === folderId && f.userId === userId) {
              f.folderId = null;
            }
          });

          const newLog: SavedBillingLog = {
            id: crypto.randomUUID(),
            userId,
            action: `Delete Folder: ${folderName}`,
            timestamp: new Date().toLocaleString(),
            cost: 0.0001,
            ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
          };
          storage.logs.push(newLog);
          saveStorage(storage);
          return NextResponse.json({ success: true });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Failed to delete folder" }, { status: 500 });
        }
      }
    }

    // 2. Intercept Billing Operations
    if (pathSegments[0] === "billing") {
      if (pathSegments[1] === "logs") {
        const storage = loadStorage();
        let userLogs = storage.logs.filter(l => l.userId === userId);
        
        // Seed initial friendly log entries to make user interface looks professional on first login
        if (userLogs.length === 0 && userId !== "anonymous") {
          const seedLogs: SavedBillingLog[] = [
            {
              id: crypto.randomUUID(),
              userId,
              action: "Cloud Virtual Node Initialization",
              timestamp: new Date(Date.now() - 3600000).toLocaleString(),
              cost: 0.0000,
              ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
            },
            {
              id: crypto.randomUUID(),
              userId,
              action: "JWT Bearer Verification Handshake",
              timestamp: new Date(Date.now() - 1800000).toLocaleString(),
              cost: 0.0001,
              ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
            }
          ];
          storage.logs.push(...seedLogs);
          saveStorage(storage);
          userLogs = seedLogs;
        }
        return NextResponse.json(userLogs);
      }
      
      if (pathSegments[1] === "keygen") {
        const apiKeyStr = `mtos_live_${crypto.randomBytes(24).toString("hex")}`;
        const storage = loadStorage();
        const existingIndex = storage.apiKeys.findIndex(k => k.userId === userId);
        if (existingIndex > -1) {
          storage.apiKeys[existingIndex].key = apiKeyStr;
        } else {
          storage.apiKeys.push({ userId, key: apiKeyStr });
        }
        
        const newLog: SavedBillingLog = {
          id: crypto.randomUUID(),
          userId,
          action: "Secure API Credential Keygen",
          timestamp: new Date().toLocaleString(),
          cost: 0.0020,
          ip: req.headers.get("x-forwarded-for") || "127.0.0.1"
        };
        storage.logs.push(newLog);
        saveStorage(storage);
        
        return NextResponse.json({ success: true, key: apiKeyStr });
      }
    }

    // 3. Fallback: Proxy authentication and signup/login directly to external server
    let targetUrl = `${TARGET_BASE_URL}/${pathStr}${urlObj.search}`;

    const headersToForward = new Headers();
    if (req.headers.has('authorization')) {
      headersToForward.set('authorization', req.headers.get('authorization')!);
    }
    if (req.headers.has('content-type')) {
      headersToForward.set('content-type', req.headers.get('content-type')!);
    }

    let body: ArrayBuffer | undefined = undefined;
    let bodyStr = "";
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
      bodyStr = new TextDecoder().decode(body);
    }

    let action = "";
    if (bodyStr) {
      try {
        const parsed = JSON.parse(bodyStr);
        action = parsed.action || "";
      } catch (e) {
        // ignore
      }
    }

    if (pathSegments[0] === "auth") {
      if (action === "signup") {
        targetUrl = `https://api.cloud.mtos-org.site/signup.php`;
      } else if (action === "login") {
        targetUrl = `https://api.cloud.mtos-org.site/login.php`;
      } else {
        targetUrl = `https://api.cloud.mtos-org.site/auth.php`;
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headersToForward,
      body: body,
    });

    const responseHeaders = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('content-type', contentType);
    }

    let resBody: ArrayBuffer | Uint8Array;
    let finalStatus = response.status;

    if (pathSegments[0] === "auth" && response.status === 200) {
      const resText = await response.text();
      try {
        const resJson = JSON.parse(resText);
        if (resJson && resJson.success === false) {
          finalStatus = action === "login" ? 401 : 400;
        } else if (action === "login" && resJson && resJson.user) {
          const jwtPayload = {
            iss: "api.cloud.mtos-org.site",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400, // 24 Hours
            data: {
              id: resJson.user.id,
              name: resJson.user.name,
              email: resJson.user.email || "",
              country: resJson.user.country || "",
            }
          };
          const secret = "SUPER_SECRET_KEY_MTOS_STRONG_VAL_2026";
          const token = generateJWT(jwtPayload, secret);
          resJson.token = token;
        }
        const updatedResText = JSON.stringify(resJson);
        resBody = new TextEncoder().encode(updatedResText);
        responseHeaders.set('content-type', 'application/json; charset=utf-8');
      } catch (err) {
        console.error("Failed to parse/update login response:", err);
        resBody = new TextEncoder().encode(resText);
      }
    } else {
      resBody = await response.arrayBuffer();
    }

    return new NextResponse(resBody as any, {
      status: finalStatus,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: error.message || "Proxy connection error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}
