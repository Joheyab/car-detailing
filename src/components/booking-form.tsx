"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  BookingServiceId,
  bookingServices,
  isBookingServiceId,
} from "@/lib/booking-services";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const weekDays = ["L", "M", "X", "J", "V", "S", "D"];
const dateFormatter = new Intl.DateTimeFormat("es-US", {
  timeZone: "America/New_York",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function getGreenvilleDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function toCalendarDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

function getMonthDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - mondayOffset));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function formatMonth(monthKey: string) {
  return new Intl.DateTimeFormat("es-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(toCalendarDate(`${monthKey}-01`));
}

function formatDate(dateKey: string) {
  return dateFormatter.format(toCalendarDate(dateKey));
}

export default function BookingForm() {
  const [today, setToday] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<BookingServiceId>("basic-detailing");
  const [month, setMonth] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const availabilityRequest = useRef(0);
  const currentService =
    bookingServices.find((service) => service.id === serviceId) ?? bookingServices[0];

  useEffect(() => {
    let lastKnownDate = "";
    const updateDate = () => {
      const currentDate = getGreenvilleDate();
      setToday(currentDate);
      setMonth((currentMonth) =>
        !currentMonth || currentMonth === lastKnownDate.slice(0, 7)
          ? currentDate.slice(0, 7)
          : currentMonth,
      );
      lastKnownDate = currentDate;
    };

    const frame = window.requestAnimationFrame(updateDate);
    const interval = window.setInterval(updateDate, 60_000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, []);

  const loadSlots = useCallback(async (date: string, selectedService: BookingServiceId) => {
    const requestId = ++availabilityRequest.current;
    setSelectedDate(date);
    setSelectedTime("");
    setAvailableSlots([]);
    setAvailabilityError("");
    setLoadingSlots(true);

    try {
      const query = new URLSearchParams({ date, service: selectedService });
      const response = await fetch(`/api/availability?${query}`);
      const result: { error?: string; slots?: string[] } = await response.json();

      if (requestId !== availabilityRequest.current) return;
      if (!response.ok) {
        setAvailabilityError(result.error ?? "No pudimos consultar los horarios.");
        return;
      }

      setAvailableSlots(result.slots ?? []);
    } catch {
      if (requestId === availabilityRequest.current) {
        setAvailabilityError("No pudimos consultar los horarios. Intenta de nuevo.");
      }
    } finally {
      if (requestId === availabilityRequest.current) setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    function handleServiceSelection(event: Event) {
      const selectedService = (event as CustomEvent<unknown>).detail;
      if (!isBookingServiceId(selectedService)) return;

      setServiceId(selectedService);
      setSelectedTime("");
      setSubmission({ status: "idle" });
      if (selectedDate) void loadSlots(selectedDate, selectedService);
    }

    window.addEventListener("booking:select-service", handleServiceSelection);
    return () =>
      window.removeEventListener("booking:select-service", handleServiceSelection);
  }, [loadSlots, selectedDate]);

  function changeService(value: string) {
    const nextService = value as BookingServiceId;
    setServiceId(nextService);
    if (selectedDate) void loadSlots(selectedDate, nextService);
  }

  function moveMonth(direction: -1 | 1) {
    if (!month) return;
    const [year, currentMonth] = month.split("-").map(Number);
    const date = new Date(Date.UTC(year, currentMonth - 1 + direction, 1));
    setMonth(date.toISOString().slice(0, 7));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDate || !selectedTime) return;
    setSubmission({ status: "submitting" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.service = serviceId;
    payload.date = selectedDate;
    payload.time = selectedTime;

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { error?: string; message?: string } = await response.json();

      if (!response.ok) {
        setSubmission({
          status: "error",
          message: result.error ?? "No pudimos enviar tu solicitud. Intenta de nuevo.",
        });
        if (response.status === 409) void loadSlots(selectedDate, serviceId);
        return;
      }

      form.reset();
      setSubmission({
        status: "success",
        message: result.message ?? "Tu horario quedó apartado.",
      });
      setSelectedDate("");
      setSelectedTime("");
      setAvailableSlots([]);
    } catch {
      setSubmission({
        status: "error",
        message: "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
      });
    }
  }

  if (!today || !month) {
    return (
      <div aria-live="polite" className="booking-form calendar-placeholder">
        Preparando calendario...
      </div>
    );
  }

  const lastBookableDay = addDays(today, 90);
  const calendarDays = getMonthDays(month);
  const canGoBack = month > today.slice(0, 7);
  const canGoForward = month < lastBookableDay.slice(0, 7);

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="form-topline">
        <span>ELIGE SERVICIO, FECHA Y HORARIO</span>
        <span>GREENVILLE, SC · EASTERN TIME</span>
      </div>

      <label className="form-field booking-service-field">
        <span>Servicio *</span>
        <select
          onChange={(event) => changeService(event.target.value)}
          value={serviceId}
        >
          {bookingServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ·{" "}
              {service.price === null
                ? "Cotización"
                : `$${service.price} USD`}
            </option>
          ))}
        </select>
      </label>

      <div className="booking-calendar">
        <div className="calendar-heading">
          <div>
            <span>FECHA DE TU CITA</span>
            <strong>Selecciona un día</strong>
          </div>
          <div className="calendar-navigation">
            <button
              aria-label="Mes anterior"
              disabled={!canGoBack}
              onClick={() => moveMonth(-1)}
              type="button"
            >
              ‹
            </button>
            <strong>{formatMonth(month)}</strong>
            <button
              aria-label="Mes siguiente"
              disabled={!canGoForward}
              onClick={() => moveMonth(1)}
              type="button"
            >
              ›
            </button>
          </div>
        </div>

        <div aria-label="Días de la semana" className="calendar-grid calendar-weekdays">
          {weekDays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div aria-label={formatMonth(month)} className="calendar-grid calendar-days">
          {calendarDays.map((date) => {
            const dayNumber = Number(date.slice(-2));
            const isCurrentMonth = date.startsWith(month);
            const isInRange = date >= today && date <= lastBookableDay;
            const isSelected = selectedDate === date;

            return (
              <button
                aria-pressed={isSelected}
                className={[
                  "calendar-day",
                  !isCurrentMonth && "calendar-day-outside",
                  isSelected && "calendar-day-selected",
                ].filter(Boolean).join(" ")}
                disabled={!isInRange}
                key={date}
                onClick={() => void loadSlots(date, serviceId)}
                type="button"
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
        <p className="calendar-caption">
          Horarios disponibles para los próximos 90 días. La hora se muestra en
          horario de Greenville.
        </p>
      </div>

      {selectedDate && (
        <section aria-live="polite" className="available-times">
          <div className="available-times-heading">
            <div>
              <span>HORARIOS DISPONIBLES</span>
              <strong>{formatDate(selectedDate)}</strong>
            </div>
            {loadingSlots && <span className="calendar-loading">Buscando...</span>}
          </div>

          {availabilityError && <p className="availability-message">{availabilityError}</p>}

          {!loadingSlots && !availabilityError && availableSlots.length === 0 && (
            <p className="availability-message">
              No hay horarios disponibles para esta fecha. Prueba otro día.
            </p>
          )}

          {availableSlots.length > 0 && (
            <div className="time-slot-grid">
              {availableSlots.map((time) => (
                <button
                  aria-pressed={selectedTime === time}
                  className={`time-slot${selectedTime === time ? " time-slot-selected" : ""}`}
                  key={time}
                  onClick={() => {
                    setSelectedTime(time);
                    setSubmission({ status: "idle" });
                  }}
                  type="button"
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedTime && (
        <section aria-labelledby="booking-details-title" className="booking-details">
          <h3 id="booking-details-title">Tus datos de contacto</h3>
          <p>
            {currentService.name} · {formatDate(selectedDate)} a las {selectedTime}
          </p>
          <div className="form-grid">
            <label className="form-field">
              <span>Tu nombre *</span>
              <input autoComplete="name" maxLength={100} name="name" placeholder="¿Cómo te llamas?" required />
            </label>
            <label className="form-field">
              <span>Correo electrónico *</span>
              <input autoComplete="email" maxLength={254} name="email" placeholder="tu@correo.com" required type="email" />
            </label>
            <label className="form-field">
              <span>Teléfono *</span>
              <input autoComplete="tel" maxLength={30} name="phone" placeholder="+1 (555) 000-0000" required type="tel" />
            </label>
            <label className="form-field">
              <span>Tu vehículo *</span>
              <input maxLength={100} name="vehicle" placeholder="Marca, modelo y año" required />
            </label>
            <label className="form-field form-field-wide">
              <span>Ciudad o ZIP code *</span>
              <input autoComplete="postal-code" maxLength={100} name="service_location" placeholder="Greenville, SC" required />
            </label>
            <label className="form-field form-field-wide">
              <span>Notas adicionales</span>
              <input maxLength={1000} name="notes" placeholder="Detalles, preguntas o preferencias" />
            </label>
          </div>

          <input
            aria-hidden="true"
            autoComplete="off"
            className="honeypot"
            name="company_url"
            readOnly
            tabIndex={-1}
            type="text"
          />
          <div className="form-submit-row">
            <p>
              La solicitud pendiente bloquea este espacio hasta que el negocio
              confirme o cancele la cita.
            </p>
            <button
              className="button button-primary"
              disabled={submission.status === "submitting"}
              type="submit"
            >
              {submission.status === "submitting" ? "Enviando..." : "Solicitar este horario"}
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M4 12h15m-6-6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {submission.status !== "idle" && submission.status !== "submitting" && (
        <p
          aria-live="polite"
          className={`form-message ${submission.status === "success" ? "form-success" : "form-error"}`}
          role={submission.status === "success" ? "status" : "alert"}
        >
          {submission.message}
        </p>
      )}
    </form>
  );
}
