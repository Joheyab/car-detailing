import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Database } from "@/lib/supabase/database.types";

type AdminSession = {
  client: SupabaseClient<Database>;
  email: string;
};

type AdminSessionResult =
  | { session: AdminSession; response?: never }
  | { session?: never; response: NextResponse };

export async function getAdminSession(request: Request): Promise<AdminSessionResult> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !url || !anonKey) {
    return {
      response: NextResponse.json(
        { error: "Inicia sesión con una cuenta de administración para continuar." },
        { status: 401 },
      ),
    };
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await client.auth.getUser(token);

  if (userError || !userData.user?.email) {
    return {
      response: NextResponse.json(
        { error: "La sesión expiró. Inicia sesión de nuevo." },
        { status: 401 },
      ),
    };
  }

  const email = userData.user.email.trim().toLowerCase();
  const { data: admin, error: adminError } = await client
    .from("booking_admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify booking admin in Supabase:", adminError.message);
    return {
      response: NextResponse.json(
        { error: "No pudimos verificar los permisos de administración." },
        { status: 503 },
      ),
    };
  }

  if (!admin) {
    return {
      response: NextResponse.json(
        { error: "Esta cuenta no tiene acceso al panel de administración." },
        { status: 403 },
      ),
    };
  }

  return { session: { client, email } };
}
