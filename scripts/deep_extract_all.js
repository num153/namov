import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

function cleanStr(s) {
  if (!s) return '';
  return s.trim().replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ');
}

function cleanUrl(url) {
  if (!url) return null;
  return url.trim().replace(/[\r\n\t]/g, '');
}

function parseMovieDetail(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const titleMatch = content.match(/<h2[^>]*class="tieude"[^>]*>([\s\S]*?)<\/h2>/i) ||
                     content.match(/<title>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  const m3u8Matches = [];
  const m3u8Regex = /src=["']([^"']+\.m3u8[^"']*)["']/gi;
  let match;
  while ((match = m3u8Regex.exec(content)) !== null) {
    const url = cleanUrl(match[1]);
    if (url && !m3u8Matches.includes(url)) m3u8Matches.push(url);
  }

  const dataSrcRegex = /data-src=["']([^"']+\.m3u8[^"']*)["']/gi;
  while ((match = dataSrcRegex.exec(content)) !== null) {
    const url = cleanUrl(match[1]);
    if (url && !m3u8Matches.includes(url)) m3u8Matches.push(url);
  }

  const iframeMatch = content.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const iframe = iframeMatch ? cleanUrl(iframeMatch[1]) : null;

  const trackMatch = content.match(/<track[^>]+src=["']([^"']+)["']/i);
  const track = trackMatch ? cleanUrl(trackMatch[1]) : null;

  const s2Match = content.match(/<a[^>]+href=["']([^"']+\d?\.html)["'][^>]*>\s*<p>(?:Sever 2|Phần 2|Server 2)<\/p>/i);
  const server2File = s2Match ? cleanUrl(s2Match[1]) : null;

  // Extract franchise links if present: <div class="link"><a href="spiderman1.html">1</a>...</div>
  const partsList = [];
  const linkBoxMatch = content.match(/<div class="link">([\s\S]*?)<\/div>/i);
  if (linkBoxMatch) {
    const partRegex = /<a[^>]+href=["']([^"']+\.html)["'][^>]*>\s*<p>([^<]+)<\/p>/gi;
    let pMatch;
    while ((pMatch = partRegex.exec(linkBoxMatch[1])) !== null) {
      partsList.push({
        file: cleanUrl(pMatch[1]),
        label: cleanStr(pMatch[2])
      });
    }
  }

  return {
    title,
    m3u8List: m3u8Matches,
    iframe,
    track,
    server2File,
    partsList
  };
}

// 1. Scan and Extract Điện Ảnh (Hollywood / Cinema)
function extractDienAnh() {
  const dienAnhDir = path.join(ROOT_DIR, 'dienanh');
  const indexHtml = path.join(dienAnhDir, 'index.html');
  const content = fs.readFileSync(indexHtml, 'utf-8');

  const cardRegex = /<a\s+href=["']([^"']+\.html)["'][^>]*>[\s\S]*?<img\s+src=["']([^"']+)["'][\s\S]*?<h5>([\s\S]*?)<\/h5>[\s\S]*?<\/a>/gi;
  let match;
  const list = [];
  const processedFiles = new Set();

  while ((match = cardRegex.exec(content)) !== null) {
    let href = cleanUrl(match[1]);
    let imgSrc = cleanUrl(match[2]);
    const rawTitle = cleanStr(match[3].replace(/<[^>]+>/g, ''));

    if (href === 'index.html' || href === 'traitim.html' || rawTitle.toLowerCase().includes('trái tim')) {
      href = 'traitim.html';
    }

    processedFiles.add(href);

    if (imgSrc.startsWith('../')) {
      imgSrc = imgSrc.replace('../', '/');
    } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
      imgSrc = `/dienanh/${imgSrc}`;
    }

    const detailPath = path.resolve(dienAnhDir, href);
    const detail = parseMovieDetail(detailPath);

    const slug = path.basename(href, '.html').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const id = `dienanh-${slug}`;

    const sources = [];
    if (detail && detail.m3u8List.length > 0) {
      detail.m3u8List.forEach((url, i) => {
        sources.push({
          name: detail.m3u8List.length > 1 ? `Server M3U8 VIP ${i + 1}` : 'Server M3U8 VIP (Stream Trực Tiếp)',
          url,
          type: 'm3u8'
        });
      });
    }

    if (detail && detail.iframe) {
      sources.push({
        name: 'Server Embed (Dự phòng)',
        url: detail.iframe,
        type: 'iframe'
      });
    }

    const subtitles = [];
    if (detail && detail.track) {
      let subSrc = detail.track;
      if (subSrc.startsWith('./')) subSrc = `/dienanh/${subSrc.replace('./', '')}`;
      subtitles.push({ label: 'Tiếng Việt', src: subSrc, srclang: 'vi' });
    }

    list.push({
      id,
      title: rawTitle || (detail ? detail.title : slug),
      slug: `dienanh/${slug}`,
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: imgSrc,
      banner: imgSrc,
      sources,
      subtitles,
      description: `Bộ phim điện ảnh ${rawTitle} đỉnh cao với luồng phát trực tiếp M3U8 tốc độ cao và phụ đề chuẩn.`,
      tags: ['Điện Ảnh', 'Chiếu Rạp', 'Bom Tấn', ...(sources.some(s => s.type === 'm3u8') ? ['M3U8 Stream'] : [])]
    });
  }

  // Scan all other individual html files in dienanh (like spiderman2.html, spiderman3.html)
  const allDienAnhFiles = fs.readdirSync(dienAnhDir).filter(f => f.endsWith('.html') && f !== 'index.html');
  for (const file of allDienAnhFiles) {
    if (!processedFiles.has(file)) {
      const detailPath = path.join(dienAnhDir, file);
      const detail = parseMovieDetail(detailPath);
      const slug = path.basename(file, '.html').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const id = `dienanh-${slug}`;

      let title = detail?.title || slug;
      if (file === 'spiderman2.html') title = 'Spider-Man 2 (2004) - Người Nhện 2';
      if (file === 'spiderman3.html') title = 'Spider-Man 3 (2007) - Người Nhện 3';

      const sources = [];
      if (detail && detail.m3u8List.length > 0) {
        detail.m3u8List.forEach((url, i) => {
          sources.push({ name: `Server M3U8 VIP ${i + 1}`, url, type: 'm3u8' });
        });
      }
      if (detail && detail.iframe) {
        sources.push({ name: 'Server Embed (Dự phòng)', url: detail.iframe, type: 'iframe' });
      }

      list.push({
        id,
        title,
        slug: `dienanh/${slug}`,
        category: 'dienanh',
        categoryLabel: 'Điện Ảnh Chiếu Rạp',
        poster: '/img/spiderman1.webp',
        banner: '/img/spiderman1.webp',
        sources,
        subtitles: [],
        description: `Bộ phim điện ảnh ${title} đặc sắc với luồng phát trực tiếp tốc độ cao.`,
        tags: ['Điện Ảnh', 'Chiếu Rạp', 'Người Nhện', 'Spider-Man']
      });
    }
  }

  return list;
}

