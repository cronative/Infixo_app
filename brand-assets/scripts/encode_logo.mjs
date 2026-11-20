// Encode JPG frames + synthesised SFX into an H.264/AAC MP4 using headless Chrome (WebCodecs).
// usage: node encode_logo.mjs <framesDir> <out.mp4> <W> <H>
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire("/Volumes/Nik/Github_new/Infixo_app/.claude/worktrees/relaxed-euler-4f600a/package.json");
const puppeteer = require("puppeteer");

const [FRAMES, OUT, Ws, Hs] = process.argv.slice(2);
const W = Number(Ws), H = Number(Hs), FPS = 30, SR = 48000;
const files = fs.readdirSync(FRAMES).filter((f) => f.endsWith(".jpg")).sort();
const SECS = files.length / FPS;
// Sound cues, in seconds (match logo_reveal.py timings).
const EVENTS = [
  { k: "riser", t: 0.0 },
  { k: "pop", t: 0.42 },
  { k: "sparkle", t: 0.5 },
  { k: "whoosh", t: 0.88 },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ k: "tick", t: 1.18 + i * 0.07, n: i })),
  { k: "logo", t: 1.78 },
  { k: "chime", t: 2.35 },
];

const vs = []; let avcC = null; const as = []; let asc = null;
const b = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], protocolTimeout: 600_000 });
const p = await b.newPage();
await p.setRequestInterception(true);
p.on("request", (r) => {
  const u = new URL(r.url());
  if (u.pathname.startsWith("/f/")) return r.respond({ status: 200, contentType: "image/jpeg", body: fs.readFileSync(path.join(FRAMES, path.basename(u.pathname))) });
  if (u.pathname === "/") return r.respond({ status: 200, contentType: "text/html", body: "<body></body>" });
  r.respond({ status: 404, body: "" });
});
await p.exposeFunction("putV", (b64, key, ts) => vs.push({ data: Buffer.from(b64, "base64"), key, ts }));
await p.exposeFunction("putAvcC", (b64) => (avcC = Buffer.from(b64, "base64")));
await p.exposeFunction("putA", (b64, ts) => as.push({ data: Buffer.from(b64, "base64"), ts }));
await p.exposeFunction("putAsc", (b64) => (asc = Buffer.from(b64, "base64")));
await p.goto("http://localhost:65112/", { waitUntil: "load" });

