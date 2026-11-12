"use client";

import type { ReactNode } from "react";
import type { BookingServiceId } from "@/lib/booking-services";

type BookingServiceLinkProps = {
  "aria-label": string;
  children: ReactNode;
  className: string;
  serviceId: BookingServiceId;
};

export default function BookingServiceLink({
  "aria-label": ariaLabel,
  children,
  className,
  serviceId,
}: BookingServiceLinkProps) {
  function selectService() {
    window.dispatchEvent(
      new CustomEvent("booking:select-service", { detail: serviceId }),
    );
  }

  return (
    <a
      aria-label={ariaLabel}
      className={className}
      href="#reservar"
      onClick={selectService}
    >
      {children}
    </a>
  );
}
