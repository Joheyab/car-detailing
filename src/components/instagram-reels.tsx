"use client";

import Script from "next/script";

const reels = [
  {
    url: "https://www.instagram.com/reel/DZ5k3X2SDeb/?hl=es",
    title: "Primer Reel de H.K. Detailing",
  },
  {
    url: "https://www.instagram.com/reel/DbEC4KuySbb/?hl=es",
    title: "Segundo Reel de H.K. Detailing",
  },
];

export default function InstagramReels() {
  function processEmbeds() {
    window.instgrm?.Embeds.process();
  }

  return (
    <>
      <Script
        onReady={processEmbeds}
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
      />
      <div className="instagram-reels scroll-reveal reveal-visible">
        {reels.map((reel) => (
          <article className="instagram-reel-card" key={reel.url}>
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={reel.url}
              data-instgrm-version="14"
            >
              <a href={reel.url} rel="noreferrer" target="_blank">
                Ver este Reel en Instagram
              </a>
            </blockquote>
            <a
              className="instagram-reel-link"
              href={reel.url}
              rel="noreferrer"
              target="_blank"
            >
              <span>{reel.title} · Abrir en Instagram</span>
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          </article>
        ))}
      </div>
    </>
  );
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}
