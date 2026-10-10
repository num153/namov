import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = 'https://ksyrtesvmqgozwomaqte.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeXJ0ZXN2bXFnb3p3b21hcXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjkyNjksImV4cCI6MjEwNzEwNTI2OX0.2VEfFTFhOxA-A80hmyjOK8bPE939YG1zKsvHHP_jBDc';
const supabase = createClient(url, key);

const jsonPath = path.join(__dirname, '../src/data/localMovies.json');
const movies = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Highlight Stephen Chow movies mapping
const highlightMap = {
  'chautinhtri-vuahaikich': 'vua-hai-kich',
  'chautinhtri-tuyetdinhkungfu': 'tuyet-dinh-kungfu',
  'chautinhtri-doibongthieulam': 'doi-bong-thieu-lam',
  'chautinhtri-quanxamloccoc': 'quan-xam-loc-coc',
  'chautinhtri-duongbaho': 'duong-ba-ho-diem-thu-huong',
  'chautinhtri-quocsan007': 'quoc-san-007',
  'chautinhtri-thanan': 'than-an',
  'chautinhtri-dainoimattham': 'dai-noi-mat-tham',
  'chautinhtri-dainoimatthamsub': 'dai-noi-mat-tham',
  'chautinhtri-chuyengiaxaoquyet': 'chuyen-gia-xao-quyet',
  'chautinhtri-bachbientinhquan': 'bach-bien-tinh-quan',
  'chautinhtri-vuphahoai': 'vua-pha-hoai',
  'chautinhtri-vodichhanhvantinh': 'vo-dich-hanh-van-tinh',
  'chautinhtri-truonghocuylong1': 'truong-hoc-uy-long-i',
  'chautinhtri-truonghocuylong2': 'truong-hoc-uy-long-ii',
  'chautinhtri-truonghocuylong3': 'truong-hoc-uy-long-iii',
  'chautinhtri-tayduki1': 'dai-thoai-tay-du-i-nguyet-quang-bao-hap',
  'chautinhtri-tayduki2': 'dai-thoai-tay-du-phan-ii-tien-ly-ky-duyen',
  'chautinhtri-tantinvomon1': 'tan-tinh-vo-mon-1',
  'chautinhtri-dothanh1': 'thanh-bai-1-dai-dien-ma-cao-do-thanh',
  'chautinhtri-locdinhky1': 'loc-dinh-ky-i-vi-tieu-bao',
  'chautinhtri-locdinhky2': 'loc-dinh-ky-ii-than-long-giao',
  'chautinhtri-xamxuquan': 'xam-xu-quan',
  'chautinhtri-tokhatnhi': 'vo-trang-nguyen-to-khat-nhi',
  'chautinhtri-tecong': 'te-cong',
  'chautinhtri-chuyengiabatma': 'chuyen-gia-bat-ma',
  'chautinhtri-hoangtubanhtrung': 'hoang-tu-banh-trung',
  'chautinhtri-giahuuhysu1': 'gia-huu-hy-su-1',
  'chautinhtri-giahuuhysu2': 'gia-huu-hy-su-2',
  'chautinhtri-cj7': 'sieu-khuyen-than-thong',
  'chautinhtri-mynhanngu': 'my-nhan-ngu',
  'chautinhtri-tanvuahaikich': 'tan-vua-hai-kich',
  'chautinhtri-tinhthanh': 'tinh-thanh',
  'chautinhtri-vuabida': 'long-tich-truyen-nhan'
};

