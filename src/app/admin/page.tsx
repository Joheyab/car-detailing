"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  BookingServiceId,
  bookingServices,
  weekdays,
} from "@/lib/booking-services";

type WeeklyHour = {
  weekday: number;
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

type ServiceDuration = {
  id: BookingServiceId;
  name: string;
  price: number | null;
  duration_minutes: number | null;
  sort_order: number;
};

type Booking = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  vehicle: string;
  service_location: string | null;
  service_id: BookingServiceId;
  start_at: string;
  end_at: string;
  notes: string | null;
  status: "pending" | "confirmed";
};

type AdminSettings = {
  email: string;
  weeklyHours: WeeklyHour[];
  services: ServiceDuration[];
  bookings: Booking[];
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-US", {
  timeZone: "America/New_York",
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function initialWeek(): WeeklyHour[] {
  return weekdays.map((_, weekday) => ({
    weekday,
    is_open: false,
    opens_at: null,
    closes_at: null,
  }));
}

const displayWeekdays = [1, 2, 3, 4, 5, 6, 0];

export default function AdminPage() {
  const supabase = getSupabaseBrowserClient();

  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(initialWeek);
  const [services, setServices] = useState<ServiceDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadSettings = useCallback(async (accessToken: string) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error ?? "No pudimos cargar el panel.");
        return;
      }

      const loaded = result as AdminSettings;
      setSettings(loaded);
      setWeeklyHours(loaded.weeklyHours);
      setServices(loaded.services);
    } catch {
      setErrorMessage("No pudimos conectar con el panel. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.access_token) {
        void loadSettings(nextSession.access_token);
      } else {
        setSettings(null);
        setLoading(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [supabase, loadSettings]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setLoginError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setLoginError("No pudimos iniciar sesión. Revisa tus datos y el acceso de administrador.");
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSettings(null);
    setServices([]);
    setWeeklyHours(initialWeek());
  }

  function updateWeekday(weekday: number, patch: Partial<WeeklyHour>) {
    setWeeklyHours((current) =>
      current.map((hours) => {
        if (hours.weekday !== weekday) return hours;
        const next = { ...hours, ...patch };
        if (patch.is_open === false) {
          next.opens_at = null;
          next.closes_at = null;
        } else if (patch.is_open === true) {
          next.opens_at ??= "09:00";
          next.closes_at ??= "17:00";
        }
        return next;
      }),
    );
    setNotice("");
  }

  function updateServiceDuration(id: BookingServiceId, value: string) {
    const duration = value === "" ? null : Number(value);
    setServices((current) =>
      current.map((service) =>
        service.id === id ? { ...service, duration_minutes: duration } : service,
      ),
    );
    setNotice("");
  }

  async function saveSettings() {
    if (!session) return;
    setSaving(true);
    setNotice("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weeklyHours,
          services: services.map(({ id, duration_minutes }) => ({
            id,
            duration_minutes,
          })),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error ?? "No se pudieron guardar los cambios.");
        return;
      }

      setNotice(result.message ?? "Cambios guardados.");
      await loadSettings(session.access_token);
    } catch {
      setErrorMessage("No pudimos guardar los cambios. Revisa tu conexión.");
    } finally {
      setSaving(false);
    }
  }

  async function updateBookingStatus(id: string, status: "confirmed" | "cancelled") {
    if (!session) return;
    setErrorMessage("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error ?? "No se pudo actualizar la reservación.");
        return;
      }

      setNotice(result.message ?? "Reservación actualizada.");
      await loadSettings(session.access_token);
    } catch {
      setErrorMessage("No pudimos actualizar la reservación. Intenta de nuevo.");
    }
  }

  if (!supabase) {
    return (
      <AdminShell>
        <div className="admin-login-card">
          <p className="eyebrow"><span className="eyebrow-line" /> CONFIGURACIÓN PENDIENTE</p>
          <h1>Conecta Supabase</h1>
          <p>Configura las variables de entorno de Supabase para abrir el panel de administración.</p>
          <Link className="button button-primary" href="/">Volver al sitio</Link>
        </div>
      </AdminShell>
    );
  }

  if (loading && !session) {
    return <AdminShell><p className="admin-loading">Cargando panel...</p></AdminShell>;
  }

  if (!session) {
    return (
      <AdminShell>
        <form className="admin-login-card" onSubmit={handleLogin}>
          <p className="eyebrow"><span className="eyebrow-line" /> H.K. DETAILING</p>
          <h1>Administración</h1>
          <p>Inicia sesión con la cuenta autorizada para administrar citas y horarios.</p>
          <label className="form-field">
            <span>Correo electrónico</span>
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="form-field">
            <span>Contraseña</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {loginError && <p className="admin-error" role="alert">{loginError}</p>}
          <button className="button button-primary" disabled={loading} type="submit">
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
          <Link className="admin-back-link" href="/">← Volver al sitio</Link>
        </form>
      </AdminShell>
    );
  }

  const openDays = weeklyHours.filter((day) => day.is_open).length;
  const configuredDurations = services.filter((service) => service.duration_minutes !== null).length;

  return (
    <AdminShell>
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="admin-brand">
            <Link className="brand" href="/">
              <span className="brand-mark">H</span>
              <span>H.K<span className="brand-light">.</span><small>BOOKING ADMIN</small></span>
            </Link>
            <div className="admin-account">
              <span>{settings?.email ?? session.user.email}</span>
              <button onClick={handleSignOut} type="button">Cerrar sesión</button>
            </div>
          </div>
          <p className="eyebrow"><span className="eyebrow-line" /> GREENVILLE, SC · EASTERN TIME</p>
          <h1>Tu agenda,<br /><span>bajo control.</span></h1>
          <p className="admin-intro">
            Configura cuándo trabajas, cuánto dura cada servicio y administra
            las solicitudes de tu único espacio de trabajo.
          </p>
        </header>

        <div className="admin-stats">
          <div><strong>{openDays}/7</strong><span>DÍAS ABIERTOS</span></div>
          <div><strong>{configuredDurations}/6</strong><span>SERVICIOS CON DURACIÓN</span></div>
          <div><strong>{settings?.bookings.length ?? 0}</strong><span>CITAS ACTIVAS</span></div>
        </div>

        {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}
        {notice && <p className="admin-success" role="status">{notice}</p>}

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">01 · DISPONIBILIDAD</p>
              <h2>Horarios de la semana</h2>
            </div>
            <span>Zona horaria: Greenville (ET)</span>
          </div>
          <div className="weekly-schedule">
            {displayWeekdays.map((weekday) => weeklyHours.find((day) => day.weekday === weekday)).filter(
              (day): day is WeeklyHour => day !== undefined,
            ).map((day) => (
              <div className={`schedule-row${day.is_open ? " schedule-row-open" : ""}`} key={day.weekday}>
                <strong>{weekdays[day.weekday]}</strong>
                <label className="schedule-toggle">
                  <input
                    checked={day.is_open}
                    onChange={(event) => updateWeekday(day.weekday, { is_open: event.target.checked })}
                    type="checkbox"
                  />
                  <span>{day.is_open ? "Abierto" : "Cerrado"}</span>
                </label>
                {day.is_open ? (
                  <div className="schedule-times">
                    <label>
                      <span>Apertura</span>
                      <input
                        onChange={(event) => updateWeekday(day.weekday, { opens_at: event.target.value })}
                        required
                        type="time"
                        value={day.opens_at ?? ""}
                      />
                    </label>
                    <span className="schedule-dash">—</span>
                    <label>
                      <span>Cierre</span>
                      <input
                        onChange={(event) => updateWeekday(day.weekday, { closes_at: event.target.value })}
                        required
                        type="time"
                        value={day.closes_at ?? ""}
                      />
                    </label>
                  </div>
                ) : (
                  <span className="closed-label">Sin atención</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">02 · TIEMPO DE TRABAJO</p>
              <h2>Duración de los servicios</h2>
            </div>
            <span>Incrementos de 30 minutos</span>
          </div>
          <p className="admin-section-description">
            Asigna el tiempo que ocupa cada servicio en tu único espacio. Los
            servicios sin duración configurada no aparecerán como disponibles.
          </p>
          <div className="service-duration-list">
            {services.map((service) => {
              const details = bookingServices.find((item) => item.id === service.id);
              return (
                <label className="service-duration-row" key={service.id}>
                  <span>
                    <strong>{service.name}</strong>
                    <small>{details?.price === null ? "Precio por cotización" : `$${details?.price} USD`}</small>
                  </span>
                  <span className="duration-input">
                    <input
                      aria-label={`Duración de ${service.name} en minutos`}
                      max={1440}
                      min={30}
                      onChange={(event) => updateServiceDuration(service.id, event.target.value)}
                      placeholder="Sin configurar"
                      step={30}
                      type="number"
                      value={service.duration_minutes ?? ""}
                    />
                    <span>min</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <div className="admin-save-row">
          <p>Los horarios y duraciones se aplicarán al calendario de reservas.</p>
          <button className="button button-primary" disabled={saving} onClick={saveSettings} type="button">
            {saving ? "Guardando..." : "Guardar disponibilidad"}
          </button>
        </div>

        <section className="admin-panel admin-appointments">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">03 · RESERVACIONES</p>
              <h2>Citas pendientes y confirmadas</h2>
            </div>
            <span>Un solo vehículo a la vez</span>
          </div>
          {!settings?.bookings.length ? (
            <p className="empty-appointments">Aún no hay citas próximas.</p>
          ) : (
            <div className="appointment-list">
              {settings.bookings.map((booking) => {
                const service = bookingServices.find((item) => item.id === booking.service_id);
                return (
                  <article className="appointment-card" key={booking.id}>
                    <div className="appointment-date">
                      <strong>{dateTimeFormatter.format(new Date(booking.start_at))}</strong>
                      <span className={`booking-status status-${booking.status}`}>
                        {booking.status === "pending" ? "Pendiente · horario bloqueado" : "Confirmada"}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <strong>{booking.customer_name} · {service?.name}</strong>
                      <span>{booking.vehicle} · {booking.service_location}</span>
                      <span>{booking.email} · {booking.phone}</span>
                      {booking.notes && <p>{booking.notes}</p>}
                    </div>
                    <div className="appointment-actions">
                      {booking.status === "pending" && (
                        <button
                          className="appointment-confirm"
                          onClick={() => void updateBookingStatus(booking.id, "confirmed")}
                          type="button"
                        >
                          Confirmar
                        </button>
                      )}
                      <button
                        className="appointment-cancel"
                        onClick={() => void updateBookingStatus(booking.id, "cancelled")}
                        type="button"
                      >
                        Cancelar y liberar horario
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <Link className="admin-back-link" href="/">← Volver al sitio</Link>
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return <main className="admin-page">{children}</main>;
}
