import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isBookingServiceId } from "@/lib/booking-services";
import { Database } from "@/lib/supabase/database.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no tiene un formato válido." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "La solicitud no tiene un formato válido." },
      { status: 400 },
    );
  }

  if (typeof body.company_url === "string" && body.company_url.length > 0) {
    return NextResponse.json(
      { error: "No pudimos procesar tu solicitud. Intenta de nuevo." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const vehicle = typeof body.vehicle === "string" ? body.vehicle.trim() : "";
  const serviceLocation =
    typeof body.service_location === "string" ? body.service_location.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const date = body.date;
  const time = body.time;

  if (
    !isText(name, 100) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !isText(phone, 30) ||
    !isText(vehicle, 100) ||
    !isText(serviceLocation, 100) ||
    !isBookingServiceId(body.service) ||
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00.000Z`)) ||
    new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date ||
    typeof time !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    (body.notes !== undefined && typeof body.notes !== "string") ||
    notes.length > 1000
  ) {
    return NextResponse.json(
      { error: "Revisa los campos obligatorios e intenta de nuevo." },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Booking request received before Supabase environment variables were configured.");
    return NextResponse.json(
      { error: "El sistema de reservas no está configurado todavía." },
      { status: 503 },
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.rpc("request_booking", {
    p_customer_name: name,
    p_email: email,
    p_phone: phone,
    p_vehicle: vehicle,
    p_service_location: serviceLocation,
    p_service_id: body.service,
    p_date: date,
    p_time: time,
    p_notes: notes || null,
  });

  if (error) {
    if (error.code === "23P01" || error.message.includes("booking_slot_unavailable")) {
      return NextResponse.json(
        { error: "Ese horario ya no está disponible. Selecciona otro." },
        { status: 409 },
      );
    }

    if (error.message.includes("service_not_configured")) {
      return NextResponse.json(
        { error: "Este servicio aún no está habilitado para reservas." },
        { status: 409 },
      );
    }

    if (
      error.message.includes("business_closed") ||
      error.message.includes("invalid_booking_time") ||
      error.message.includes("invalid_booking_date")
    ) {
      return NextResponse.json(
        { error: "Ese horario ya no está disponible. Selecciona otro." },
        { status: 409 },
      );
    }

    if (error.code === "22023") {
      return NextResponse.json(
        { error: "Algunos datos no son válidos. Revísalos e intenta de nuevo." },
        { status: 400 },
      );
    }

    console.error("Could not save booking request in Supabase:", error.message);
    return NextResponse.json(
      { error: "No pudimos guardar tu solicitud. Intenta de nuevo más tarde." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { message: "¡Gracias! Tu horario quedó apartado y te contactaremos para confirmar." },
    { status: 201 },
  );
}
