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
const backupPath = path.join(__dirname, `../src/data/localMovies.backup_${Date.now()}.json`);

const movies = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 1. Create backup
fs.writeFileSync(backupPath, JSON.stringify(movies, null, 2), 'utf8');
console.log(`📦 Đã tạo bản sao lưu dữ liệu tại: ${backupPath}`);

const slugMap = {
  'dienanh-traitim': 'dang-hinh-thanh-am',
  'dienanh-truman': 'buoi-dien-cua-truman',
  'dienanh-liar': 'dung-noi-doi-bo-oi',
  'dienanh-bruce': 'mot-ngay-lam-thuong-de',
  'dienanh-goodwill': 'chang-will-tot-bung',
  'dienanh-12angry': '12-nguoi-dan-ong-gian-du-1997',
  'dienanh-wolf': 'soi-gia-pho-wall',
  'dienanh-godzilla': 'godzilla-tru-mot',
  'dienanh-spiderman1': 'nguoi-nhen-2002',
  'dienanh-batman': 'ky-si-bong-dem-troi-day',
  'dienanh-pulp': 'chuyen-tao-lao',
  'dienanh-who': 'toi-la-ai',
  'dienanh-cinema': 'cau-chuyen-do-choi-thoi-gian-bi-lang-quen',
  'dienanh-badguy': 'nhung-ke-xau-xa-phan-2',
  'dienanh-laudai': 'lau-dai-bay-cua-phap-su-howl',
  'dienanh-spiderman2': 'nguoi-nhen-2',
  'dienanh-spiderman3': 'nguoi-nhen-3',
  'hoathinh-index': 'gio-noi',
  'hoathinh-5cms': '5-centimet-tren-giay',
  'hoathinh-silentvoice': 'dang-hinh-thanh-am',
  'hoathinh-laudai': 'lau-dai-bay-cua-phap-su-howl',
  'hoathinh-shrek1': 'shrek',
  'hoathinh-toy': 'cau-chuyen-do-choi-thoi-gian-bi-lang-quen',
  'hoathinh-badguy': 'nhung-ke-xau-xa-phan-2',
  'hoathinh-coco': 'coco-hoi-ngo-dieu-ky',
  'hoathinh-bachang': 'doraemon-nobita-va-ba-chang-hiep-si-mong-mo',
  'hoathinh-mecung': 'doraemon-nobita-va-me-cung-thiec',
  'hoathinh-binhdoan': 'doraemon-nobita-va-binh-doan-nguoi-sat-1986',
  'hoathinh-khunglong': 'doraemon-chu-khung-long-cua-nobita-1980',
  'hoathinh-gionoi': 'gio-noi',
  'hoathinh-shrek3': 'ga-chan-tinh-tot-bung-phan-3',
  'dienanh-scarface-1983': 'mat-seo',
  'dienanh-fight-club-1999': 'san-dau-sinh-tu',
  'dienanh-taxi-driver-1976': 'taxi-driver',
  'dienanh-goodfellas-1990': 'chien-huu',
  'dienanh-nightcrawler-2014': 'ke-san-tin-den',
  'dienanh-tokyo-drift': 'qua-nhanh-qua-nguy-hiem-3-duong-dua-tokyo',
  'dienanh-vo-gian-dao': 'vo-gian-dao',
  'dienanh-boyz-n-the-hood': 'duong-doi',
  'hoathinh-courage-dog': 'courage-chu-cho-nhut-nhat-phan-3',
  'hoathinh-tom-and-jerry': 'tom-va-jerry-tuyen-tap-kinh-dien',
  'hoathinh-bojack-horseman': 'chu-ngua-an-choi-phan-6',
  'hoathinh-cowboy-bebop': 'cowboy-bebop',
  'hoathinh-lucky-luke': 'lucky-luke-anh-em-nha-daltons',
  'hoathinh-dragon-ball-daima': 'dragon-ball-daima'
};

async function syncAll() {
  console.log('🚀 Bắt đầu lấy link M3U8 từ KKPhim cho 45 phim...');
  const updatedMovies = [];
  let successCount = 0;

  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];
    const slug = slugMap[m.id];
    if (!slug) {
      continue; // Bỏ qua các phim Châu Tinh Trì & HK
    }

    try {
      const res = await fetch(`https://phimapi.com/phim/${slug}`).then(r => r.json());
      const serverData = res?.episodes?.[0]?.server_data;

      if (serverData && serverData.length > 0) {
        const ep0 = serverData[0];
        const linkM3U8 = ep0.link_m3u8;
        const linkEmbed = ep0.link_embed;

        const newStreams = [
          {
            server: 'Server M3U8 VIP (KKPhim)',
            name: 'Server M3U8 VIP (KKPhim)',
            url: linkM3U8,
            type: 'm3u8'
          },
          {
            server: 'Server Embed (Dự phòng)',
            name: 'Server Embed (Dự phòng)',
            url: linkEmbed,
            type: 'iframe'
          }
        ];

        m.streams = newStreams;
        m.sources = newStreams;
        m.kkphim_slug = slug;

        updatedMovies.push(m);
        successCount++;
        console.log(`✅ [${successCount}/45] ${m.id} (${m.title}) -> M3U8: ${linkM3U8.substring(0, 45)}...`);
      } else {
        console.warn(`⚠️ [${m.id}] Không tìm thấy server_data từ slug: ${slug}`);
      }
    } catch (err) {
      console.error(`❌ [${m.id}] Lỗi fetch API:`, err.message);
    }
  }

  // 2. Save local JSON
  fs.writeFileSync(jsonPath, JSON.stringify(movies, null, 2), 'utf8');
  console.log(`\n💾 Đã lưu thành công ${movies.length} phim vào localMovies.json!`);

  // 3. Sync to Supabase
  console.log(`\n☁️ Đang đồng bộ ${updatedMovies.length} phim lên Supabase...`);
  let supabaseSuccess = 0;
  for (const m of updatedMovies) {
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
      supabaseSuccess++;
      console.log(`☁️ Đã đồng bộ lên Supabase: ${m.id}`);
    } else {
      console.error(`❌ Lỗi Supabase [${m.id}]:`, error.message);
    }
  }

  console.log(`\n🎉 HOÀN THÀNH: Đã đồng bộ ${supabaseSuccess}/${updatedMovies.length} phim lên Supabase!`);
}

syncAll();
