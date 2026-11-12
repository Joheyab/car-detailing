"use client";

import { useState } from "react";

const links = [
  ["Servicios", "#servicios"],
  ["Nosotros", "#nosotros"],
  ["Instagram", "#instagram"],
  ["Reservar", "#reservar"],
  ["Contacto", "#contacto"],
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="mobile-menu">
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        className="mobile-menu-toggle"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      {isOpen && (
        <nav aria-label="Navegación móvil" className="mobile-nav">
          {links.map(([label, href]) => (
            <a href={href} key={href} onClick={closeMenu}>
              {label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
