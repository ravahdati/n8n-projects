#!/usr/bin/env node
/**
 * Scans projects/*, validates each info.json and builds dist/:
 *   dist/                 <- contents of site/
 *   dist/projects.json    <- generated list (what the website reads)
 *   dist/projects/<slug>/ <- image + workflow file of each project
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROJECTS = path.join(ROOT, 'projects');
const SITE = path.join(ROOT, 'site');
const DIST = path.join(ROOT, 'dist');

const warn = (m) => console.warn('⚠️  ' + m);
const fail = (m) => { console.error('❌ ' + m); process.exitCode = 1; };

const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];

function findImage(dir, wanted) {
  if (wanted && fs.existsSync(path.join(dir, wanted))) return wanted;
  const files = fs.readdirSync(dir);
  return (
    files.find((f) => /^preview\./i.test(f) && IMAGE_EXT.includes(path.extname(f).toLowerCase())) ||
    files.find((f) => IMAGE_EXT.includes(path.extname(f).toLowerCase())) ||
    null
  );
}

function nodeNamesFrom(workflow) {
  const set = new Set();
  for (const n of workflow.nodes || []) {
    const t = String(n.type || '').split('.').pop();
    if (t) set.add(t.charAt(0).toUpperCase() + t.slice(1));
  }
  return [...set];
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(SITE, DIST, { recursive: true });

const list = [];
const folders = fs.existsSync(PROJECTS)
  ? fs.readdirSync(PROJECTS, { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];

for (const d of folders) {
  const slug = d.name;
  const dir = path.join(PROJECTS, slug);
  const infoPath = path.join(dir, 'info.json');
  if (!fs.existsSync(infoPath)) { warn(`${slug}: info.json not found, skipped`); continue; }

  let info;
  try { info = JSON.parse(fs.readFileSync(infoPath, 'utf8')); }
  catch (e) { fail(`${slug}: info.json is not valid JSON (${e.message})`); continue; }
  if (!info.title) { fail(`${slug}: "title" is required in info.json`); continue; }

  const workflowFile = info.workflow || 'workflow.json';
  const workflowPath = path.join(dir, workflowFile);
  let workflow = null;
  if (fs.existsSync(workflowPath)) {
    try { workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8')); }
    catch (e) { fail(`${slug}: ${workflowFile} is not valid JSON (${e.message})`); continue; }
  } else {
    fail(`${slug}: workflow file "${workflowFile}" not found`);
    continue;
  }

  const image = findImage(dir, info.image);
  if (!image) warn(`${slug}: no image found`);

  const out = path.join(DIST, 'projects', slug);
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(workflowPath, path.join(out, workflowFile));
  if (image) fs.copyFileSync(path.join(dir, image), path.join(out, image));

  list.push({
    slug,
    title: info.title,
    summary: info.summary || '',
    description: info.description || '',
    tags: info.tags || [],
    difficulty: info.difficulty || '',
    created: info.created || '',
    featured: !!info.featured,
    nodes: info.nodes || nodeNamesFrom(workflow),
    nodeCount: (workflow.nodes || []).length,
    image: image ? `projects/${slug}/${image}` : '',
    workflow: `projects/${slug}/${workflowFile}`,
  });
}

list.sort(
  (a, b) =>
    Number(b.featured) - Number(a.featured) ||
    String(b.created).localeCompare(String(a.created)) ||
    a.slug.localeCompare(b.slug)
);

fs.writeFileSync(
  path.join(DIST, 'projects.json'),
  JSON.stringify({ generated: new Date().toISOString(), projects: list }, null, 2)
);
console.log(`✅ ${list.length} project(s) built → dist/`);
