import { storage } from "@/utils/storage";

const ADMIN_TOKEN_KEY = "inflixo_admin_session";

export interface AdminUser {
  email: string;
  role: "admin";
  name: string;
}

export const AdminService = {
  login(email: string, pass: string): boolean {
    if (email.trim().toLowerCase() === "admin@inflixo.com" && pass === "Devom@131130") {
      const session = {
        email: "admin@inflixo.com",
        role: "admin",
        name: "Inflixo Super Admin",
        loggedInAt: new Date().toISOString(),
      };
      storage.set(ADMIN_TOKEN_KEY, session);
      return true;
    }
    return false;
  },

  logout(): void {
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
