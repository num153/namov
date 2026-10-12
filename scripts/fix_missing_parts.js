import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let url = process.env.VITE_SUPABASE_URL;
let key = process.env.VITE_SUPABASE_ANON_KEY;

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
  if (urlMatch && !url) url = urlMatch[1].trim();
  if (keyMatch && !key) key = keyMatch[1].trim();
}

if (!url || !key) {
  console.error('❌ Lỗi: Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env!');
  process.exit(1);
}

const supabase = createClient(url, key);

const jsonPath = path.join(__dirname, '../src/data/localMovies.json');
const movies = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const idSet = new Set(movies.map(m => m.id));

function extractStreamsFromFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, 'utf8');
  const list = [];
  // Match <source src="..." type="...">
  const srcRe = /<source\s+src="([^"]+)"\s+type="([^"]+)"/gi;
  let m;
  while ((m = srcRe.exec(text)) !== null) {
    list.push({ server: 'Server VIP', name: 'Server VIP', url: m[1], type: m[2].includes('m3u8') ? 'm3u8' : 'video' });
  }
  // Match iframes
  const ifrRe = /<iframe\s[^>]*src="([^"]+)"/gi;
  let n;
  while ((n = ifrRe.exec(text)) !== null) {
    list.push({ server: 'Server Embed', name: 'Server Embed', url: n[1], type: 'embed' });
  }
  return list;
}

// Gather all unique missing part IDs across ALL movies
const uniqueMissing = new Map(); // id -> { title, franchise }
movies.forEach(m => {
  if (m.franchise && m.franchise.parts) {
    m.franchise.parts.forEach(p => {
      if (!idSet.has(p.id) && !uniqueMissing.has(p.id)) {
        uniqueMissing.set(p.id, { title: p.title, franchiseId: m.franchise.id, franchiseName: m.franchise.name, parts: m.franchise.parts, category: m.category, poster: m.poster, banner: m.banner });
      }
    });
  }
});

console.log('Missing parts to create:', uniqueMissing.size);

// Build new movie records for missing parts
const newMovies = [];
for (const [id, info] of uniqueMissing) {
  // Try to find HTML file
  const slug = id.replace('chautinhtri-', 'chau-tinh-tri/');
  const htmlPath = path.join(__dirname, '..', slug + '.html');
  const streams = extractStreamsFromFile(htmlPath);

  const partObj = info.parts.find(p => p.id === id);
  const newMovie = {
    id,
    title: info.title || partObj?.title || id,
    category: info.category || 'chautinhtri',
    categoryLabel: 'Châu Tinh Trì & HK',
    poster: info.poster,
    banner: info.banner,
    description: `${info.title} - Bộ phim thuộc tuyển tập ${info.franchiseName}.`,
    duration: '~90 phút',
    releaseYear: null,
    rating: 8.5,
    genres: ['Hài Hước', 'Hành Động', 'Châu Tinh Trì'],
    streams: streams.length > 0 ? streams : [],
    sources: streams.length > 0 ? streams : [],
    subtitles: [],
    franchise: { id: info.franchiseId, name: info.franchiseName, parts: info.parts },
  };
  newMovies.push(newMovie);
  console.log(`Created record for: ${id} | streams: ${streams.length}`);
}

// Add to localMovies.json
const updatedMovies = [...movies, ...newMovies];
fs.writeFileSync(jsonPath, JSON.stringify(updatedMovies, null, 2), 'utf8');
console.log(`✅ Added ${newMovies.length} missing parts to localMovies.json. Total: ${updatedMovies.length}`);

// Sync new entries to Supabase
if (newMovies.length > 0) {
  const cleaned = newMovies.map(m => ({
    id: String(m.id),
    title: m.title,
    category: m.category,
    banner: m.banner || null,
    poster: m.poster || null,
    description: m.description,
    duration: m.duration,
    releaseYear: m.releaseYear || null,
    rating: m.rating || null,
    genres: m.genres || [],
    streams: m.streams || [],
    subtitles: [],
    franchise: m.franchise || null,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('movies').upsert(cleaned, { onConflict: 'id' });
  if (error) console.error('Supabase sync error:', error.message);
  else console.log(`🎉 Synced ${newMovies.length} new records to Supabase!`);
}