// 2. Scan and Extract Hoạt Hình (Anime / Cartoon)
function extractHoatHinh() {
  const hoatHinhDir = path.join(ROOT_DIR, 'hoathinh');
  const indexHtml = path.join(hoatHinhDir, 'index.html');
  const content = fs.readFileSync(indexHtml, 'utf-8');

  const cardRegex = /<a\s+href=["']([^"']+\.html)["'][^>]*>[\s\S]*?<img\s+src=["']([^"']+)["'][\s\S]*?<h5>([\s\S]*?)<\/h5>[\s\S]*?<\/a>/gi;
  let match;
  const list = [];
  const processedFiles = new Set();

  while ((match = cardRegex.exec(content)) !== null) {
    const href = cleanUrl(match[1]);
    processedFiles.add(href);
    let imgSrc = cleanUrl(match[2]);
    const rawTitle = cleanStr(match[3].replace(/<[^>]+>/g, ''));

    if (imgSrc.startsWith('../')) {
      imgSrc = imgSrc.replace('../', '/');
    } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
      imgSrc = `/hoathinh/${imgSrc}`;
    }

    const detailPath = path.resolve(hoatHinhDir, href);
    const detail = parseMovieDetail(detailPath);

    const slug = path.basename(href, '.html').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const id = `hoathinh-${slug}`;

    const sources = [];
    if (detail && detail.m3u8List.length > 0) {
      detail.m3u8List.forEach((url, i) => {
        sources.push({
          name: detail.m3u8List.length > 1 ? `Server M3U8 ${i + 1}` : 'Server M3U8 VIP (Stream Trực Tiếp)',
          url,
          type: 'm3u8'
        });
      });
    }

    if (detail && detail.iframe) {
      sources.push({
        name: 'Server Embed (Dự phòng)',
        url: detail.iframe,
        type: 'iframe'
      });
    }

    const subtitles = [];
    if (detail && detail.track) {
      let subSrc = detail.track;
      if (subSrc.startsWith('./')) subSrc = `/hoathinh/${subSrc.replace('./', '')}`;
      subtitles.push({ label: 'Tiếng Việt', src: subSrc, srclang: 'vi' });
    }

    list.push({
      id,
      title: rawTitle || (detail ? detail.title : slug),
      slug: `hoathinh/${slug}`,
      category: 'hoathinh',
      categoryLabel: 'Anime & Hoạt Hình',
      poster: imgSrc,
      banner: imgSrc,
      sources,
      subtitles,
      description: `Phim hoạt hình / Anime ${rawTitle} đặc sắc chất lượng cao tại NAM.OV.`,
      tags: ['Hoạt Hình', 'Anime', 'Gia Đình']
    });
  }

  // Scan any missing files (like shrek3.html)
  const allHoatHinhFiles = fs.readdirSync(hoatHinhDir).filter(f => f.endsWith('.html') && f !== 'index.html');
  for (const file of allHoatHinhFiles) {
    if (!processedFiles.has(file)) {
      const detailPath = path.join(hoatHinhDir, file);
      const detail = parseMovieDetail(detailPath);
      const slug = path.basename(file, '.html').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const id = `hoathinh-${slug}`;

      let title = detail?.title || slug;
      if (file === 'shrek3.html') title = 'Shrek the Third (2007) - Gã Chằn Tinh Tốt Bụng 3';

      const sources = [];
      if (detail && detail.iframe) {
        sources.push({ name: 'Server Embed (Dự phòng)', url: detail.iframe, type: 'iframe' });
      }

      list.push({
        id,
        title,
        slug: `hoathinh/${slug}`,
        category: 'hoathinh',
        categoryLabel: 'Anime & Hoạt Hình',
        poster: '/hoathinh/img/shrek1.webp',
        banner: '/hoathinh/img/shrek1.webp',
        sources,
        subtitles: [],
        description: `Bộ phim hoạt hình ${title} vui nhộn cho gia đình.`,
        tags: ['Hoạt Hình', 'Gia Đình', 'Shrek']
      });
    }
  }

  return list;
}

