import BookingForm from "@/components/booking-form"
import BookingServiceLink from "@/components/booking-service-link"
import InstagramReels from "@/components/instagram-reels"
import MobileNav from "@/components/mobile-nav"
import ScrollReveal from "@/components/scroll-reveal"
import { bookingServices } from "@/lib/booking-services"

const serviceImages = [
  "/detail1.jpg",
  "/detail2.jpg",
  "/detail3.jpg",
  "/wash1.png",
  "/wash2.png",
  "/wash3.jpg",
]

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      {diagonal ? (
        <path d="M7 17 17 7M7 7h10v10" />
      ) : (
        <path d="M4 12h15m-6-6 6 6-6 6" />
      )}
    </svg>
  )
}

function SparkleIcon() {
  return (
    <img aria-hidden="true" className="sparkle-icon" src="/logo.png" alt="" />
  )
}

function CheckIcon() {
  return (
    <span aria-hidden="true" className="check-icon">
      <svg fill="none" height="10" viewBox="0 0 12 12" width="10">
        <path d="m2 6 2.5 2.5L10 3" />
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a aria-label="H.K. Detailing, inicio" className="brand" href="#inicio">
          <span className="brand-mark">
            <SparkleIcon />
          </span>
        </a>
        <nav aria-label="Navegación principal" className="desktop-nav">
          <a href="#servicios">Servicios</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#instagram">Instagram</a>
          <a href="#reservar">Reservar</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="header-cta" href="#reservar">
          Reserva tu cita <ArrowIcon diagonal />
        </a>
        <MobileNav />
      </header>

      <section aria-labelledby="hero-title" className="hero" id="inicio">
        <div className="hero-image" />
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">
            <span className="eyebrow-line" /> DETAILING A DOMICILIO ·
            GREENVILLE, SC
          </p>
          <h1 id="hero-title">
            El detalle
            <br />
            <span>lo cambia todo.</span>
          </h1>
          <p className="hero-description">
            Detailing profesional a domicilio en Greenville y alrededores.
            Cuidamos cada detalle para que disfrutes cada trayecto.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#reservar">
              Reserva tu espacio <ArrowIcon />
            </a>
            <a className="text-link" href="#servicios">
              Explora servicios <ArrowIcon />
            </a>
          </div>
          <div className="hero-note">
            <span className="hero-note-icon">
              <SparkleIcon />
            </span>
            <span>
              <strong>A tu puerta.</strong> Greenville y alrededores.
            </span>
          </div>
        </div>
        <a className="scroll-cue" href="#servicios">
          <span>DESLIZA PARA DESCUBRIR</span>
          <span className="scroll-line" />
        </a>
        <div className="hero-index">GREENVILLE · SC</div>
      </section>

      <section aria-label="Nuestra filosofía" className="intro-strip">
        <span>NO ES SOLO LIMPIEZA</span>
        <span className="intro-star">✳</span>
        <p>Es volver a enamorarte de tu auto.</p>
        <span className="intro-star">✳</span>
        <span>A TU DOMICILIO</span>
      </section>

      <section
        aria-labelledby="services-title"
        className="services section-pad"
        id="servicios"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" /> MOBILE DETAILING · GREENVILLE
            </p>
            <h2 id="services-title">
              Tu auto merece
              <br />
              <span>un poco más.</span>
            </h2>
          </div>
          <p className="section-intro">
            Vamos a donde estés en Greenville y alrededores. Elige el nivel de
            cuidado que tu vehículo necesita y nosotros llegamos hasta ti.
          </p>
        </div>

        <ScrollReveal className="service-grid">
          {bookingServices.map((service, index) => (
            <ScrollReveal
              className={`service-reveal${service.id === "premium-detailing" ? " service-featured" : ""}`}
              key={service.id}
              delay={(index + 1) * 70}
            >
              <BookingServiceLink
                aria-label={`Elegir ${service.name} y reservar`}
                className="service-card"
                serviceId={service.id}
              >
                <div
                  aria-label={`Auto en tratamiento ${service.name}`}
                  className="service-image"
                  role="img"
                  style={{
                    backgroundImage: `url("${serviceImages[index % serviceImages.length]}")`,
                  }}
                >
                  <span className="service-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {service.id === "premium-detailing" && (
                    <span className="popular-tag">EL FAVORITO</span>
                  )}
                </div>
                <div className="service-copy">
                  <div className="service-title-row">
                    <h3>{service.name}</h3>
                    <span className="service-duration">
                      {service.price === null ? "Cotización" : "A domicilio"}
                    </span>
                  </div>
                  <ul className="feature-list">
                    {service.features.map((feature) => (
                      <li key={feature}>
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="service-bottom">
                    <p>
                      {service.price === null ? (
                        <strong>Cotización</strong>
                      ) : (
                        <>
                          <strong>${service.price}</strong>
                          <span>USD</span>
                        </>
                      )}
                    </p>
                    <span aria-hidden="true" className="booking-card-arrow">
                      <ArrowIcon diagonal />
                    </span>
                  </div>
                </div>
              </BookingServiceLink>
            </ScrollReveal>
          ))}
        </ScrollReveal>
        <p className="price-note">
          Precios en USD. Full Detail requiere cotización previa. Las
          solicitudes quedan pendientes hasta que el negocio confirme la
          reserva.
        </p>
      </section>

      <section aria-labelledby="about-title" className="about" id="nosotros">
        <ScrollReveal className="about-photo-wrap">
          <div
            aria-label="Detailing automotriz a domicilio"
            className="about-photo"
            role="img"
          />
          <a
            aria-label="Visita H.K. Detailing en Instagram"
            className="about-stamp"
            href="https://www.instagram.com/h.k.detailing/?hl=es"
            rel="noreferrer"
            target="_blank"
          >
            <InstagramIcon />
            <span>
              SÍGUENOS
              <br />
              EN INSTAGRAM
            </span>
          </a>
          <span className="photo-caption">
            DETAILING MÓVIL · GREENVILLE, SC
          </span>
        </ScrollReveal>
        <ScrollReveal className="about-copy" delay={120}>
          <p className="eyebrow">
            <span className="eyebrow-line" /> DETRÁS DEL BRILLO
          </p>
          <h2 id="about-title">
            Tu auto, cuidado
            <br />
            <span>donde estés.</span>
          </h2>
          <p className="about-description">
            H.K. Detailing lleva el cuidado profesional directamente a tu casa o
            trabajo. Sin traslados, sin complicaciones: un servicio pensado para
            que tu auto quede impecable donde más te convenga.
          </p>
          <p className="about-description">
            Atendemos Greenville y sus alrededores con cita previa. Síguenos en
            Instagram para ver nuestros trabajos y novedades.
          </p>
          <div className="about-values">
            <div>
              <strong>01</strong>
              <span>
                Atención
                <br />
                sin prisa
              </span>
            </div>
            <div>
              <strong>02</strong>
              <span>
                Productos
                <br />
                de confianza
              </span>
            </div>
            <div>
              <strong>03</strong>
              <span>
                Acabados
                <br />
                con intención
              </span>
            </div>
          </div>
          <a
            className="about-link"
            href="https://www.instagram.com/h.k.detailing/?hl=es"
            rel="noreferrer"
            target="_blank"
          >
            Así trabajamos en Instagram <ArrowIcon />
          </a>
        </ScrollReveal>
      </section>

      <section
        aria-labelledby="instagram-title"
        className="instagram-section section-pad"
        id="instagram"
      >
        <ScrollReveal className="instagram-intro">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" /> DEL GARAGE A TU FEED
            </p>
            <h2 id="instagram-title">
              El cuidado
              <br />
              <span>se ve en acción.</span>
            </h2>
          </div>
          <a
            className="instagram-link"
            href="https://www.instagram.com/h.k.detailing/?hl=es"
            rel="noreferrer"
            target="_blank"
          >
            <InstagramIcon /> @h.k.detailing <ArrowIcon diagonal />
          </a>
        </ScrollReveal>
        <InstagramReels />
      </section>

      <section
        aria-labelledby="booking-title"
        className="booking section-pad"
        id="reservar"
      >
        <ScrollReveal className="booking-heading">
          <p className="eyebrow">
            <span className="eyebrow-line" /> TU PRÓXIMO DETALLE
          </p>
          <h2 id="booking-title">
            Un espacio para
            <br />
            <span>dejarlo impecable.</span>
          </h2>
          <p>
            Estamos a domicilio en Greenville y alrededores. Cuéntanos dónde
            estás y qué necesita tu auto; te contactaremos para confirmar fecha
            y precio.
          </p>
          <div className="booking-hours">
            <span className="hours-dot" />
            <span>Servicio móvil · con cita previa</span>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <BookingForm />
        </ScrollReveal>
      </section>

      <footer className="footer" id="contacto">
        <div className="footer-top">
          <div className="footer-brand">
            <a
              aria-label="H.K. Detailing, inicio"
              className="brand brand-footer"
              href="#inicio"
            >
              <span className="brand-mark">
                <SparkleIcon />
              </span>
            </a>
            <p>
              Detailing a domicilio.
              <br />
              Greenville y alrededores.
            </p>
          </div>
          <div className="footer-column">
            <h3>EXPLORA</h3>
            <a href="#servicios">Servicios</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#instagram">Instagram</a>
            <a href="#reservar">Reservar espacio</a>
          </div>
          <div className="footer-column">
            <h3>HABLEMOS</h3>
            <a
              href="https://www.instagram.com/h.k.detailing/?hl=es"
              rel="noreferrer"
              target="_blank"
            >
              @h.k.detailing <ArrowIcon diagonal />
            </a>
            <p>
              Greenville y alrededores
              <br />
              Atención con cita previa
            </p>
          </div>
          <a className="back-top" href="#inicio">
            VOLVER ARRIBA <span>↑</span>
          </a>
        </div>
        <div className="footer-bottom">
          <span>© H.K. DETAILING. TODOS LOS DERECHOS RESERVADOS.</span>
          <span>
            GREENVILLE, SC · DETAILING MÓVIL{" "}
            <div className="brand-mark">
              <SparkleIcon />
            </div>
          </span>
        </div>
      </footer>
    </main>
  )
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="instagram-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
        width="18"
        x="3"
        y="3"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.8" fill="currentColor" r="1" />
    </svg>
  )
}
