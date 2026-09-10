# Agendas

Un backend compartido, sitios separados. Cada negocio tiene su propia página de reservas (`/{slug}`). No hay directorio ni un inicio que mezcle oficios.

El panel de dueño está en `/` y `/login`. Los clientes nunca pasan por ahí: entran directo al enlace del negocio.

## Requisitos

- Node.js 22+
- Dependencias de npm (`npm install`)

## Arranque local

En una terminal, levanta PostgreSQL embebido:

```bash
npm run db:up
```

En otra:

```bash
npx prisma migrate deploy
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), crea una cuenta y comparte `/{slug}` con tus clientes.

## Correo

Si no hay `RESEND_API_KEY` en `.env`, las confirmaciones se imprimen en la consola. Copia `.env.example` a `.env` y genera un `AUTH_SECRET`.