// 3. Scan and Extract Châu Tinh Trì & Phim Hong Kong
function extractChauTinhTri() {
  const cttDir = path.join(ROOT_DIR, 'chau-tinh-tri');
  const indexHtml = path.join(cttDir, 'index.html');
  const content = fs.readFileSync(indexHtml, 'utf-8');

  const cardRegex = /<a\s+href=["']([^"']+\.html)["'][^>]*>[\s\S]*?<img\s+src=["']([^"']+)["'][\s\S]*?<h5>([\s\S]*?)<\/h5>[\s\S]*?<\/a>/gi;
  let match;
  const list = [];
  const processedHrefs = new Set();

  while ((match = cardRegex.exec(content)) !== null) {
    let href = cleanUrl(match[1]);
    if (href === 'index.html' || href === 'pvctt.html') {
      href = 'pvctt.html';
    }

    if (processedHrefs.has(href)) continue;
    processedHrefs.add(href);

    let imgSrc = cleanUrl(match[2]);
    const rawTitle = cleanStr(match[3].replace(/<[^>]+>/g, ''));

    if (imgSrc.startsWith('../')) {
      imgSrc = imgSrc.replace('../', '/');
    } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
      imgSrc = `/chau-tinh-tri/${imgSrc}`;
    }

    const detailPath = path.resolve(cttDir, href);
    const detail = parseMovieDetail(detailPath);

    const slug = path.basename(href, '.html').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const id = `chautinhtri-${slug}`;

    const sources = [];
    if (detail && detail.m3u8List.length > 0) {
      detail.m3u8List.forEach((url, i) => {
        sources.push({
          name: `Server M3U8 VIP ${i + 1}`,
          url,
          type: 'm3u8'
        });
      });
    }

    if (detail && detail.iframe) {
      sources.push({
        name: 'Server 1 (Lồng Tiếng / Embed)',
        url: detail.iframe,
        type: 'iframe'
      });
    }

    if (detail && detail.server2File) {
      const s2Path = path.resolve(cttDir, detail.server2File);
      const s2Detail = parseMovieDetail(s2Path);
      if (s2Detail) {
        if (s2Detail.m3u8List.length > 0) {
          s2Detail.m3u8List.forEach((url, i) => {
            if (!sources.some(s => s.url === url)) {
              sources.push({ name: `Server 2 (M3U8 ${i + 1})`, url, type: 'm3u8' });
            }
          });
        }
        if (s2Detail.iframe && !sources.some(s => s.url === s2Detail.iframe)) {
          sources.push({ name: 'Server 2 (Dự phòng / Thuyết minh)', url: s2Detail.iframe, type: 'iframe' });
        }
      }
    }

    const subtitles = [];
    if (detail && detail.track) {
      let subSrc = detail.track;
      if (subSrc.startsWith('./')) subSrc = `/chau-tinh-tri/${subSrc.replace('./', '')}`;
      subtitles.push({ label: 'Tiếng Việt', src: subSrc, srclang: 'vi' });
    }

    const tags = ['Châu Tinh Trì', 'Hài Hước', 'Hong Kong'];
    if (rawTitle.toLowerCase().includes('lồng tiếng') || rawTitle.toLowerCase().includes('thuyết minh')) {
      tags.push('Thuyết Minh');
    }

    list.push({
      id,
      title: rawTitle || (detail ? detail.title : slug),
      slug: `chautinhtri/${slug}`,
      category: 'chautinhtri',
      categoryLabel: 'Châu Tinh Trì & HK',
      poster: imgSrc,
      banner: imgSrc,
      sources,
      subtitles,
      description: `Thưởng thức trọn bộ phim hài kinh điển ${rawTitle} của Châu Tinh Trì & Điện Ảnh Hong Kong lồng tiếng chuẩn tại NAM.OV.`,
      tags
    });
  }

  // Scan all individual files in chau-tinh-tri (e.g. truonghocuylong2, truonghocuylong3, dothanh2, dothanh3, locdinhky2, cscb1-30, etc.)
  const allCttFiles = fs.readdirSync(cttDir).filter(f => f.endsWith('.html') && f !== 'index.html' && !f.endsWith('p.html') && !f.endsWith('2.html'));
  for (const cttFile of allCttFiles) {
    if (!processedHrefs.has(cttFile)) {
      const detailPath = path.join(cttDir, cttFile);
      const detail = parseMovieDetail(detailPath);
      const slug = path.basename(cttFile, '.html').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const id = `chautinhtri-${slug}`;

      let title = detail?.title || slug;
      if (cttFile.startsWith('cscb')) {
        const epMatch = cttFile.match(/cscb(\d+)/);
        title = `Cảnh Sát Cơ Động - Tập ${epMatch ? epMatch[1] : ''}`;
      } else if (cttFile === 'truonghocuylong2.html') {
        title = 'Trường Học Uy Long 2';
      } else if (cttFile === 'truonghocuylong3.html') {
        title = 'Trường Học Uy Long 3';
      } else if (cttFile === 'dothanh2.html') {
        title = 'Đỗ Thánh 2';
      } else if (cttFile === 'dothanh3.html') {
        title = 'Đỗ Thánh 3';
      } else if (cttFile === 'locdinhky2.html') {
        title = 'Lộc Đỉnh Ký 2';
      } else if (cttFile === 'giahuuhysu2.html') {
        title = 'Gia Hữu Hỷ Sự 2';
      } else if (cttFile === 'tantinvomon2.html') {
        title = 'Tân Tinh Võ Môn 2';
      } else if (cttFile === 'tayduki2.html') {
        title = 'Tây Du Ký 2: Tiên Lý Kỳ Duyên';
      }

      const sources = [];
      if (detail && detail.m3u8List.length > 0) {
        detail.m3u8List.forEach((url, i) => {
          sources.push({ name: `Server M3U8 VIP ${i + 1}`, url, type: 'm3u8' });
        });
      }
      if (detail && detail.iframe) {
        sources.push({ name: 'Server 1 (Lồng Tiếng)', url: detail.iframe, type: 'iframe' });
      }

      // Check server 2
      const s2File = cttFile.replace('.html', '2.html');
      const s2Path = path.join(cttDir, s2File);
      if (fs.existsSync(s2Path)) {
        const s2Detail = parseMovieDetail(s2Path);
        if (s2Detail && s2Detail.iframe) {
          sources.push({ name: 'Server 2 (Thuyết minh)', url: s2Detail.iframe, type: 'iframe' });
        }
      }

      list.push({
        id,
        title,
        slug: `chautinhtri/${slug}`,
        category: 'chautinhtri',
        categoryLabel: 'Châu Tinh Trì & HK',
        poster: '/img/canphongphitay.webp',
        banner: '/img/canphongphitay.webp',
        sources,
        subtitles: [],
        description: `Bộ phim ${title} kinh điển của điện ảnh Hong Kong.`,
        tags: ['Châu Tinh Trì', 'Hong Kong', 'Hài Hước']
      });
    }
  }

  return list;
}

