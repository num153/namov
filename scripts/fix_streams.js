import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://ksyrtesvmqgozwomaqte.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeXJ0ZXN2bXFnb3p3b21hcXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjkyNjksImV4cCI6MjEwNzEwNTI2OX0.2VEfFTFhOxA-A80hmyjOK8bPE939YG1zKsvHHP_jBDc';
const supabase = createClient(url, key);

const jsonPath = path.join(__dirname, '../src/data/localMovies.json');
const movies = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Helper to extract streams from html file if missing
function extractStreamsFromHtml(slug) {
  if (!slug) return [];
  const htmlFile = path.join(__dirname, '../', slug + '.html');
  if (!fs.existsSync(htmlFile)) return [];

  const text = fs.readFileSync(htmlFile, 'utf8');
  const list = [];

  // Match video source
  const sourceMatches = [...text.matchAll(/<source\s+[^>]*src=["']([^"']+)["'][^>]*type=["']([^"']+)["']/gi)];
  sourceMatches.forEach(m => {
    list.push({
      server: 'Server M3U8 VIP',
      name: 'Server M3U8 VIP',
      url: m[1],
      type: m[2].includes('m3u8') || m[1].includes('.m3u8') ? 'm3u8' : 'video'
    });
  });

  // Match iframes
  const iframeMatches = [...text.matchAll(/<iframe\s+[^>]*src=["']([^"']+)["']/gi)];
  iframeMatches.forEach(m => {
    list.push({
      server: 'Server Embed Dự Phòng',
      name: 'Server Embed Dự Phòng',
      url: m[1],
      type: 'embed'
    });
  });

  return list;
}

console.log('🔄 Đang kiểm tra và chuẩn hóa dữ liệu 132 phim...');

let fixedCount = 0;
const normalizedMovies = movies.map(m => {
  let streams = m.streams || m.sources || [];
  
  if (streams.length === 0) {
    streams = extractStreamsFromHtml(m.slug);
    if (streams.length > 0) {
      console.log(`✨ Đã trích xuất được nguồn cho: ${m.title} (${streams.length} server)`);
      fixedCount++;
    }
  }

  // Ensure both streams and sources exist and have server + name + url + type
  const normalizedStreams = streams.map(s => ({
    server: s.server || s.name || 'Server VIP',
    name: s.name || s.server || 'Server VIP',
    url: s.url,
    type: s.type || (s.url.includes('.m3u8') ? 'm3u8' : 'embed')
  }));

  return {
    ...m,
    sources: normalizedStreams,
    streams: normalizedStreams
  };
});

fs.writeFileSync(jsonPath, JSON.stringify(normalizedMovies, null, 2), 'utf8');
console.log(`✅ Đã chuẩn hóa localMovies.json (đã bổ sung ${fixedCount} phim bị thiếu nguồn).`);

// Upload all to Supabase with proper streams
async function syncToSupabase() {
  console.log('⏳ Đang cập nhật lại toàn bộ phim lên Supabase...');
  const cleanMovies = normalizedMovies.map(m => ({
    id: String(m.id),
    title: m.title || '',
    category: m.category || 'dienanh',
    banner: m.banner || null,
    poster: m.poster || null,
    description: m.description || '',
    duration: m.duration || '',
    releaseYear: m.releaseYear ? Number(m.releaseYear) : null,
    rating: m.rating ? Number(m.rating) : null,
    genres: m.genres || [],
    streams: m.streams || [],
    subtitles: m.subtitles || [],
    franchise: m.franchise || null,
    updated_at: new Date().toISOString()
  }));

  const chunkSize = 50;
  for (let i = 0; i < cleanMovies.length; i += chunkSize) {
    const chunk = cleanMovies.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('movies')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Lỗi tải lô ${i / chunkSize + 1}:`, error.message);
      return;
    }
  }
  console.log('🎉 Đã đồng bộ hoàn hảo toàn bộ 132 phim lên Supabase với đầy đủ luồng phát!');
}

syncToSupabase().catch(err => console.error(err));
