import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export const loginFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { username: string; password: string } }) => {
    const e = env as any;
    if (data.username === e.LOGIN_USERNAME && data.password === e.LOGIN_PASSWORD) {
      return { success: true };
    }
    return { success: false };
  }
);