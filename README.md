# Canvas Monorepo

This is a monorepo containing the Canvas collaborative tools.

## Structure

```
canvas/
├── packages/
│   ├── frontend/     # React frontend with Vite + Tailwind + Firebase
│   └── ai-agent/     # AI agent (coming soon)
├── docs/             # Centralized documentation
└── package.json      # Workspace root
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the frontend in development mode:

```bash
npm run dev
# or
npm run dev:frontend
```

### Build

Build the frontend for production:

```bash
npm run build
# or
npm run build:frontend
```

## Packages

### Frontend (`packages/frontend`)

A real-time collaborative canvas application built with React, Konva.js, and Firebase.

See [packages/frontend/README.md](packages/frontend/README.md) for more details.

### AI Agent (`packages/ai-agent`)

Coming soon.

## Documentation

See the [docs](docs/) directory for architecture diagrams and planning documents.

