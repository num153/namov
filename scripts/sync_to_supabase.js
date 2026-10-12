import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
