import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env
const envPath = path.join(__dirname, '../.env');
let url = process.env.VITE_SUPABASE_URL;
let key = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
  if (urlMatch && !url) url = urlMatch[1].trim();
  if (keyMatch && !key) key = keyMatch[1].trim();
}

if (!url || !key) {
  console.error('❌ Lỗi: Cần VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function fetchFromPhimApi(slug) {
  try {
    const res = await fetch(`https://phimapi.com/phim/${slug}`).then(r => r.json());
    if (res.status && res.movie) {
      return res;
    }
  } catch (e) {}
  return null;
}

async function prepareMovies() {
  const moviesToAdd = [];

  // 1. The End of the F***ing World (2 seasons, 16 episodes in ONE single card)
  console.log('⏳ Đang lấy dữ liệu: The End of the F***ing World (2 Seasons)...');
  const s1Data = await fetchFromPhimApi('hanh-trinh-chet-tiet-phan-1');
  const s2Data = await fetchFromPhimApi('hanh-trinh-chet-tiet-phan-2');

  const teotfwStreams = [];
  if (s1Data?.episodes?.[0]?.server_data) {
    s1Data.episodes[0].server_data.forEach(ep => {
      teotfwStreams.push({
        server: `S1 - Tập ${ep.name}`,
        name: `Mùa 1 - Tập ${ep.name}`,
        url: ep.link_m3u8,
        type: 'm3u8'
      });
    });
  }
  if (s2Data?.episodes?.[0]?.server_data) {
    s2Data.episodes[0].server_data.forEach(ep => {
      teotfwStreams.push({
        server: `S2 - Tập ${ep.name}`,
        name: `Mùa 2 - Tập ${ep.name}`,
        url: ep.link_m3u8,
        type: 'm3u8'
      });
    });
  }

  moviesToAdd.push({
    id: 'dienanh-the-end-of-the-fucking-world',
    title: 'The End of the F***ing World (Trọn Bộ 2 Mùa)',
    category: 'dienanh',
    categoryLabel: 'Điện Ảnh Chiếu Rạp',
    poster: 'https://phimimg.com/upload/vod/20240327-1/a248a3bf6041ec1d9061033230a1cbb1.jpg',
    banner: 'https://phimimg.com/upload/vod/20240327-1/080c926c04f98124976c66cf17f0980f.jpg',
    description: 'James - một cậu thiếu niên 17 tuổi tự nhận mình là kẻ tâm thần và Alyssa - cô bạn học nổi loạn bỏ nhà ra đi cùng nhau bước vào chuyến hành trình đầy biến cố và trớ trêu. Trọn bộ 2 mùa (16 tập) chất lượng cao tại NAM.OV.',
    duration: '16 tập (~22p/tập)',
    releaseYear: 2019,
    rating: 8.9,
    genres: ['Hài Đen', 'Tâm Lý', 'Phiêu Lưu', 'Kịch Tính'],
    streams: teotfwStreams,
    subtitles: [],
    franchise: null
  });

  // PhimAPI single movies list
  const phimApiList = [
    {
      id: 'dienanh-modern-times-1936',
      slug: 'thoi-dai-tan-ky',
      customTitle: 'Thời Đại Tân Kỳ - Modern Times (1936)',
      desc: 'Kiệt tác hài kịch câm châm biếm kinh điển của Charlie Chaplin về cuộc sống của người công nhân trong kỷ nguyên công nghiệp hóa hiện đại.',
      rating: 8.8
    },
    {
      id: 'dienanh-city-lights-1931',
      slug: 'anh-sang-do-thi',
      customTitle: 'Ánh Sáng Đô Thị - City Lights (1931)',
      desc: 'Câu chuyện tình cảm động và hài hước giữa anh chàng lang thang Charlie Chaplin và cô gái bán hoa mù lòa giữa thành phố hoa lệ.',
      rating: 8.7
    },
    {
      id: 'dienanh-the-gold-rush-1925',
      slug: 'con-sot-vang',
      customTitle: 'Cơn Sốt Vàng - The Gold Rush (1925)',
      desc: 'Charlie Chaplin vào vai kẻ đi tìm vàng lang thang tại Klondike, trải qua bão tuyết hiểm nghèo và những tình huống dở khóc dở cười.',
      rating: 8.6
    },
    {
      id: 'dienanh-the-great-dictator-1940',
      slug: 'ke-doc-tai-vi-dai',
      customTitle: 'Kẻ Độc Tài Vĩ Đại - The Great Dictator (1940)',
      desc: 'Bộ phim điện ảnh tiếng đầu tiên và xuất sắc nhất của Charlie Chaplin, châm biếm sâu sắc chủ nghĩa phát xít với bài phát biểu vì hòa bình lay động lịch sử.',
      rating: 8.9
    },
    {
      id: 'dienanh-12-angry-men-1957',
      slug: '12-nguoi-dan-ong-gian-du',
      customTitle: '12 Người Đàn Ông Giận Dữ - 12 Angry Men (1957)',
      desc: 'Một trong những kiệt tác vĩ đại nhất lịch sử điện ảnh. 12 bồi thẩm đoàn tranh luận căng thẳng về sự sống chết của một chàng trai bị buộc tội giết cha.',
      rating: 9.0
    },
    {
      id: 'dienanh-no-other-choice-2025',
      slug: 'buoc-duong-cung-2025',
      customTitle: 'Bước Đường Cùng - No Other Choice (2025)',
      desc: 'Bộ phim tâm lý giật gân hồi hộp về những con người bị dồn vào bước đường cùng không còn lối thoát, buộc phải đưa ra những quyết định sinh tử.',
      rating: 8.3
    },
    {
      id: 'dienanh-interstellar-2014',
      slug: 'ho-den-tu-than',
      customTitle: 'Hố Đen Tử Thần - Interstellar (2014)',
      desc: 'Kiệt tác khoa học viễn tưởng vượt thời gian của đạo diễn Christopher Nolan về chuyến hành trình xuyên lỗ sâu vũ trụ tìm kiếm miền đất hứa cho nhân loại.',
      rating: 8.9
    },
    {
      id: 'dienanh-joker-2019',
      slug: 'joker-ga-he',
      customTitle: 'Joker - Gã Hề (2019)',
      desc: 'Màn hóa thân huyền thoại đoạt giải Oscar của Joaquin Phoenix vào vai Arthur Fleck, kẻ bên lề xã hội dần trượt dài vào bóng tối hỗn loạn của thành phố Gotham.',
      rating: 8.7
    },
    {
      id: 'dienanh-the-pianist-2002',
      slug: 'nghe-si-duong-cam',
      customTitle: 'Nghệ Sĩ Dương Cầm - The Pianist (2002)',
      desc: 'Bản hùng ca đầy bi tráng về cuộc sống và ý chí sinh tồn phi thường của nghệ sĩ piano Do Thái Wladyslaw Szpilman giữa lòng Warsaw đổ nát trong Thế chiến II.',
      rating: 8.8
    }
  ];

  for (const item of phimApiList) {
    console.log(`⏳ Đang lấy dữ liệu: ${item.customTitle}...`);
    const data = await fetchFromPhimApi(item.slug);
    if (data?.movie) {
      const m = data.movie;
      const streams = [];

      // Add m3u8 stream
      const epData = data.episodes?.[0]?.server_data?.[0];
      if (epData?.link_m3u8) {
        streams.push({
          server: 'VIP HLS (M3U8)',
          name: 'VIP HLS (M3U8)',
          url: epData.link_m3u8,
          type: 'm3u8'
        });
      }
      if (epData?.link_embed) {
        streams.push({
          server: 'Server Dự Phòng (Embed)',
          name: 'Server Dự Phòng (Embed)',
          url: epData.link_embed,
          type: 'iframe'
        });
      }

      moviesToAdd.push({
        id: item.id,
        title: item.customTitle,
        category: 'dienanh',
        categoryLabel: 'Điện Ảnh Chiếu Rạp',
        poster: m.poster_url || m.thumb_url,
        banner: m.thumb_url || m.poster_url,
        description: item.desc || (m.content ? m.content.replace(/<[^>]*>?/gm, '') : ''),
        duration: m.time || '110 phút',
        releaseYear: parseInt(m.year, 10) || 2024,
        rating: item.rating || 8.5,
        genres: m.category?.map(c => c.name) || ['Điện Ảnh', 'Chiếu Rạp'],
        streams: streams,
        subtitles: [],
        franchise: null
      });
    }
  }

  // 4 special public domain & classic films (The Kid, The Circus, Trinity 1, Trinity 2)
  console.log('⏳ Đang thêm các phim kinh điển: The Kid, The Circus, Trinity 1 & 2...');

  moviesToAdd.push({
    id: 'dienanh-the-kid-1921',
    title: 'Cậu Bé - The Kid (1921)',
    category: 'dienanh',
    categoryLabel: 'Điện Ảnh Chiếu Rạp',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/The_Kid_%281921%29_poster.jpg',
    banner: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/The_Kid_%281921%29_poster.jpg',
    description: 'Tác phẩm điện ảnh dài đầu tay của Charlie Chaplin, kết hợp tài tình giữa nụ cười và nước mắt trong tình cha con giữa chàng lang thang và đứa trẻ bị bỏ rơi.',
    duration: '68 phút',
    releaseYear: 1921,
    rating: 8.5,
    genres: ['Hài Kịch Câm', 'Gia Đình', 'Kinh Điển'],
    streams: [
      {
        server: 'Server YouTube HD (Bản Chuẩn)',
        name: 'Server YouTube HD (Bản Chuẩn)',
        url: 'https://www.youtube.com/embed/qNseEVlaCl4',
        type: 'iframe'
      }
    ],
    subtitles: [],
    franchise: null
  });

  moviesToAdd.push({
    id: 'dienanh-the-circus-1928',
    title: 'Rạp Xiếc - The Circus (1928)',
    category: 'dienanh',
    categoryLabel: 'Điện Ảnh Chiếu Rạp',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/The_Circus_%281928%29_-_Hap_Hadley_poster.jpg',
    banner: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/The_Circus_%281928%29_-_Hap_Hadley_poster.jpg',
    description: 'Chàng lang thang Charlie Chaplin vô tình lạc vào một gánh xiếc đang ế ẩm và trở thành ngôi sao hề được yêu thích nhất mà không hề hay biết.',
    duration: '72 phút',
    releaseYear: 1928,
    rating: 8.4,
    genres: ['Hài Kịch Câm', 'Lãng Mạn', 'Kinh Điển'],
    streams: [
      {
        server: 'Server YouTube HD (Bản Chuẩn)',
        name: 'Server YouTube HD (Bản Chuẩn)',
        url: 'https://www.youtube.com/embed/s1R4x9RmWec',
        type: 'iframe'
      }
    ],
    subtitles: [],
    franchise: null
  });

  moviesToAdd.push({
    id: 'dienanh-they-call-me-trinity-1970',
    title: 'Họ Gọi Tôi Là Trinity - They Call Me Trinity (1970)',
    category: 'dienanh',
    categoryLabel: 'Điện Ảnh Chiếu Rạp',
    poster: 'https://upload.wikimedia.org/wikipedia/en/7/70/Lo_chiamavano_Trinit%C3%A0..._poster.jpg',
    banner: 'https://upload.wikimedia.org/wikipedia/en/7/70/Lo_chiamavano_Trinit%C3%A0..._poster.jpg',
    description: 'Phim cao bồi Viễn Tây hài hước (Spaghetti Western) kinh điển với bộ đôi huyền thoại Terence Hill và Bud Spencer đối đầu với lũ cướp để bảo vệ nông dân.',
    duration: '113 phút',
    releaseYear: 1970,
    rating: 8.6,
    genres: ['Cao Bồi', 'Hài Hước', 'Hành Động'],
    streams: [
      {
        server: 'Server HD (Bản Chuẩn)',
        name: 'Server HD (Bản Chuẩn)',
        url: 'https://www.youtube.com/embed/7ZqWv_gN5lA',
        type: 'iframe'
      }
    ],
    subtitles: [],
    franchise: null
  });

  moviesToAdd.push({
    id: 'dienanh-trinity-is-still-my-name-1971',
    title: 'Tôi Vẫn Là Trinity - Trinity Is Still My Name (1971)',
    category: 'dienanh',
    categoryLabel: 'Điện Ảnh Chiếu Rạp',
    poster: 'https://upload.wikimedia.org/wikipedia/en/1/16/TrinityIsStillMyName.jpg',
    banner: 'https://upload.wikimedia.org/wikipedia/en/1/16/TrinityIsStillMyName.jpg',
    description: 'Phần tiếp theo cực kỳ ăn khách của bộ đôi Trinity và Bambino trong nỗ lực trở thành những tên cướp "chuyên nghiệp" nhưng luôn vô tình trở thành người hùng.',
    duration: '117 phút',
    releaseYear: 1971,
    rating: 8.5,
    genres: ['Cao Bồi', 'Hài Hước', 'Hành Động'],
    streams: [
      {
        server: 'Server HD (Bản Chuẩn)',
        name: 'Server HD (Bản Chuẩn)',
        url: 'https://www.youtube.com/embed/M1k6Z9b5l_Q',
        type: 'iframe'
      }
    ],
    subtitles: [],
    franchise: null
  });

  return moviesToAdd;
}

async function run() {
  const movies = await prepareMovies();
  console.log(`\n🎉 Chuẩn bị xong ${movies.length} bộ phim.`);

  // 1. Upload to Supabase
  console.log('🚀 Đang đồng bộ lên Supabase Cloud Database...');
  for (const m of movies) {
    const payload = {
      id: m.id,
      title: m.title,
      category: m.category,
      banner: m.banner,
      poster: m.poster,
      description: m.description,
      duration: m.duration,
      releaseYear: m.releaseYear,
      rating: m.rating,
      genres: m.genres,
      streams: m.streams,
      subtitles: m.subtitles || [],
      franchise: m.franchise || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('movies').upsert([payload], { onConflict: 'id' });
    if (error) {
      console.error(`❌ Lỗi thêm phim ${m.title}:`, error.message);
    } else {
      console.log(`✅ [Supabase] Đã lưu: ${m.title} (${m.streams.length} nguồn/tập)`);
    }
  }

  // 2. Also save to localMovies.json (cache)
  console.log('\n📦 Đang cập nhật vào cache src/data/localMovies.json...');
  const jsonPath = path.join(__dirname, '../src/data/localMovies.json');
  let localData = [];
  try {
    let raw = fs.readFileSync(jsonPath, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    localData = JSON.parse(raw);
  } catch (e) {
    console.warn('Lỗi đọc localMovies.json, tạo mới');
  }

  // Filter out duplicates and prepend newly added movies
  const movieIds = new Set(movies.map(m => m.id));
  localData = [...movies, ...localData.filter(m => !movieIds.has(m.id))];

  fs.writeFileSync(jsonPath, JSON.stringify(localData, null, 2), 'utf8');
  console.log('✅ Đã cập nhật thành công localMovies.json!');
  console.log('✨ Hoàn tất 100%!');
}

run().catch(console.error);
