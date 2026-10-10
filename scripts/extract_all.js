import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

function cleanUrl(url) {
  if (!url) return null;
  return url.trim().replace(/[\r\n\t]/g, '');
}

function parseMovieDetail(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract Title
  const titleMatch = content.match(/<h2[^>]*class="tieude"[^>]*>([\s\S]*?)<\/h2>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract M3U8 source
  const m3u8Matches = [];
  const m3u8Regex = /src=["']([^"']+\.m3u8[^"']*)["']/gi;
  let match;
  while ((match = m3u8Regex.exec(content)) !== null) {
    m3u8Matches.push(cleanUrl(match[1]));
  }

  // Extract iframe
  const iframeMatch = content.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const iframe = iframeMatch ? cleanUrl(iframeMatch[1]) : null;

  // Extract subtitles / track
  const trackMatch = content.match(/<track[^>]+src=["']([^"']+)["']/i);
  const track = trackMatch ? cleanUrl(trackMatch[1]) : null;

  // Check server 2 link if any
  const s2Match = content.match(/<a[^>]+href=["']([^"']+\d?\.html)["'][^>]*>\s*<p>(?:Sever 2|Phần 2)<\/p>/i);
  const server2File = s2Match ? cleanUrl(s2Match[1]) : null;

  return {
    title,
    m3u8: m3u8Matches.length > 0 ? m3u8Matches[0] : null,
    iframe,
    track,
    server2File
  };
}

function extractFromCategoryIndex(indexHtmlPath, defaultCategory, categoryLabel) {
  if (!fs.existsSync(indexHtmlPath)) return [];
  const content = fs.readFileSync(indexHtmlPath, 'utf-8');
  const baseDir = path.dirname(indexHtmlPath);

  const movies = [];
  const cardRegex = /<a\s+href=["']([^"']+\.html)["'][^>]*>[\s\S]*?<img\s+src=["']([^"']+)["'][\s\S]*?<h5>([\s\S]*?)<\/h5>[\s\S]*?<\/a>/gi;
  
  let match;
  let count = 0;
  while ((match = cardRegex.exec(content)) !== null) {
    const href = match[1].trim();
    let imgSrc = match[2].trim();
    const rawTitle = match[3].replace(/<[^>]+>/g, '').trim();

    // Normalize image src
    if (imgSrc.startsWith('../')) {
      imgSrc = imgSrc.replace('../', '/');
    } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
      const relFolder = path.relative(ROOT_DIR, baseDir).replace(/\\/g, '/');
      imgSrc = `/${relFolder}/${imgSrc}`;
    }

    const detailFilePath = path.resolve(baseDir, href);
    const detail = parseMovieDetail(detailFilePath);

    const cleanBaseName = path.basename(href, '.html');
    const slug = cleanBaseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const id = `${defaultCategory}-${slug || count++}`;

    const sources = [];
    if (detail && detail.m3u8) {
      sources.push({ name: 'Server M3U8 (VIP Stream)', url: detail.m3u8, type: 'm3u8' });
    }
    if (detail && detail.iframe) {
      sources.push({ name: 'Server Embed (Helvid/Dự phòng)', url: detail.iframe, type: 'iframe' });
    }

    // Check if there is a server 2
    if (detail && detail.server2File) {
      const s2Path = path.resolve(baseDir, detail.server2File);
      const s2Detail = parseMovieDetail(s2Path);
      if (s2Detail) {
        if (s2Detail.m3u8 && s2Detail.m3u8 !== detail.m3u8) {
          sources.push({ name: 'Server 2 (M3U8)', url: s2Detail.m3u8, type: 'm3u8' });
        }
        if (s2Detail.iframe && s2Detail.iframe !== detail.iframe) {
          sources.push({ name: 'Server 2 (Embed)', url: s2Detail.iframe, type: 'iframe' });
        }
      }
    }

    // Subtitles
    const subtitles = [];
    if (detail && detail.track) {
      let subSrc = detail.track;
      if (subSrc.startsWith('./')) {
        const relFolder = path.relative(ROOT_DIR, baseDir).replace(/\\/g, '/');
        subSrc = `/${relFolder}/${subSrc.replace('./', '')}`;
      }
      subtitles.push({ label: 'Tiếng Việt', src: subSrc, srclang: 'vi' });
    }

    const tags = [categoryLabel];
    if (rawTitle.toLowerCase().includes('lồng tiếng') || rawTitle.toLowerCase().includes('thuyết minh')) {
      tags.push('Thuyết Minh');
    }

    movies.push({
      id,
      title: rawTitle || (detail ? detail.title : cleanBaseName),
      slug: `${defaultCategory}/${slug}`,
      category: defaultCategory,
      categoryLabel,
      poster: imgSrc,
      banner: imgSrc,
      sources,
      subtitles,
      description: `Thưởng thức trọn bộ phim ${rawTitle} chất lượng cao, phụ đề & lồng tiếng chuẩn tại NAM.OV.`,
      tags
    });
  }

  return movies;
}

// 1. Scan Chau Tinh Tri
const cttMovies = extractFromCategoryIndex(
  path.join(ROOT_DIR, 'chau-tinh-tri', 'index.html'),
  'chautinhtri',
  'Châu Tinh Trì & HK'
);

// 2. Scan Dien Anh
const dienanhMovies = extractFromCategoryIndex(
  path.join(ROOT_DIR, 'dienanh', 'index.html'),
  'dienanh',
  'Điện Ảnh Chiếu Rạp'
);

// 3. Scan Hoat Hinh
const hoathinhMovies = extractFromCategoryIndex(
  path.join(ROOT_DIR, 'hoathinh', 'index.html'),
  'hoathinh',
  'Anime & Hoạt Hình'
);

const allMovies = [...cttMovies, ...dienanhMovies, ...hoathinhMovies];

// Ensure src/data directory exists
const dataDir = path.join(ROOT_DIR, 'src', 'data');
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, 'localMovies.json'),
  JSON.stringify(allMovies, null, 2),
  'utf-8'
);

console.log(`Successfully extracted and cleaned ${allMovies.length} movies!`);
