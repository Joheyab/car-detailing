import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isBookingServiceId } from "@/lib/booking-services";
import { Database } from "@/lib/supabase/database.types";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const date = searchParams.get("date");
  const serviceId = searchParams.get("service");
  const parsedDate =
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00.000Z`)) &&
    new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) === date
      ? date
      : null;

  if (!parsedDate || !isBookingServiceId(serviceId)) {
    return NextResponse.json(
      { error: "Selecciona una fecha y un servicio válidos." },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Availability requested before Supabase environment variables were configured.");
    return NextResponse.json(
      { error: "El calendario aún no está configurado. Intenta más tarde." },
      { status: 503 },
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_date: parsedDate,
    p_service_id: serviceId,
  });

  if (error) {
    console.error("Could not load available booking slots:", error.message);
    return NextResponse.json(
      { error: "No pudimos consultar los horarios. Intenta de nuevo." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    slots: data.map((row) => String(row.slot_time).slice(0, 5)),
  });
}
