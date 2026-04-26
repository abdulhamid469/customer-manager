import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

const getDB = () => (env as any).customers_db;

async function getPassword(): Promise<string> {
  const db = getDB();
  const row = await db
    .prepare("SELECT value FROM settings WHERE key = 'LOGIN_PASSWORD'")
    .first();
  return row?.value ?? (env as any).LOGIN_PASSWORD ?? "";
}

export const loginFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { username: string; password: string } }) => {
    const e = env as any;
    const correctPassword = await getPassword();
    if (data.username === e.LOGIN_USERNAME && data.password === correctPassword) {
      return { success: true };
    }
    return { success: false };
  }
);

export const sendOtpFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { currentPassword: string } }) => {
    const correctPassword = await getPassword();
    if (data.currentPassword !== correctPassword) {
      return { success: false, error: "Current password galat hai!" };
    }

    const db = getDB();
    const e = env as any;

    // 6 digit OTP generate karo
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Purane codes delete karo
    await db.prepare("DELETE FROM otp_codes").run();

    // Naya code save karo
    await db
      .prepare("INSERT INTO otp_codes (code, expires_at) VALUES (?, ?)")
      .bind(code, expiresAt)
      .run();

    // Email bhejo via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${e.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Muna Networking <onboarding@resend.dev>",
        to: [e.ADMIN_EMAIL],
        subject: "Password Change Verification Code",
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a1a;">Password Change Request</h2>
            <p style="color: #666;">Aapka verification code:</p>
            <div style="background: #f4f4f4; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px;">Yeh code 10 minutes mein expire ho jayega.</p>
            <p style="color: #999; font-size: 12px;">Agar aapne yeh request nahi ki toh ignore karein.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      return { success: false, error: "Email send nahi ho saki. Dobara try karo." };
    }

    return { success: true };
  }
);

export const verifyOtpAndChangeFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { code: string; newPassword: string } }) => {
    const db = getDB();

    const row = await db
      .prepare("SELECT * FROM otp_codes WHERE code = ?")
      .bind(data.code)
      .first();

    if (!row) {
      return { success: false, error: "Galat code!" };
    }

    if (Date.now() > row.expires_at) {
      await db.prepare("DELETE FROM otp_codes").run();
      return { success: false, error: "Code expire ho gaya! Dobara try karo." };
    }

    // Password update karo D1 mein
    await db
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('LOGIN_PASSWORD', ?)")
      .bind(data.newPassword)
      .run();

    // Code delete karo
    await db.prepare("DELETE FROM otp_codes").run();

    return { success: true };
  }
);