const res = await p.evaluate(async (files, W, H, FPS, SR, SECS, EVENTS) => {
  const b64 = (u8) => { let s = ""; for (let k = 0; k < u8.length; k += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000)); return btoa(s); };
  const pending = [];
  // ── audio ──
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * SECS), SR);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(ctx.destination);
  const bus = ctx.createGain(); bus.connect(comp);
  bus.gain.setValueAtTime(1, 0); bus.gain.setValueAtTime(1, SECS - 0.8); bus.gain.linearRampToValueAtTime(0, SECS - 0.02);
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const nb = ctx.createBuffer(1, SR, SR); { const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const tone = (type, freq, t, dur, gain, { attack = 0.005, filter = 0, pan = 0, glideTo = 0 } = {}) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur * 0.8);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = o.connect(g); if (filter) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filter; n = n.connect(f); }
    const pn = ctx.createStereoPanner(); pn.pan.value = pan; n.connect(pn).connect(bus); o.start(t); o.stop(t + dur + 0.05); };
  const noise = (t, dur, gain, type, freq, { q = 1, sweepTo = 0, attack = 0.002 } = {}) => {
    const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus); s.start(t); s.stop(t + dur + 0.02); };
  const kick = (t, gain) => { const o = ctx.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32); o.connect(g).connect(bus); o.start(t); o.stop(t + 0.35); };
  const SFX = {
    riser: (t) => noise(t, 0.45, 0.08, "bandpass", 300, { q: 1.4, sweepTo: 4000, attack: 0.4 }),
    pop: (t) => { kick(t, 0.5); tone("sine", mtof(76), t, 0.25, 0.09); tone("sine", mtof(88), t + 0.03, 0.2, 0.05); },
    sparkle: (t) => [96, 100, 103].forEach((m, i) => tone("sine", mtof(m), t + i * 0.06, 0.45, 0.05, { pan: i % 2 ? 0.3 : -0.3 })),
    whoosh: (t) => noise(t, 0.5, 0.07, "bandpass", 500, { q: 1.2, sweepTo: 5000, attack: 0.28 }),
    tick: (t, n) => { noise(t, 0.03, 0.06, "highpass", 6500); tone("triangle", mtof(72 + [0, 2, 4, 7, 9, 12][n]), t, 0.12, 0.035, { pan: -0.4 + n * 0.16 }); },
    logo: (t) => { kick(t, 0.6); noise(t, 0.6, 0.06, "highpass", 3000); [60, 64, 67, 72].forEach((m) => tone("triangle", mtof(m), t, 2.6, 0.065, { attack: 0.01, filter: 2600 })); tone("sine", mtof(84), t + 0.02, 0.8, 0.07); },
    chime: (t) => { tone("sine", mtof(91), t, 0.9, 0.05); tone("sine", mtof(96), t + 0.08, 0.9, 0.035); },
  };
  for (const e of EVENTS) (SFX[e.k] || (() => {}))(e.t, e.n);
  const buf = await ctx.startRendering();
  let peak = 0; for (const c of [0, 1]) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i])); }
  const norm = 0.9 / (peak || 1); for (const c of [0, 1]) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= norm; }
  const aenc = new AudioEncoder({
    output: (chunk, meta) => { if (meta?.decoderConfig?.description) pending.push(window.putAsc(b64(new Uint8Array(meta.decoderConfig.description)))); const u8 = new Uint8Array(chunk.byteLength); chunk.copyTo(u8); pending.push(window.putA(b64(u8), chunk.timestamp)); },
    error: (e) => { throw e; } });
  aenc.configure({ codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 192000 });
  { const Lc = buf.getChannelData(0), Rc = buf.getChannelData(1);
    for (let o = 0; o < buf.length; o += 4800) { const n = Math.min(4800, buf.length - o); const data = new Float32Array(n * 2); data.set(Lc.subarray(o, o + n), 0); data.set(Rc.subarray(o, o + n), n);
      const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((o / SR) * 1e6), data }); aenc.encode(ad); ad.close(); } }
  await aenc.flush();
  // ── video ──
  const enc = new VideoEncoder({
    output: (chunk, meta) => { if (meta?.decoderConfig?.description) pending.push(window.putAvcC(b64(new Uint8Array(meta.decoderConfig.description)))); const u8 = new Uint8Array(chunk.byteLength); chunk.copyTo(u8); pending.push(window.putV(b64(u8), chunk.type === "key", chunk.timestamp)); },
    error: (e) => { throw e; } });
  enc.configure({ codec: "avc1.640028", width: W, height: H, bitrate: 8_000_000, framerate: FPS, avc: { format: "avc" }, latencyMode: "quality" });
  const cv = new OffscreenCanvas(W, H), cx = cv.getContext("2d");
  for (let i = 0; i < files.length; i++) {
    const bm = await createImageBitmap(await (await fetch("/f/" + files[i])).blob());
    cx.drawImage(bm, 0, 0, W, H); bm.close();
    const vf = new VideoFrame(cv, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(vf, { keyFrame: i % 30 === 0 }); vf.close();
    while (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 5));
  }
  await enc.flush(); await Promise.all(pending);
  return { frames: files.length, peak: +peak.toFixed(2) };
}, files, W, H, FPS, SR, SECS, EVENTS);
await b.close();

