# Blenheim Garden

A simple garden planner for seasonal growing in Blenheim, Marlborough.

## Current foundation

- Next.js 16
- React 19
- TypeScript
- OpenNext for Cloudflare Workers
- 12-bed garden dashboard shell
- Mobile-friendly layout

## Local development

```bash
npm install
npm run dev
```

## Cloudflare deployment

This repository is configured for OpenNext on Cloudflare Workers.

Use these Cloudflare build settings:

```text
Production branch: main
Build command: npx @opennextjs/cloudflare build
Deploy command: npx @opennextjs/cloudflare deploy
```

The Worker name is configured as:

```text
blenheim-garden
```

The normal package build script intentionally remains:

```text
npm run build -> next build
```

Do not change it to run OpenNext itself when Cloudflare is already running the OpenNext build command.

## Planned features

- Editable garden beds
- Blenheim seasonal planting calendar
- Seedling tracker
- Crop/variety notes
- Planting and transplant dates
- Harvest log and rough yield tracking
- Simple weekly garden task view