async function syncHighlights() {
  console.log('🚀 Bắt đầu cập nhật các phim Châu Tinh Trì nổi bật...');
  const updatedMovies = [];

  for (const m of movies) {
    const slug = highlightMap[m.id];
    if (!slug) continue;

    try {
      const res = await fetch(`https://phimapi.com/phim/${slug}`).then(r => r.json());
      if (res.status && res.episodes && res.episodes.length > 0) {
        // Collect old helvid streams to preserve as backup
        const oldHelvidStreams = (m.streams || m.sources || []).filter(s => s.url && s.url.includes('helvid.com'));

        const newStreams = [];

        // 1. Check for Lồng Tiếng server first (preferred by user)
        const ltServer = res.episodes.find(e => e.server_name.toLowerCase().includes('lồng tiếng'));
        if (ltServer && ltServer.server_data?.[0]?.link_m3u8) {
          newStreams.push({
            server: 'Server 1: Lồng Tiếng (M3U8 VIP)',
            name: 'Server 1: Lồng Tiếng (M3U8 VIP)',
            url: ltServer.server_data[0].link_m3u8,
            type: 'm3u8'
          });
        }

        // 2. Check for Thuyết Minh server
        const tmServer = res.episodes.find(e => e.server_name.toLowerCase().includes('thuyết minh'));
        if (tmServer && tmServer.server_data?.[0]?.link_m3u8) {
          const sName = ltServer ? 'Server 2: Thuyết Minh (M3U8 VIP)' : 'Server 1: Thuyết Minh (M3U8 VIP)';
          newStreams.push({
            server: sName,
            name: sName,
            url: tmServer.server_data[0].link_m3u8,
            type: 'm3u8'
          });
        }

        // 3. Check for Vietsub server
        const subServer = res.episodes.find(e => e.server_name.toLowerCase().includes('vietsub'));
        if (subServer && subServer.server_data?.[0]?.link_m3u8) {
          const sName = `Server ${newStreams.length + 1}: Vietsub (M3U8 VIP)`;
          newStreams.push({
            server: sName,
            name: sName,
            url: subServer.server_data[0].link_m3u8,
            type: 'm3u8'
          });
        }

        // 4. If no named servers, take default first server
        if (newStreams.length === 0 && res.episodes[0]?.server_data?.[0]?.link_m3u8) {
          newStreams.push({
            server: 'Server M3U8 VIP (KKPhim)',
            name: 'Server M3U8 VIP (KKPhim)',
            url: res.episodes[0].server_data[0].link_m3u8,
            type: 'm3u8'
          });
        }

        // 5. Append Old Helvid streams as Backup Server
        if (oldHelvidStreams.length > 0) {
          oldHelvidStreams.forEach((h, idx) => {
            newStreams.push({
              server: `Server ${newStreams.length + 1}: Helvid Dự Phòng ${idx > 0 ? idx + 1 : ''}`.trim(),
              name: `Server ${newStreams.length + 1}: Helvid Dự Phòng ${idx > 0 ? idx + 1 : ''}`.trim(),
              url: h.url,
              type: 'iframe'
            });
          });
        }

        m.streams = newStreams;
        m.sources = newStreams;
        m.kkphim_slug = slug;

        updatedMovies.push(m);
        console.log(`✅ [${updatedMovies.length}] ${m.id} (${m.title}) -> Đã thêm ${newStreams.length} Server!`);
      } else {
        console.warn(`⚠️ [${m.id}] Không tìm thấy dữ liệu từ KKPhim: ${slug}`);
      }
    } catch (err) {
      console.error(`❌ [${m.id}] Lỗi:`, err.message);
    }
  }

  // Save localMovies.json
  fs.writeFileSync(jsonPath, JSON.stringify(movies, null, 2), 'utf8');
  console.log(`\n💾 Đã cập nhật ${updatedMovies.length} phim Châu Tinh Trì vào localMovies.json!`);

  // Sync to Supabase
  console.log(`☁️ Đang đồng bộ lên Supabase...`);
  let count = 0;
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
      count++;
      console.log(`☁️ Đồng bộ Supabase thành công: [${m.id}] ${m.title}`);
    } else {
      console.error(`❌ Lỗi Supabase [${m.id}]:`, error.message);
    }
  }

  console.log(`\n🎉 HOÀN TẤT: Đã cập nhật & đồng bộ ${count}/${updatedMovies.length} phim Châu Tinh Trì nổi bật!`);
}

syncHighlights();