// ── MP4 mux (single mdat, video then audio) ──
vs.sort((a, b) => a.ts - b.ts); as.sort((a, b) => a.ts - b.ts);
const u32 = (n) => { const x = Buffer.alloc(4); x.writeUInt32BE(n >>> 0); return x; };
const u16 = (n) => { const x = Buffer.alloc(2); x.writeUInt16BE(n); return x; };
const box = (type, ...parts) => { const body = Buffer.concat(parts); return Buffer.concat([u32(body.length + 8), Buffer.from(type), body]); };
const full = (type, ver, flags, ...parts) => box(type, Buffer.from([ver, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255]), ...parts);
const desc = (tag, body) => Buffer.concat([Buffer.from([tag, body.length]), body]);
const matrix = Buffer.concat([u32(0x10000), u32(0), u32(0), u32(0), u32(0x10000), u32(0), u32(0), u32(0), u32(0x40000000)]);
const VTS = 30000, VD = 1000, VDUR = vs.length * VD, AD = 1024, ADUR = as.length * AD;
const msV = Math.round((VDUR / VTS) * 1000), msA = Math.round((ADUR / SR) * 1000);
const ftyp = box("ftyp", Buffer.from("isom"), u32(512), Buffer.from("isomiso2avc1mp41"));
const vData = Buffer.concat(vs.map((s) => s.data)), aData = Buffer.concat(as.map((s) => s.data));
const avc1 = box("avc1", Buffer.alloc(6), u16(1), Buffer.alloc(16), u16(W), u16(H), u32(0x480000), u32(0x480000), u32(0), u16(1), Buffer.alloc(32), u16(0x18), Buffer.from([0xff, 0xff]), box("avcC", avcC));
const esds = full("esds", 0, 0, desc(3, Buffer.concat([u16(2), Buffer.from([0]), desc(4, Buffer.concat([Buffer.from([0x40, 0x15, 0, 0, 0]), u32(192000), u32(192000), desc(5, asc)])), desc(6, Buffer.from([2]))])));
const mp4a = box("mp4a", Buffer.alloc(6), u16(1), Buffer.alloc(8), u16(2), u16(16), u16(0), u16(0), u32(SR << 16), esds);
const trak = (id, ms, ts, dur, handler, hname, mh, entry, samples, delta, off, isV) => box("trak",
  full("tkhd", 0, 3, u32(0), u32(0), u32(id), u32(0), u32(ms), Buffer.alloc(8), u16(0), u16(0), u16(isV ? 0 : 0x100), u16(0), matrix, u32(isV ? W << 16 : 0), u32(isV ? H << 16 : 0)),
  box("mdia", full("mdhd", 0, 0, u32(0), u32(0), u32(ts), u32(dur), u16(0x55c4), u16(0)), full("hdlr", 0, 0, u32(0), Buffer.from(handler), Buffer.alloc(12), Buffer.from(hname + "\0")),
    box("minf", mh, box("dinf", full("dref", 0, 0, u32(1), full("url ", 0, 1))),
      box("stbl", full("stsd", 0, 0, u32(1), entry), full("stts", 0, 0, u32(1), u32(samples.length), u32(delta)),
        ...(isV ? [full("stss", 0, 0, u32(samples.filter((s) => s.key).length), ...samples.map((s, i) => (s.key ? u32(i + 1) : null)).filter(Boolean))] : []),
        full("stsc", 0, 0, u32(1), u32(1), u32(samples.length), u32(1)), full("stsz", 0, 0, u32(0), u32(samples.length), ...samples.map((s) => u32(s.data.length))), full("stco", 0, 0, u32(1), u32(off))))));
const moov = (vo, ao) => box("moov", full("mvhd", 0, 0, u32(0), u32(0), u32(1000), u32(Math.max(msV, msA)), u32(0x10000), u16(0x100), Buffer.alloc(10), matrix, Buffer.alloc(24), u32(3)),
  trak(1, msV, VTS, VDUR, "vide", "VideoHandler", full("vmhd", 0, 1, Buffer.alloc(8)), avc1, vs, VD, vo, true),
  trak(2, msA, SR, ADUR, "soun", "SoundHandler", full("smhd", 0, 0, u16(0), u16(0)), mp4a, as, AD, ao, false));
const ml = moov(0, 0).length, vo = ftyp.length + ml + 8, ao = vo + vData.length;
fs.writeFileSync(OUT, Buffer.concat([ftyp, moov(vo, ao), u32(vData.length + aData.length + 8), Buffer.from("mdat"), vData, aData]));
console.log(JSON.stringify({ out: path.basename(OUT), ...res, secs: SECS, videoFrames: vs.length, audioPackets: as.length, mb: (fs.statSync(OUT).size / 1e6).toFixed(2) }));
