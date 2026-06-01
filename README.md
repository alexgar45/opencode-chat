# OpenCode Go Chat

App de chat con Node + React + pnpm que usa tus modelos pagos de **OpenCode Go** a través del SDK oficial `@opencode-ai/sdk`.

## Seguridad y credenciales

Esta app **no almacena ni transmite** tu API key de OpenCode Go. Las credenciales viven en `~/.local/share/opencode/auth.json` y son administradas por el CLI de opencode. El backend de Node habla con un server local de `opencode serve` (que ya tiene tus credenciales cargadas) y nunca toca la API key directamente.

Únicas variables que se setean en `.env`: `OPENCODE_SERVER_URL`, opcional `OPENCODE_SERVER_USERNAME`/`PASSWORD` para basic auth del server local. **No commitees tu `.env`** — ya está cubierto por `.gitignore`.

## Arquitectura

```
┌────────────────┐   SSE/HTTP    ┌──────────────────┐   @opencode-ai/sdk  ┌────────────────────┐
│  apps/web      │ ────────────▶ │  apps/server     │ ──────────────────▶ │  opencode serve    │
│  React + Vite  │ ◀──────────── │  Node + Fastify  │ ◀────────────────── │  (puerto 4096)     │
└────────────────┘               └──────────────────┘                     └────────────────────┘
                                                                                 │
                                                                                 ▼
                                                                          OpenCode Go API
                                                                          (tus modelos pagos)
```

El server de Node **no** habla directo con OpenCode Go: arranca/usa un server local de `opencode` (puerto 4096) que ya tiene tus credenciales (`~/.local/share/opencode/auth.json`) y delega todo el manejo de modelos ahí.

## Requisitos

- **Node.js >= 20**
- **pnpm 11+** (`npm i -g pnpm` o `corepack enable`)
- **opencode CLI** instalado y autenticado con OpenCode Go:
  ```bash
  pnpm add -g opencode-ai      # o el instalador de opencode.ai
  opencode                      # abrí la TUI
  /connect                      # elegí "OpenCode Go" y pegá tu API key
  ```

## Instalación

```bash
pnpm install
cp .env.example .env
```

Editá `.env` si querés cambiar el puerto del server, el origin del frontend, o si `opencode serve` corre en otro host/puerto.

## Levantar el server de opencode

En una terminal aparte:

```bash
opencode serve --port 4096
```

(o simplemente abrí `opencode` en otra terminal — la TUI ya expone el server en 4096).

## Dev (todo junto)

```bash
pnpm dev
```

Esto arranca `apps/server` (http://localhost:3001) y `apps/web` (http://localhost:5173) en paralelo. El proxy de Vite redirige `/api/*` al server de Node.

Abrí http://localhost:5173 y empezá a chatear.

## Uso

1. La primera vez, elegí un modelo en el dropdown del header. Los modelos listados son los que el server de opencode conoce (incluyendo los de OpenCode Go).
2. Hacé click en **+ Nuevo** para crear una conversación. El título se autoderiva del primer mensaje.
3. Escribí y mandá con Enter. Shift+Enter para nueva línea.
4. (Opcional) Tocá **System prompt** en el header para setear instrucciones globales — se guardan en `localStorage`.
5. Doble click sobre el título de una conversación para renombrarla. Hover → papelera para borrar.

## Build de producción

```bash
pnpm build
pnpm start         # arranca el server de Node (sirve el build estático del front)
```

## Estructura

```
.
├── apps/
│   ├── server/                # Fastify + @opencode-ai/sdk + SSE
│   │   └── src/
│   │       ├── index.ts       # entrypoint
│   │       ├── opencode.ts    # cliente del SDK
│   │       └── routes/
│   │           ├── chat.ts        # POST /api/chat (streaming SSE)
│   │           ├── sessions.ts    # CRUD de sesiones + historial
│   │           ├── models.ts      # GET /api/models
│   │           └── health.ts      # GET /api/health
│   └── web/                   # Vite + React + Tailwind
│       └── src/
│           ├── App.tsx
│           ├── components/
│           │   ├── Sidebar.tsx
│           │   ├── Composer.tsx
│           │   ├── MessageBubble.tsx
│           │   ├── Markdown.tsx
│           │   └── ModelPicker.tsx
│           └── lib/
│               ├── api.ts        # fetch + SSE parser
│               ├── storage.ts    # localStorage
│               └── types.ts
├── .env.example
├── package.json               # workspace root
└── pnpm-workspace.yaml
```

## Variables de entorno (server)

| Variable | Default | Descripción |
|---|---|---|
| `OPENCODE_SERVER_URL` | `http://127.0.0.1:4096` | URL del server de opencode |
| `OPENCODE_SERVER_USERNAME` | — | Basic auth username (si usás `OPENCODE_SERVER_PASSWORD`) |
| `OPENCODE_SERVER_PASSWORD` | — | Basic auth password |
| `SERVER_PORT` | `3001` | Puerto del backend |
| `WEB_ORIGIN` | `http://localhost:5173` | Origin permitido en CORS |
| `LOG_LEVEL` | `info` | Nivel de log de pino |

## Troubleshooting

- **"opencode server not responding"** → arrancá `opencode serve` en otra terminal.
- **No aparecen los modelos de OpenCode Go** → corré `opencode` y `/connect`, elegí **OpenCode Go**, pegá tu API key de https://opencode.ai/auth. Después `/models` debería listarlos.
- **El stream se queda pegado** → abrí la consola del navegador; los eventos SSE llegan al endpoint `/api/chat` y se loguean ahí también.
- **CORS error en dev** → verificá que `WEB_ORIGIN` en `.env` coincida con el puerto del Vite (5173 por default).
