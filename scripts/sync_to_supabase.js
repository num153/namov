import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.VITE_SUPABASE_URL || 'https://ksyrtesvmqgozwomaqte.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeXJ0ZXN2bXFnb3p3b21hcXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjkyNjksImV4cCI6MjEwNzEwNTI2OX0.2VEfFTFhOxA-A80hmyjOK8bPE939YG1zKsvHHP_jBDc';

const supabase = createClient(url, key);

async function syncMovies() {
  console.log('🚀 Đang đọc dữ liệu từ src/data/localMovies.json...');
  const jsonPath = path.join(__dirname, '../src/data/localMovies.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const movies = JSON.parse(rawData);

  console.log(`📦 Tìm thấy ${movies.length} bộ phim.`);

  // Clean data for Supabase insertion
  const cleanMovies = movies.map(m => ({
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

  console.log('⏳ Đang đồng bộ lên Supabase (Upsert theo lô)...');
  
  // Batch upload in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < cleanMovies.length; i += chunkSize) {
    const chunk = cleanMovies.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('movies')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Lỗi khi tải lô ${i / chunkSize + 1}:`, error.message);
      return;
    }
    console.log(`✅ Đã đồng bộ thành công ${Math.min(i + chunkSize, cleanMovies.length)} / ${cleanMovies.length} phim.`);
  }

  console.log('🎉 Hoàn tất đồng bộ toàn bộ phim lên Supabase!');
}

syncMovies().catch(err => console.error('Lỗi thực thi:', err));
