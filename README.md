# H.K. Detailing

Sitio web para H.K. Detailing: Next.js, React, Tailwind CSS y Supabase. Presenta servicios móviles en Greenville y alrededores, precios en USD, un feed oficial de Instagram, formulario de reservas y contacto.

## Requisitos

- Node.js 20.9 o posterior
- Un proyecto de Supabase
- Una cuenta de Vercel para publicar (opcional)

## Desarrollo local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y agrega la URL del proyecto y la clave publicable (anon) desde **Supabase → Project Settings → API**.

3. En **Supabase → SQL Editor**, ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).

4. Inicia el servidor:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

Las solicitudes quedan guardadas en `public.bookings` con estado `pending`. Cada solicitud bloquea su intervalo hasta que el negocio la confirme o cancele; una restricción de exclusión en PostgreSQL impide solapamientos incluso con solicitudes simultáneas. Full Detail usa la duración que configures y requiere cotización con el cliente.

## Configurar el calendario y el panel

1. Crea una cuenta de correo y contraseña en **Supabase → Authentication → Users** para cada administrador.
2. Autoriza el correo (en minúsculas) en **Supabase → SQL Editor**:

   ```sql
   insert into public.booking_admins (email)
   values (lower('admin@tudominio.com'))
   on conflict (email) do nothing;
   ```

3. Abre `/admin` en el sitio e inicia sesión. Configura los días y horarios semanales, además de la duración de cada servicio en minutos (múltiplos de 30).
4. Guarda los cambios. Los días cerrados y los servicios sin duración configurada no ofrecen horarios en el calendario público.

Las reservas usan la zona horaria de Greenville, South Carolina (Eastern Time). El calendario consulta los espacios libres para el servicio y la fecha elegidos. El horario pendiente se aparta de inmediato en el único espacio de trabajo; desde el panel se puede confirmar o cancelar para liberarlo.

La tabla de reservas está protegida con Row Level Security: visitantes pueden consultar disponibilidad y solicitar una cita, pero solo los correos autorizados pueden ver/modificar las citas y la configuración. No se requiere ni debe exponerse una clave `service_role`.

La sección de Instagram usa el reproductor oficial de inserciones para los dos Reels indicados. Instagram requiere iniciar la reproducción con una interacción y puede restringir inserciones según la privacidad o sus políticas; cada tarjeta mantiene un enlace directo al Reel como alternativa.

## Publicar en Vercel

1. Importa el repositorio en Vercel y conserva los valores predeterminados del framework Next.js.
2. En **Project Settings → Environment Variables**, agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para los entornos que vayas a publicar.
3. Ejecuta el esquema SQL en el proyecto de Supabase y despliega.
4. Después de cambiar las variables, vuelve a desplegar para que el build las tome.

## Subir a GitHub

1. Crea un repositorio vacío llamado `car-detailing` en GitHub.
2. Desde esta carpeta, conecta el remoto y publica la rama:

   ```bash
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/car-detailing.git
   git add .
   git commit -m "Create H.K. Detailing website"
   git push -u origin main
   ```

## Personalización

Confirma los precios iniciales en USD y los servicios con el negocio antes de publicar; actualízalos en `src/app/page.tsx`, `src/components/booking-form.tsx`, `src/app/api/bookings/route.ts` y `supabase/schema.sql`. Ajusta también el área de servicio, datos de contacto y contenido.
