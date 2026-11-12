import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await getAdminSession(request);
  if (!auth.session) return auth.response;

  const [hoursResult, servicesResult, bookingsResult] = await Promise.all([
    auth.session.client
      .from("weekly_hours")
      .select("weekday, is_open, opens_at, closes_at")
      .order("weekday"),
    auth.session.client
      .from("service_catalog")
      .select("id, name, price, duration_minutes, sort_order")
      .order("sort_order"),
    auth.session.client
      .from("bookings")
      .select(
        "id, customer_name, email, phone, vehicle, service_location, service_id, preferred_date, preferred_time, start_at, end_at, notes, status",
      )
      .in("status", ["pending", "confirmed"])
      .gte("start_at", new Date().toISOString())
      .order("start_at")
      .limit(100),
  ]);

  const error = hoursResult.error ?? servicesResult.error ?? bookingsResult.error;
  if (error) {
    console.error("Could not load booking admin settings:", error.message);
    return NextResponse.json(
      { error: "No pudimos cargar el panel. Comprueba que ejecutaste el esquema de Supabase." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    email: auth.session.email,
    weeklyHours: hoursResult.data,
    services: servicesResult.data,
    bookings: bookingsResult.data,
  });
}

export async function PUT(request: Request) {
  const auth = await getAdminSession(request);
  if (!auth.session) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud no tiene un formato válido." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("weeklyHours" in body) ||
    !("services" in body) ||
    !Array.isArray(body.weeklyHours) ||
    !Array.isArray(body.services)
  ) {
    return NextResponse.json(
      { error: "Los horarios y las duraciones no tienen un formato válido." },
      { status: 400 },
    );
  }

  const { error } = await auth.session.client.rpc("update_booking_settings", {
    p_weekly_hours: body.weeklyHours,
    p_service_durations: body.services,
  });

  if (error) {
    console.error("Could not save booking admin settings:", error.message);
    return NextResponse.json(
      { error: "No se pudieron guardar los cambios. Revisa horarios y duraciones." },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: "Horarios y duraciones actualizados." });
}
