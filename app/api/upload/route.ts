import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer | null = null;
    let extension = "png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);

      const mime = file.type || "image/png";
      if (mime.includes("jpeg") || mime.includes("jpg")) extension = "jpg";
      else if (mime.includes("webp")) extension = "webp";
      else if (mime.includes("gif")) extension = "gif";
    } else {
      // JSON body with base64 string
      const body = await req.json();
      const photoDataUrl = body.photoDataUrl || body.posterDataUrl;
      const folderName = body.folder || "avatars";

      if (!photoDataUrl || typeof photoDataUrl !== "string") {
        return NextResponse.json({ error: "No image data provided" }, { status: 400 });
      }

      // If already a relative server URL (e.g. /uploads/...), return as is
      if (photoDataUrl.startsWith("/uploads/")) {
        return NextResponse.json({ success: true, url: photoDataUrl });
      }

      const matches = photoDataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "Invalid base64 image data" }, { status: 400 });
      }

      extension = matches[1] === "jpeg" ? "jpg" : matches[1];
      fileBuffer = Buffer.from(matches[2], "base64");

      // Ensure public/uploads/[folderName] directory exists
      const folder = folderName === "posters" ? "posters" : "avatars";
      const prefix = folder === "posters" ? "poster" : "avatar";
      const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, fileBuffer);

      const relativeUrl = `/uploads/${folder}/${fileName}`;
      console.log(`✅ Image saved to disk: ${filePath} (${relativeUrl})`);

      return NextResponse.json({
        success: true,
        message: "Image uploaded successfully",
        url: relativeUrl,
      });
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: "Failed to process image file" }, { status: 400 });
    }

    // Default multipart handling
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, fileBuffer);
    const relativeUrl = `/uploads/avatars/${fileName}`;
    console.log(`✅ Profile Avatar saved to disk: ${filePath} (${relativeUrl})`);

    return NextResponse.json({
      success: true,
      message: "Profile avatar uploaded successfully",
      url: relativeUrl,
    });
  } catch (err: any) {
    console.error("Profile Avatar Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
