import fs from 'fs';
import path from 'path';

function extractFromHtml(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const titleMatch = content.match(/<h2 class="tieude">([^<]+)<\/h2>/i) || 
                       content.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.html');
    
    // M3U8 source
    const m3u8Match = content.match(/<source[^>]+src="([^"]+\.m3u8)"/i) || 
                      content.match(/data-src="([^"]+\.m3u8)"/i) ||
                      content.match(/src="([^"]+\.m3u8)"/i);
    
    // Iframe source
    const iframeMatch = content.match(/<iframe[^>]+src="([^"]+)"/i);

    // Track / Subtitle
    const trackMatch = content.match(/<track[^>]+src="([^"]+)"/i);

    return {
      title,
      m3u8: m3u8Match ? m3u8Match[1] : null,
      iframe: iframeMatch ? iframeMatch[1] : null,
      track: trackMatch ? trackMatch[1] : null
    };
  } catch (err) {
    return null;
  }
}

console.log('Script template ready');
