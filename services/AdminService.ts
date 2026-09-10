import { storage } from "@/utils/storage";

const ADMIN_TOKEN_KEY = "inflixo_admin_session";

export interface AdminUser {
  email: string;
  role: "admin";
  name: string;
}

export const AdminService = {
  async login(email: string, pass: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: pass }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.admin) {
        const session = {
          email: data.admin.email,
          role: "admin",
          name: data.admin.name || "Inflixo Super Admin",
          token: data.token,
          loggedInAt: new Date().toISOString(),
        };
        storage.set(ADMIN_TOKEN_KEY, session);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
    storage.remove(ADMIN_TOKEN_KEY);
  },

  isLoggedIn(): boolean {
    const session = storage.get<any>(ADMIN_TOKEN_KEY, null);
    return Boolean(session && session.email === "admin@inflixo.com");
  },

  getSession(): AdminUser | null {
    const session = storage.get<any>(ADMIN_TOKEN_KEY, null);
    if (!session || session.email !== "admin@inflixo.com") return null;
    return {
      email: session.email,
      role: "admin",
      name: session.name || "Admin",
    };
  },
};
