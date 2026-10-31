# n8n Projects · پروژه‌های n8n

Showcase of my n8n workflows, published automatically on GitHub Pages:
**https://ravahdati.github.io/n8n-projects/**

## Add a new project / افزودن پروژه جدید

1. Create a folder inside `projects/` (the folder name becomes the URL, e.g. `my-flow`).
2. Put these files inside it:
   - `workflow.json` – the exported n8n workflow
   - `preview.png` (or `.jpg` / `.svg` / `.webp`) – project image
   - `info.json` – details (see below)
3. `git add . && git commit -m "Add my-flow" && git push`

The GitHub Action rebuilds the list and the project appears on the site within a minute. Nothing else to edit.

## `info.json`

Only `title` is required. Every text field can be a plain string or `{ "fa": "...", "en": "..." }`.

```json
{
  "title": { "fa": "عنوان", "en": "Title" },
  "summary": { "fa": "خلاصه کارت", "en": "Card summary" },
  "description": { "fa": "توضیح کامل\n\nپاراگراف دوم", "en": "Full description\n\nSecond paragraph" },
  "tags": { "fa": ["وردپرس"], "en": ["WordPress"] },
  "difficulty": { "fa": "متوسط", "en": "Intermediate" },
  "created": "2026-10-31",
  "image": "preview.png",
  "workflow": "workflow.json",
  "nodes": ["Webhook", "OpenAI"],
  "featured": false
}
```

If `nodes` is omitted it is extracted from the workflow automatically. If `image` is omitted, `preview.*` is used.

## Local preview

```bash
node scripts/build.js
npx serve dist
```

## One-time setup

Repo → **Settings → Pages → Source: GitHub Actions**.
