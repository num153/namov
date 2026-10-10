import { supabase } from '../lib/supabase';
import localMoviesData from '../data/localMovies.json';

// In-memory movie list (starts with localMoviesData, updates when Supabase responds)
let activeMovies = [...localMoviesData];
let hasSyncedWithSupabase = false;

// Subscribers for real-time state updates if needed
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(cb => {
    try { cb(activeMovies); } catch (e) {}
  });
}

// Background fetch from Supabase
async function initSupabaseSync() {
  if (hasSyncedWithSupabase) return;
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('releaseYear', { ascending: false, nullsFirst: false });

    if (!error && data && data.length > 0) {
      activeMovies = data;
      hasSyncedWithSupabase = true;
      notifyListeners();
    }
  } catch (err) {
    console.warn('⚠️ Supabase offline, using local dataset fallback:', err);
  }
}

// Start sync in background
initSupabaseSync();

export const movieService = {
  // Lấy toàn bộ danh sách phim (tự động cập nhật nếu có Supabase)
  getLocalMovies() {
    return activeMovies;
  },

  // Đăng ký lắng nghe khi dữ liệu từ Cloud cập nhật
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  // Tìm phim theo ID (đồng bộ từ memory)
  getMovieById(id) {
    if (!id) return null;
    return activeMovies.find(m => String(m.id) === String(id)) || null;
  },

  // Tìm phim theo ID có truy vấn Supabase dự phòng (bất đồng bộ)
  async getMovieByIdAsync(id) {
    if (!id) return null;
    const found = activeMovies.find(m => String(m.id) === String(id));
    if (found) return found;

    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', String(id))
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {}

    return localMoviesData.find(m => String(m.id) === String(id)) || null;
  },

  // Tìm kiếm và lọc phim
  searchMovies({ query = '', category = 'all', isM3U8Only = false, onlyM3U8 = false, genre = '' } = {}) {
    let list = [...activeMovies];

    if (category && category !== 'all') {
      if (category === 'chautinhtri') {
        list = list.filter(m => m.category === 'chautinhtri' || m.category === 'hongkong');
      } else {
        list = list.filter(m => m.category === category);
      }
    }

    const useM3U8 = isM3U8Only || onlyM3U8;
    if (useM3U8) {
      list = list.filter(m => {
        const s = m.streams || m.sources || [];
        return s.some(x => x.type === 'm3u8');
      });
    }

    if (genre) {
      const gLower = genre.toLowerCase();
      list = list.filter(m => Array.isArray(m.genres) && m.genres.some(g => g.toLowerCase().includes(gLower)));
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (Array.isArray(m.genres) && m.genres.some(g => g.toLowerCase().includes(q))) ||
        // Also match franchise name
        (m.franchise && m.franchise.name && m.franchise.name.toLowerCase().includes(q))
      );
    }

    // ─── FRANCHISE DEDUPLICATION ───────────────────────────────────────────
    // For any franchise, only show ONE card = the movie whose id equals parts[0].id
    // All other parts get hidden from the grid.
    const seenFranchises = new Set();
    list = list.filter(m => {
      if (!m.franchise || !m.franchise.id || !m.franchise.parts || m.franchise.parts.length <= 1) {
        return true; // Not part of a multi-part series → always show
      }
      const fId = m.franchise.id;
      const firstPartId = m.franchise.parts[0]?.id;
      if (!seenFranchises.has(fId)) {
        // Only let through the movie that IS the first part
        if (String(m.id) === String(firstPartId)) {
          seenFranchises.add(fId);
          return true;
        }
        // Check if firstPart is in our filtered list at all
        const firstInList = list.find(x => String(x.id) === String(firstPartId));
        if (!firstInList) {
          // First part filtered out, show this one instead
          seenFranchises.add(fId);
          return true;
        }
        return false;
      }
      return false; // Already showing a card for this franchise
    });
    // ───────────────────────────────────────────────────────────────────────

    return list;
  },

  // Cập nhật thông tin/link m3u8 trực tiếp lên Supabase
  async updateMovie(id, updates) {
    try {
      const { data, error } = await supabase
        .from('movies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', String(id))
        .select();

      if (error) throw error;

      // Update in-memory
      const index = activeMovies.findIndex(m => String(m.id) === String(id));
      if (index !== -1 && data && data[0]) {
        activeMovies[index] = data[0];
        notifyListeners();
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error updating movie in Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  // Tích hợp API phim ngoài (OPhim) nếu người dùng muốn khám phá thêm
  async fetchExternalMovies(page = 1) {
    try {
      const res = await fetch(`https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${page}`);
      if (!res.ok) throw new Error('API Network error');
      const data = await res.json();
      
      if (!data?.items) return [];

      return data.items.map(item => ({
        id: `ophim-${item.slug}`,
        title: item.name,
        category: 'online-api',
        poster: `https://img.ophim.live/uploads/movies/${item.poster_url || item.thumb_url}`,
        banner: `https://img.ophim.live/uploads/movies/${item.poster_url || item.thumb_url}`,
        description: `Phim mới cập nhật từ OPhim: ${item.origin_name || item.name} (${item.year || '2024'}).`,
        duration: item.time || '100 phút',
        releaseYear: item.year || 2024,
        rating: 8.5,
        genres: ['Phim Mới', 'Online API'],
        isExternal: true,
        slug: item.slug,
        streams: [
          {
            server: 'OPhim VIP Server',
            url: `https://ophim1.com/phim/${item.slug}`,
            type: 'embed'
          }
        ]
      }));
    } catch (e) {
      console.warn('Cannot fetch external OPhim API:', e);
      return [];
    }
  },

  async fetchExternalMovieDetail(ophimId) {
    try {
      const slug = ophimId.replace('ophim-', '');
      const res = await fetch(`https://ophim1.com/phim/${slug}`);
      if (!res.ok) return null;
      const data = await res.json();
      const movieData = data?.movie;
      const episodes = data?.episodes?.[0]?.server_data || [];

      if (!movieData) return null;

      const streams = episodes.map((ep, idx) => ({
        server: ep.name || `Tập ${idx + 1}`,
        url: ep.link_m3u8 || ep.link_embed,
        type: ep.link_m3u8 ? 'm3u8' : 'embed'
      }));

      return {
        id: ophimId,
        title: movieData.name,
        category: 'online-api',
        poster: `https://img.ophim.live/uploads/movies/${movieData.poster_url || movieData.thumb_url}`,
        banner: `https://img.ophim.live/uploads/movies/${movieData.poster_url || movieData.thumb_url}`,
        description: movieData.content ? movieData.content.replace(/<[^>]*>?/gm, '') : 'Phim trực tuyến',
        duration: movieData.time || 'Đang cập nhật',
        releaseYear: movieData.year || 2024,
        rating: 8.8,
        genres: movieData.category?.map(c => c.name) || ['Phim Mới'],
        isExternal: true,
        streams: streams.length > 0 ? streams : [{ server: 'Server 1', url: movieData.trailer_url, type: 'embed' }]
      };
    } catch (e) {
      console.error('Failed to load external movie detail:', e);
      return null;
    }
  }
};
