export interface EmailTemplate {
  id: "english" | "hinglish";
  name: string;
  language: string;
  subject: string;
  body: string;
}

export const CREATOR_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "english",
    name: "English Version",
    language: "English",
    subject: "A dedicated platform for your content — Inflixo (Built for Indian Creators)",
    body: `Hello Content Creator,

First and foremost, a heartfelt Thank You for creating such incredible, high-value content and elevating India’s content creation industry! 🇮🇳✨

We wish you continued growth and immense success as you cement your name among the top creators in the country.

Over the past few months, we reached out to more than 50 content creators across India to understand their day-to-day challenges. Three recurring problems stood out that existing bio-link tools fail to solve:

1. **"Tools let you list multiple social links, but no one shows our Total Fanbase in one place."**
Creators want their YouTube subscribers, Instagram followers, and Facebook community unified into a single live metric (e.g., **500K+ Combined Fanbase**) so fans and brand partners can see their full reach instantly.

2. **"We produce multi-part series, but viewers struggle to find Part 2."**
You put tremendous effort into filming multi-part travel series, finance deep-dives, tutorials, or comedy sketches. However, social algorithms scatter sequential episodes across feeds. Viewers watch **Part 1**, miss **Part 2**, and drop off. Creators needed a dedicated space to organize their work into structured **Seasons and Numbered Episodes (Playlist-style)**.

3. **"There is no professional home to list brand collab packages."**
Sending rate cards manually over DMs or giving away 15–20% cuts to agencies hurts margins. Creators want a transparent, **0% commission** Live Media Kit with direct WhatsApp lead routing.

---

### **Solving These Challenges with Inflixo**

We built **Inflixo**—not as just another link list, but as a modern **OTT-style bio link and live media kit platform** crafted specifically for Indian creators.

You can see how your interactive showcase will look on mobile right here:

👉 **View Live Demo:** [https://inflixo.com/demo_creator](https://inflixo.com/demo_creator)

---

### **Our Vision: The 2027 Global Creator Summit**

Our mission goes beyond software. Our goal is to host a **Global Creator Summit in 2027**, bringing together top content creators from across India's diverse states to represent the Indian creator economy on the world stage.

Your content and voice can be a vital part of this journey.

You are currently eligible for our exclusive **Early Access Program**.

👉 **[Claim Your Free Inflixo Profile — https://inflixo.com](https://inflixo.com)**

Wishing you continued creative growth,

**The Inflixo Team**

*Built with ❤️ for Indian Creators | TrustIQ Labs PVT LTD*`,
  },
  {
    id: "hinglish",
    name: "Hinglish Version",
    language: "Hinglish",
    subject: "Aapke content ke liye ek special platform — Inflixo (Created for Indian Creators)",
    body: `Hello Content Creator,

Sabse pehle, India ki content creation industry me itna lajawab aur valuable content banane ke liye **Dil se Thank You!** 🇮🇳✨

Hum wish karte hain ki aapka channel aur page aur tezi se grow kare aur India ke top creators me aapka naam hamesha chamakta rahe.

Humne pichle kuch mahino me India ke 50+ se zyada content creators se baat ki aur unse unke daily challenges samjhe. Creators ne hume 3 badi problems batayi jo aaj market ka koi bhi link tool solve nahi kar pa raha hai:

1. **"Alag-alag platforms ke links toh sab dete hain, lekin Total Fanbase count ek jagah koi nahi dikhata."**
Creators chahte hain ki unke YouTube subscribers, Instagram followers aur Facebook community ka total number ek single unified metric (e.g. **500K+ Combined Fanbase**) me fans aur brands ko ek sath dikhe.

2. **"Multiple parts me video banate hain, par viewers ko Part 2 dhoondhne me takleef hoti hai."**
Aap din-raat mehnat karke travel series, finance breakdowns, tutorial ya comedy skits banate hain. Lekin algorithm feeds Part 1 ke baad Part 2 ko scatter kar deta hai. Creators ko ek aisi jagah chahiye thi jahan poori series ko **Seasons aur Numbered Episodes (Playlist-style)** me organize kiya ja sake.

3. **"Brand aur Collab packages list karne ke liye koi professional space nahi hai."**
DMs me baar-baar rate cards bhejna ya 15–20% commission platforms ko dena creators ko pasand nahi tha. Unhe direct **0% commission** aur WhatsApp lead routing wala live Media Kit chahiye tha.

---

### **Inhi sabhi problems ko solve karne ke liye humne banaya hai: Inflixo**

Inflixo simple link tool nahi, balki Indian creators ke liye ek modern **OTT-style bio link aur live media kit platform** hai.

Aapka page mobile par kaisa dikhega, uska ek live preview aap yahan dekh sakte hain:

👉 **Demo Page Dekhein:** [https://inflixo.com/demo_creator](https://inflixo.com/demo_creator)

---

### **Hamara Vision & 2027 Global Creator Summit:**

Hamara vision sirf ek software banana nahi hai. Hamara goal hai ki **2027 me hum India ke alag-alag states ke top content creators ke sath ek Global Creator Summit host karein**, jahan Indian creator economy ko world stage par represent kiya ja sake.

Aapka content aur hard work is journey ka ek strong hissa ban sakta hai.

Abhi aap Inflixo ke **Early Access VIP Program** ke liye eligible hain.

👉 **[Apna Inflixo Profile Banayein (Takes 60 seconds) — https://inflixo.com](https://inflixo.com)**

Aapke ongoing success ki shubhkaamnaayein,

**The Inflixo Team**

*Built with ❤️ for Indian Creators | TrustIQ Labs PVT LTD*`,
  },
];

/**
 * Converts raw markdown/text body into clean HTML for email sending
 */
export function formatEmailBodyToHtml(text: string): string {
  if (!text) return "";

  let formatted = text
    // Replace Markdown headers ###
    .replace(/^### (.*$)/gim, '<h3 style="color: #803D63; font-size: 16px; font-weight: 800; margin: 20px 0 10px 0;">$1</h3>')
    // Bold text **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text *text*
    .replace(/\*(.*?)\*/g, '<em style="color: #64748B;">$1</em>')
    // Links [text](url)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #803D63; font-weight: 700; text-decoration: underline;">$1</a>')
    // Plain URLs (if not inside href)
    .replace(/(https?:\/\/[^\s<]+)/g, (url) => {
      if (url.includes('href=')) return url;
      return `<a href="${url}" target="_blank" style="color: #803D63; font-weight: 700; text-decoration: underline;">${url}</a>`;
    });

  // Split into paragraphs by double linebreaks
  const blocks = formatted.split(/\n\n+/);

  const htmlBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("---")) {
      return '<hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />';
    }
    if (trimmed.includes("👉")) {
      return `<div style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; margin: 16px 0; color: #0F172A; font-weight: 600;">${trimmed.replace(/\n/g, "<br/>")}</div>`;
    }
    return `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #1E293B; font-size: 14px;">${trimmed.replace(/\n/g, "<br/>")}</p>`;
  });

  return htmlBlocks.join("");
}
