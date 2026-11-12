export const bookingServices = [
  {
    id: "basic-detailing",
    name: "Paquete básico detailing",
    price: 50,
    features: [
      "Limpieza de plásticos",
      "Limpieza de rines",
      "Lavado exterior",
      "Aspirado interior",
      "Limpieza de vidrios",
    ],
  },
  {
    id: "premium-detailing",
    name: "Paquete premium detailing",
    price: 75,
    features: [
      "Limpieza de plásticos",
      "Limpieza de rines",
      "Lavado exterior",
      "Aspirado interior",
      "Limpieza de vidrios",
      "Aplicación de cera",
      "Pulido de vidrios",
    ],
  },
  {
    id: "full-detail",
    name: "Full detail",
    price: null,
    features: [
      "Limpieza interior",
      "Limpieza de asientos",
      "Limpieza de alfombra",
      "Limpieza de motor",
      "Limpieza de rines",
      "Lavado exterior",
    ],
  },
  {
    id: "car-wash",
    name: "Car wash",
    price: 50,
    features: [
      "Lavado exterior",
      "Limpieza de llantas",
      "Aspirado interior",
      "Limpieza de plásticos",
      "Limpieza de vidrios",
    ],
  },
  {
    id: "car-wash-premium",
    name: "Car wash premium",
    price: 65,
    features: [
      "Lavado exterior",
      "Limpieza de llantas",
      "Aspirado interior",
      "Limpieza de plásticos",
      "Limpieza de vidrios",
      "Aplicación de cera",
      "Pulido de vidrios",
      "Aplicación de abrillantador",
    ],
  },
  {
    id: "car-wash-wax",
    name: "Car wash básico + cera en carrocería",
    price: 80,
    features: [
      "Lavado exterior",
      "Limpieza de aros y llantas",
      "Cera en la carrocería",
      "Secado del vehículo",
      "Acabado final",
    ],
  },
] as const;

export type BookingServiceId = (typeof bookingServices)[number]["id"];

export const weekdays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export function isBookingServiceId(value: unknown): value is BookingServiceId {
  return (
    typeof value === "string" &&
    bookingServices.some((service) => service.id === value)
  );
}
