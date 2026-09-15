import { NextResponse } from "next/server";
import { saveBase64ImageToStorage, saveImageBufferToStorage, ImageFolder } from "@/lib/imageStorage";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer | null = null;
    let extension = "png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const folderParam = (formData.get("folder") as string) || "avatars";
      const validFolder = (["avatars", "posters", "brands", "team", "collaborations", "reviews"].includes(folderParam)
        ? folderParam
        : "avatars") as ImageFolder;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);

      const mime = file.type || "image/png";
      if (mime.includes("jpeg") || mime.includes("jpg")) extension = "jpg";
      else if (mime.includes("webp")) extension = "webp";
      else if (mime.includes("gif")) extension = "gif";
      else if (mime.includes("svg")) extension = "svg";

      const prefix = validFolder.slice(0, -1);
      const storedUrl = await saveImageBufferToStorage(fileBuffer, validFolder, prefix, extension, mime);

      if (!storedUrl) {
        return NextResponse.json({ error: "Failed to store uploaded image" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Image uploaded successfully",
        url: storedUrl,
      });
    }

    // JSON body with base64 string
    const body = await req.json();
    const photoDataUrl = body.photoDataUrl || body.posterDataUrl || body.imageDataUrl || body.imageUrl || body.logoDataUrl;
    const folderName = (body.folder || "avatars") as ImageFolder;
    const validFolder = ["avatars", "posters", "brands", "team", "collaborations", "reviews"].includes(folderName)
      ? folderName
      : "avatars";

    if (!photoDataUrl || typeof photoDataUrl !== "string") {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    // If already a relative server URL (e.g. /uploads/...), return as is
    if (photoDataUrl.startsWith("/uploads/") || photoDataUrl.startsWith("/api/assets/")) {
      return NextResponse.json({ success: true, url: photoDataUrl });
    }

    const prefix = validFolder.slice(0, -1);
    const relativeUrl = await saveBase64ImageToStorage(photoDataUrl, validFolder, prefix);

    if (!relativeUrl) {
      return NextResponse.json({ error: "Failed to process image data" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Image saved successfully",
      url: relativeUrl,
    });
  } catch (err: unknown) {
    console.error("Image Upload Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Image upload failed" }, { status: 500 });
  }
}
