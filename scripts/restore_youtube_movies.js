import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = 'https://ksyrtesvmqgozwomaqte.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeXJ0ZXN2bXFnb3p3b21hcXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjkyNjksImV4cCI6MjEwNzEwNTI2OX0.2VEfFTFhOxA-A80hmyjOK8bPE939YG1zKsvHHP_jBDc';
const supabase = createClient(url, key);

const jsonPath = path.join(__dirname, '../src/data/localMovies.json');
const backupPath = path.join(__dirname, '../src/data/localMovies.backup_1791609586217.json');

const currentMovies = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const backupMovies = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Build map of backup movies that have YouTube links
const backupMap = new Map();
backupMovies.forEach(m => {
  const allStreams = [...(m.streams || []), ...(m.sources || [])];
  const hasYt = allStreams.some(s => s.url && (s.url.includes('youtube.com') || s.url.includes('youtu.be')));
  if (hasYt) {
    backupMap.set(m.id, m);
  }
});

console.log(`🔍 Tìm thấy ${backupMap.size} phim gốc có nguồn YouTube được chọn lọc từ trước:`);

const restored = [];

currentMovies.forEach(m => {
  if (backupMap.has(m.id)) {
    const original = backupMap.get(m.id);
    m.streams = original.streams || original.sources;
    m.sources = original.sources || original.streams;
    delete m.kkphim_slug;
    restored.push(m);
    console.log(`↺ [${m.id}] ${m.title} -> Khôi phục YouTube: ${m.streams[0]?.url}`);
  }
});

// 1. Save local JSON
fs.writeFileSync(jsonPath, JSON.stringify(currentMovies, null, 2), 'utf8');
console.log(`\n💾 Đã cập nhật lại ${jsonPath}`);

// 2. Sync restored movies to Supabase
async function syncToSupabase() {
  console.log(`\n☁️ Đang đồng bộ ${restored.length} phim YouTube gốc lên Supabase...`);
  let count = 0;
  for (const m of restored) {
    const payload = {
      id: m.id,
      title: m.title,
      category: m.category,
      poster: m.poster,
      banner: m.banner,
      streams: m.streams,
      subtitles: m.subtitles || [],
      description: m.description,
      genres: m.genres || m.tags || [],
      releaseYear: m.releaseYear || null,
      duration: m.duration || null,
      franchise: m.franchise || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('movies')
      .upsert(payload, { onConflict: 'id' });

    if (!error) {
      count++;
      console.log(`☁️ Đã đồng bộ Supabase: [${m.id}] ${m.title}`);
    } else {
      console.error(`❌ Lỗi Supabase [${m.id}]:`, error.message);
    }
  }

  console.log(`\n🎉 HOÀN TẤT: Đã khôi phục thành công ${count}/${restored.length} phim YouTube!`);
}

syncToSupabase();
