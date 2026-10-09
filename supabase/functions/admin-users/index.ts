// Admin-only account management. Runs on Supabase Edge Functions (Deno) with the service role key,
// which must never be exposed to the browser.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const PRIMARY_ADMIN_EMAIL = "pa2@skillizee.io";
const MIN_PASSWORD_LENGTH = 6;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "user";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isRole = (value: unknown): value is Role => value === "admin" || value === "user";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    // Identify the caller from their session token and require an admin profile
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) throw new HttpError(401, "Not signed in");

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") throw new HttpError(403, "Admin access required");

    const body = await req.json().catch(() => ({}));

    const getTarget = async (id: unknown) => {
      if (typeof id !== "string") throw new HttpError(400, "Missing user id");
      const { data, error } = await admin
        .from("profiles")
        .select("id, email, role")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new HttpError(404, "User not found");
      return data as { id: string; email: string; role: Role };
    };

    const adminCount = async () => {
      const { count, error } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (error) throw error;
      return count ?? 0;
    };

    switch (body.action) {
      case "list": {
        const { data, error } = await admin
          .from("profiles")
          .select("id, email, role, created_at")
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json({ users: data });
      }

      case "create": {
        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        const role: Role = isRole(body.role) ? body.role : "user";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address");
        if (password.length < MIN_PASSWORD_LENGTH) {
          throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        }

        const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
        if (existing) throw new HttpError(409, "This email is already registered");

        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createError || !created.user) {
          const message = createError?.message ?? "Failed to create user";
          throw new HttpError(/already/i.test(message) ? 409 : 400, message);
        }

        const { error: profileError } = await admin
          .from("profiles")
          .upsert({ id: created.user.id, email, role: email === PRIMARY_ADMIN_EMAIL ? "admin" : role });
        if (profileError) {
          // Don't leave an auth account behind without a profile
          await admin.auth.admin.deleteUser(created.user.id);
          throw profileError;
        }
        return json({ ok: true });
      }

      case "setRole": {
        if (!isRole(body.role)) throw new HttpError(400, "Invalid role");
        const target = await getTarget(body.id);
        if (target.email === PRIMARY_ADMIN_EMAIL && body.role !== "admin") {
          throw new HttpError(400, "The primary admin cannot be demoted");
        }
        if (target.role === "admin" && body.role === "user" && (await adminCount()) <= 1) {
          throw new HttpError(400, "At least one admin is required");
        }
        const { error } = await admin.from("profiles").update({ role: body.role }).eq("id", target.id);
        if (error) throw error;
        return json({ ok: true });
      }

      case "setPassword": {
        const password = String(body.password ?? "");
        if (password.length < MIN_PASSWORD_LENGTH) {
          throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        }
        const target = await getTarget(body.id);
        const { error } = await admin.auth.admin.updateUserById(target.id, { password });
        if (error) throw new HttpError(400, error.message);
        return json({ ok: true });
      }

      case "delete": {
        const target = await getTarget(body.id);
        if (target.email === PRIMARY_ADMIN_EMAIL) throw new HttpError(400, "The primary admin cannot be removed");
        if (target.id === caller.id) throw new HttpError(400, "You cannot remove yourself");
        // Deleting the auth user cascades to the profile
        const { error } = await admin.auth.admin.deleteUser(target.id);
        if (error) throw new HttpError(400, error.message);
        return json({ ok: true });
      }

      default:
        throw new HttpError(400, "Unknown action");
    }
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