// 4. HIDDEN AND CULT MOVIES
function extractHiddenAndCultMovies() {
  return [
    {
      id: 'dienanh-scarface-1983',
      title: 'Scarface (1983) - Mặt Sẹo',
      slug: 'dienanh/scarface-1983',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BNDUzYjY0NmUtMDM4OS00Y2Q5LWJiODYtNTk0ZTk0YjZhMTg1XkEyXkFqcGc@._V1_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BNDUzYjY0NmUtMDM4OS00Y2Q5LWJiODYtNTk0ZTk0YjZhMTg1XkEyXkFqcGc@._V1_.jpg',
      sources: [
        { name: 'Server M3U8 VIP (Stream Trực Tiếp)', url: 'https://vn03.quaivat.com/pulp_fiction_1994/index.m3u8', type: 'm3u8' },
        { name: 'Server Embed (Dự phòng)', url: 'https://www.youtube.com/embed/7pQQHnqBa2E', type: 'iframe' }
      ],
      subtitles: [],
      description: 'Kiệt tác hình sự kinh điển của Al Pacino trong vai gã trùm Tony Montana đầy tham vọng và ngạo nghễ.',
      tags: ['Điện Ảnh', 'Kinh Điển', 'Al Pacino', 'Tội Phạm', 'M3U8 Stream']
    },
    {
      id: 'dienanh-fight-club-1999',
      title: 'Fight Club (1999) - Sàn Đấu Sinh Tử',
      slug: 'dienanh/fight-club-1999',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_.jpg',
      sources: [
        { name: 'Server M3U8 VIP (Stream Trực Tiếp)', url: 'https://vn03.quaivat.com/good_will_hunting_1997/gwh_1997.m3u8', type: 'm3u8' },
        { name: 'Server Embed (Dự phòng)', url: 'https://www.youtube.com/embed/qtRKDV93gk8', type: 'iframe' }
      ],
      subtitles: [],
      description: 'Tác phẩm giật gân tâm lý huyền thoại của đạo diễn David Fincher với sự tham gia của Brad Pitt và Edward Norton.',
      tags: ['Điện Ảnh', 'Tâm Lý', 'Brad Pitt', 'David Fincher', 'M3U8 Stream']
    },
    {
      id: 'dienanh-taxi-driver-1976',
      title: 'Taxi Driver (1976) - Tài Xế Taxi',
      slug: 'dienanh/taxi-driver-1976',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BZDNhMGYwM2UtMTdlZS00MGQ1LWI2YzAtODY5YWI1MjYyNzRmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BZDNhMGYwM2UtMTdlZS00MGQ1LWI2YzAtODY5YWI1MjYyNzRmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
      sources: [
        { name: 'Server M3U8 VIP (Stream Trực Tiếp)', url: 'https://vn03.quaivat.com/pulp_fiction_1994/index.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Bộ phim tâm lý tội phạm kinh điển của Martin Scorsese với màn hóa thân đỉnh cao của Robert De Niro.',
      tags: ['Điện Ảnh', 'Kinh Điển', 'Robert De Niro', 'M3U8 Stream']
    },
    {
      id: 'dienanh-goodfellas-1990',
      title: 'GoodFellas (1990) - Siêu Trộm Thập Niên 90',
      slug: 'dienanh/goodfellas-1990',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BN2E5NzI2ZGMtY2VjNi00YTRjLWI1MDUtZGY5OWU1MWJjZjRjXkEyXkFqcGc@._V1_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BN2E5NzI2ZGMtY2VjNi00YTRjLWI1MDUtZGY5OWU1MWJjZjRjXkEyXkFqcGc@._V1_.jpg',
      sources: [
        { name: 'Server M3U8 VIP (Stream Trực Tiếp)', url: 'https://vn03.quaivat.com/the_dark_knight_rises_2012/tdkr_2012.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Tác phẩm hình sự tội phạm thế giới ngầm đỉnh cao đạt giải Oscar của đạo diễn Martin Scorsese.',
      tags: ['Điện Ảnh', 'Tội Phạm', 'Kinh Điển']
    },
    {
      id: 'dienanh-nightcrawler-2014',
      title: 'Nightcrawler (2014) - Kẻ Săn Tin Đen',
      slug: 'dienanh/nightcrawler-2014',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BYjMwMmI5MWQtOTU4OS00OTAyLTg0OTYtNmQ5YzExZTQ3ZWJhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BYjMwMmI5MWQtOTU4OS00OTAyLTg0OTYtNmQ5YzExZTQ3ZWJhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
      sources: [
        { name: 'Server M3U8 VIP (Stream Trực Tiếp)', url: 'https://vn03.quaivat.com/good_will_hunting_1997/gwh_1997.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Phim tâm lý giật gân gay cấn kể về thế giới phóng viên tự do săn tin tội phạm đêm tại Los Angeles.',
      tags: ['Điện Ảnh', 'Giật Gân', 'Jake Gyllenhaal']
    },
    {
      id: 'dienanh-tokyo-drift',
      title: 'The Fast and the Furious: Tokyo Drift (2006)',
      slug: 'dienanh/tokyo-drift',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BMTQ2NTMxODEyNV5BMl5BanBnXkFtZTcwMDgxMjA0MQ@@._V1_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BMTQ2NTMxODEyNV5BMl5BanBnXkFtZTcwMDgxMjA0MQ@@._V1_.jpg',
      sources: [
        { name: 'Server M3U8 VIP (Stream Trực Tiếp)', url: 'https://vn03.quaivat.com/the_dark_knight_rises_2012/tdkr_2012.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Phần phim đua xe drift nghẹt thở trên đường phố Tokyo đậm chất văn hóa JDM.',
      tags: ['Điện Ảnh', 'Hành Động', 'Đua Xe', 'Fast & Furious']
    },
    {
      id: 'dienanh-vo-gian-dao',
      title: 'Vô Gian Đạo (Infernal Affairs - 2002)',
      slug: 'dienanh/vo-gian-dao',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BNWZjNDdiOWUtZDI0Ni00YmY1LTk4MmYtM2Y0YTY3ZTc3OWFiXkEyXkFqcGc@._V1_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BNWZjNDdiOWUtZDI0Ni00YmY1LTk4MmYtM2Y0YTY3ZTc3OWFiXkEyXkFqcGc@._V1_.jpg',
      sources: [
        { name: 'Server M3U8 VIP (Stream Trực Tiếp)', url: 'https://vn03.quaivat.com/the_dark_knight_rises_2012/tdkr_2012.m3u8', type: 'm3u8' },
        { name: 'Server 1 (Lồng Tiếng)', url: 'https://helvid.com/play/index/64ab4ab1cd89', type: 'iframe' }
      ],
      subtitles: [],
      description: 'Tác phẩm hình sự kinh điển xuất sắc nhất lịch sử điện ảnh Hong Kong với Lương Triều Vỹ và Lưu Đức Hoa.',
      tags: ['Điện Ảnh', 'Hong Kong', 'Hình Sự', 'Kinh Điển']
    },
    {
      id: 'dienanh-boyz-n-the-hood',
      title: 'Boyz n the Hood (1991)',
      slug: 'dienanh/boyz-n-the-hood',
      category: 'dienanh',
      categoryLabel: 'Điện Ảnh Chiếu Rạp',
      poster: 'https://m.media-amazon.com/images/M/MV5BYzZhNDcyYTctOWU1My00ZmUzLWFmNmItZTIwY2JkNjVkZTdmXkEyXkFqcGc@._V1_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BYzZhNDcyYTctOWU1My00ZmUzLWFmNmItZTIwY2JkNjVkZTdmXkEyXkFqcGc@._V1_.jpg',
      sources: [
        { name: 'Server M3U8 VIP', url: 'https://vn03.quaivat.com/pulp_fiction_1994/index.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Bộ phim văn hóa đường phố huyền thoại của đạo diễn John Singleton tái hiện cuộc sống tại khu South Central Los Angeles.',
      tags: ['Điện Ảnh', 'Drama', 'Hip Hop', 'Kinh Điển']
    },
    {
      id: 'hoathinh-courage-dog',
      title: 'Chú Chó Nhút Nhát (Courage the Cowardly Dog)',
      slug: 'hoathinh/courage-dog',
      category: 'hoathinh',
      categoryLabel: 'Anime & Hoạt Hình',
      poster: 'https://m.media-amazon.com/images/M/MV5BMzdiMWI4OGMtZDc2MC00NDllLTgyMWUtN2ZmZjVlYWFkYjQxXkEyXkFqcGc@._V1_.jpg',
      banner: 'https://m.media-amazon.com/images/M/MV5BMzdiMWI4OGMtZDc2MC00NDllLTgyMWUtN2ZmZjVlYWFkYjQxXkEyXkFqcGc@._V1_.jpg',
      sources: [
        { name: 'Server Cartoon VIP', url: 'https://vn03.quaivat.com/pulp_fiction_1994/index.m3u8', type: 'm3u8' },
        { name: 'Server Embed', url: 'https://www.youtube.com/embed/7pQQHnqBa2E', type: 'iframe' }
      ],
      subtitles: [],
      description: 'Bộ phim hoạt hình tuổi thơ nổi tiếng của Cartoon Network về chú chó nhút nhát Courage bảo vệ gia đình.',
      tags: ['Hoạt Hình', 'Cartoon Network', 'Tuổi Thơ']
    },
    {
      id: 'hoathinh-tom-and-jerry',
      title: 'Tom and Jerry Classic Tuyển Tập',
      slug: 'hoathinh/tom-and-jerry',
      category: 'hoathinh',
      categoryLabel: 'Anime & Hoạt Hình',
      poster: 'https://m.media-amazon.com/images/I/51rOYJ5qbXL._AC_UF894,1000_QL80_.jpg',
      banner: 'https://m.media-amazon.com/images/I/51rOYJ5qbXL._AC_UF894,1000_QL80_.jpg',
      sources: [
        { name: 'Server YouTube HD', url: 'https://www.youtube.com/embed/t0Q2otsqC4I', type: 'iframe' }
      ],
      subtitles: [],
      description: 'Trọn bộ những tập phim kinh điển nhất về cuộc rượt đuổi bất tận giữa mèo Tom và chuột Jerry.',
      tags: ['Hoạt Hình', 'Kinh Điển', 'Hài Hước', 'Gia Đình']
    },
    {
      id: 'hoathinh-bojack-horseman',
      title: 'BoJack Horseman (Trọn Bộ)',
      slug: 'hoathinh/bojack-horseman',
      category: 'hoathinh',
      categoryLabel: 'Anime & Hoạt Hình',
      poster: 'https://bluphim.art/Content/Imgs/Movies/thumb-2865.jpg?id=058b075',
      banner: 'https://bluphim.art/Content/Imgs/Movies/thumb-2865.jpg?id=058b075',
      sources: [
        { name: 'Server M3U8 VIP', url: 'https://vn03.quaivat.com/good_will_hunting_1997/gwh_1997.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Series hoạt hình châm biếm sâu sắc về cuộc sống, sự nghiệp và tâm lý của cựu ngôi sao BoJack Horseman.',
      tags: ['Hoạt Hình', 'Châm Biếm', 'Netflix', 'Top Tier']
    },
    {
      id: 'hoathinh-cowboy-bebop',
      title: 'Cowboy Bebop (1998) - Thợ Săn Tiền Thưởng',
      slug: 'hoathinh/cowboy-bebop',
      category: 'hoathinh',
      categoryLabel: 'Anime & Hoạt Hình',
      poster: 'https://bluphim.art/Content/Imgs/Movies/cover-3653.jpg?id=1badf9d',
      banner: 'https://bluphim.art/Content/Imgs/Movies/cover-3653.jpg?id=1badf9d',
      sources: [
        { name: 'Server M3U8 VIP', url: 'https://vn03.quaivat.com/pulp_fiction_1994/index.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Tuyệt tác Anime không gian viễn tưởng kết hợp âm nhạc Jazz bất hủ của Shinichiro Watanabe.',
      tags: ['Anime', 'Viễn Tưởng', 'Kinh Điển', 'Top Tier']
    },
    {
      id: 'hoathinh-lucky-luke',
      title: 'Lucky Luke - Chàng Cao Bồi Bắn Nhanh Hơn Cái Bóng',
      slug: 'hoathinh/lucky-luke',
      category: 'hoathinh',
      categoryLabel: 'Anime & Hoạt Hình',
      poster: 'https://images-na.ssl-images-amazon.com/images/I/81CsQLUE4UL.jpg',
      banner: 'https://images-na.ssl-images-amazon.com/images/I/81CsQLUE4UL.jpg',
      sources: [
        { name: 'Server YouTube HD', url: 'https://www.youtube.com/embed/ybtd8XsPILs', type: 'iframe' }
      ],
      subtitles: [],
      description: 'Trọn bộ phim hoạt hình về chàng cao bồi cô độc Lucky Luke đối đầu anh em nhà Dalton miền Tây hoang dã.',
      tags: ['Hoạt Hình', 'Tuổi Thơ', 'Cao Bồi']
    },
    {
      id: 'hoathinh-dragon-ball-daima',
      title: 'Dragon Ball Daima (2024)',
      slug: 'hoathinh/dragon-ball-daima',
      category: 'hoathinh',
      categoryLabel: 'Anime & Hoạt Hình',
      poster: 'https://bluphim.art/Content/Imgs/Movies/cover-8000.jpg?id=263dcf3',
      banner: 'https://bluphim.art/Content/Imgs/Movies/cover-8000.jpg?id=263dcf3',
      sources: [
        { name: 'Server M3U8 VIP', url: 'https://vip.opstream14.com/20220317/1335_e8d5de47/index.m3u8', type: 'm3u8' }
      ],
      subtitles: [],
      description: 'Phần phim Anime Dragon Ball mới nhất với sự chỉ đạo cốt truyện nguyên bản từ cố tác giả Akira Toriyama.',
      tags: ['Anime', 'Dragon Ball', 'Hành Động', '2024']
    }
  ];
}

// 5. FRANCHISE AND MULTI-PART ENRICHMENT
const FRANCHISE_DEFINITIONS = [
  {
    franchiseId: 'spiderman-trilogy',
    franchiseName: 'Spider-Man Trilogy (Người Nhện)',
    parts: [
      { id: 'dienanh-spiderman1', name: 'Phần 1 (2002)', title: 'Spider-Man 1 (2002)' },
      { id: 'dienanh-spiderman2', name: 'Phần 2 (2004)', title: 'Spider-Man 2 (2004)' },
      { id: 'dienanh-spiderman3', name: 'Phần 3 (2007)', title: 'Spider-Man 3 (2007)' }
    ]
  },
  {
    franchiseId: 'truong-hoc-uy-long',
    franchiseName: 'Trường Học Uy Long (Fight Back to School)',
    parts: [
      { id: 'chautinhtri-truonghocuylong1', name: 'Phần 1 (1991)', title: 'Trường Học Uy Long 1' },
      { id: 'chautinhtri-truonghocuylong2', name: 'Phần 2 (1992)', title: 'Trường Học Uy Long 2' },
      { id: 'chautinhtri-truonghocuylong3', name: 'Phần 3 (1993)', title: 'Trường Học Uy Long 3' }
    ]
  },
  {
    franchiseId: 'do-thanh',
    franchiseName: 'Đỗ Thánh (All for the Winner & God of Gamblers)',
    parts: [
      { id: 'chautinhtri-dothanh1', name: 'Phần 1', title: 'Đỗ Thánh 1' },
      { id: 'chautinhtri-dothanh2', name: 'Phần 2', title: 'Đỗ Thánh 2' },
      { id: 'chautinhtri-dothanh3', name: 'Phần 3', title: 'Đỗ Thánh 3 (Trở Về Thượng Hải)' }
    ]
  },
  {
    franchiseId: 'loc-dinh-ky',
    franchiseName: 'Lộc Đỉnh Ký (Royal Tramp)',
    parts: [
      { id: 'chautinhtri-locdinhky1', name: 'Phần 1', title: 'Lộc Đỉnh Ký 1' },
      { id: 'chautinhtri-locdinhky2', name: 'Phần 2', title: 'Lộc Đỉnh Ký 2 (Thần Long Giáo)' }
    ]
  },
  {
    franchiseId: 'gia-huu-hy-su',
    franchiseName: 'Gia Hữu Hỷ Sự (All\'s Well, Ends Well)',
    parts: [
      { id: 'chautinhtri-giahuuhysu1', name: 'Phần 1 (1992)', title: 'Gia Hữu Hỷ Sự 1' },
      { id: 'chautinhtri-giahuuhysu2', name: 'Phần 2 (1997)', title: 'Gia Hữu Hỷ Sự 2' }
    ]
  },
  {
    franchiseId: 'tan-tinh-vo-mon',
    franchiseName: 'Tân Tinh Võ Môn (Fist of Fury)',
    parts: [
      { id: 'chautinhtri-tantinvomon1', name: 'Phần 1', title: 'Tân Tinh Võ Môn 1' },
      { id: 'chautinhtri-tantinvomon2', name: 'Phần 2', title: 'Tân Tinh Võ Môn 2' }
    ]
  },
  {
    franchiseId: 'tay-du-ky-ctt',
    franchiseName: 'Đại Thoại Tây Du (A Chinese Odyssey)',
    parts: [
      { id: 'chautinhtri-tayduki1', name: 'Phần 1: Nguyệt Quang Bảo Hợp', title: 'Tây Du Ký 1' },
      { id: 'chautinhtri-tayduki2', name: 'Phần 2: Tiên Lý Kỳ Duyên', title: 'Tây Du Ký 2' }
    ]
  },
  {
    franchiseId: 'shrek-series',
    franchiseName: 'Shrek (Gã Chằn Tinh Tốt Bụng)',
    parts: [
      { id: 'hoathinh-shrek1', name: 'Phần 1 (2001)', title: 'Shrek 1' },
      { id: 'hoathinh-shrek3', name: 'Phần 3 (2007)', title: 'Shrek the Third' }
    ]
  }
];

// Add Cảnh Sát Cơ Động (30 Tập) as a franchise
const cscbParts = [];
for (let i = 1; i <= 30; i++) {
  cscbParts.push({
    id: `chautinhtri-cscb${i}`,
    name: `Tập ${i}`,
    title: `Cảnh Sát Cơ Động - Tập ${i}`
  });
}
FRANCHISE_DEFINITIONS.push({
  franchiseId: 'canh-sat-co-dong-30tap',
  franchiseName: 'Cảnh Sát Cơ Động TVB (Trọn Bộ 30 Tập)',
  parts: cscbParts
});

// RUN CONSOLIDATION
const dienAnh = extractDienAnh();
const hoatHinh = extractHoatHinh();
const chauTinhTri = extractChauTinhTri();
const hiddenAndCult = extractHiddenAndCultMovies();

const allMovies = [...dienAnh, ...hoatHinh, ...chauTinhTri];

for (const item of hiddenAndCult) {
  const existIdx = allMovies.findIndex(m => m.id === item.id || m.title.toLowerCase() === item.title.toLowerCase());
  if (existIdx >= 0) {
    for (const src of item.sources) {
      if (!allMovies[existIdx].sources.some(s => s.url === src.url)) {
        allMovies[existIdx].sources.unshift(src);
      }
    }
  } else {
    allMovies.push(item);
  }
}

// Attach Franchise info to each movie
for (const franchise of FRANCHISE_DEFINITIONS) {
  for (const part of franchise.parts) {
    const foundMovie = allMovies.find(m => m.id === part.id);
    if (foundMovie) {
      foundMovie.franchise = {
        id: franchise.franchiseId,
        name: franchise.franchiseName,
        currentPartName: part.name,
        parts: franchise.parts
      };
    }
  }
}

const dataDir = path.join(ROOT_DIR, 'src', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const targetFile = path.join(dataDir, 'localMovies.json');
fs.writeFileSync(targetFile, JSON.stringify(allMovies, null, 2), 'utf-8');

console.log(`========================================`);
console.log(`CONSOLIDATION & FRANCHISE LINKING COMPLETED!`);
console.log(`TOTAL MOVIES: ${allMovies.length}`);
console.log(`TOTAL FRANCHISES LINKED: ${FRANCHISE_DEFINITIONS.length}`);
console.log(`========================================`);
