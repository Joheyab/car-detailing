import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin";

const bookingStatuses = new Set(["confirmed", "cancelled", "completed"]);

function isBookingStatus(value: unknown): value is "confirmed" | "cancelled" | "completed" {
  return typeof value === "string" && bookingStatuses.has(value);
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/bookings/[id]">,
) {
  const auth = await getAdminSession(request);
  if (!auth.session) return auth.response;

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "La reservación seleccionada no es válida." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud no tiene un formato válido." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    !isBookingStatus(body.status)
  ) {
    return NextResponse.json({ error: "El estado de la reservación no es válido." }, { status: 400 });
  }

  const { data, error } = await auth.session.client
    .from("bookings")
    .update({ status: body.status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "Ese horario se cruza con otra cita y no se puede confirmar." },
        { status: 409 },
      );
    }

    console.error("Could not update booking status:", error.message);
    return NextResponse.json(
      { error: "No pudimos actualizar la reservación." },
      { status: 503 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "No encontramos esa reservación." }, { status: 404 });
  }

  return NextResponse.json({ message: "Estado de la reservación actualizado." });
}
