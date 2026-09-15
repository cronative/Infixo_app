import crypto from "crypto";
import type { ImageFolder } from "@/lib/imageStorage";

type R2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  publicBaseUrl?: string;
};

const R2_REGION = "auto";
const R2_SERVICE = "s3";
const EMPTY_PAYLOAD_HASH = crypto.createHash("sha256").update("").digest("hex");

function getR2Config(): R2Config | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint: endpoint.replace(/\/+$/, ""),
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, ""),
  };
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: string | Buffer) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function awsDateParts(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function encodePath(pathname: string) {
  return pathname
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getSignedHeaders(method: "GET" | "PUT", url: URL, payloadHash: string, contentType?: string) {
  const config = getR2Config();
  if (!config) return null;

  const { amzDate, dateStamp } = awsDateParts();
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (contentType) {
    headers["content-type"] = contentType;
  }

  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((key) => `${key}:${headers[key]}\n`).join("");
  const canonicalRequest = [
    method,
    encodePath(url.pathname),
    url.searchParams.toString(),
    canonicalHeaders,
    signedHeaderNames.join(";"),
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, R2_REGION);
  const serviceKey = hmac(regionKey, R2_SERVICE);
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    ...headers,
    authorization: [
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaderNames.join(";")}`,
      `Signature=${signature}`,
    ].join(", "),
  };
}

export function isR2Configured() {
  return Boolean(getR2Config());
}

export function buildStorageKey(folder: ImageFolder, prefix: string, extension: string) {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "uploads";
  const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "img";
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
  const id = crypto.randomBytes(6).toString("hex");
  return `uploads/${safeFolder}/${safePrefix}_${Date.now()}_${id}.${safeExtension}`;
}

export function getAssetUrlForKey(key: string) {
  const config = getR2Config();
  if (config?.publicBaseUrl) {
    return `${config.publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  return `/api/assets/${key}`;
}

export async function uploadBufferToR2(key: string, buffer: Buffer, contentType: string) {
  const config = getR2Config();
  if (!config) return null;

  const url = new URL(`${config.endpoint}/${config.bucketName}/${key}`);
  const payloadHash = sha256Hex(buffer);
  const signedHeaders = getSignedHeaders("PUT", url, payloadHash, contentType);
  if (!signedHeaders) return null;

  const res = await fetch(url, {
    method: "PUT",
    headers: signedHeaders,
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${errorText || res.statusText}`);
  }

  return getAssetUrlForKey(key);
}

export async function getR2Object(key: string) {
  const config = getR2Config();
  if (!config) return null;

  const safeKey = key.replace(/^\/+/, "");
  if (!safeKey || safeKey.includes("..")) return null;

  const url = new URL(`${config.endpoint}/${config.bucketName}/${safeKey}`);
  const signedHeaders = getSignedHeaders("GET", url, EMPTY_PAYLOAD_HASH);
  if (!signedHeaders) return null;

  const res = await fetch(url, {
    method: "GET",
    headers: signedHeaders,
  });

  if (!res.ok) return null;

  return res;
}
