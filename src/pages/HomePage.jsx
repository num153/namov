import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieService } from '../services/movieService';
import HeroBanner from '../components/HeroBanner';
import MovieCard from '../components/MovieCard';
import { Search, Filter, Sparkles, Film, Zap, Flame, Compass } from 'lucide-react';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localMovies, setLocalMovies] = useState([]);
  const [externalMovies, setExternalMovies] = useState([]);
  const [loadingApi, setLoadingApi] = useState(false);

  const currentCategory = searchParams.get('cat') || 'all';
  const currentQuery = searchParams.get('q') || '';
  const isOnlyM3U8 = searchParams.get('m3u8') === 'true';

  useEffect(() => {
    // Load movies and subscribe to Cloud updates
    setLocalMovies(movieService.getLocalMovies());
    const unsubscribe = movieService.subscribe((updated) => {
      setLocalMovies(updated);
    });

    // If online API tab requested
    if (currentCategory === 'online-api') {
      setLoadingApi(true);
      movieService.fetchExternalMovies(1)
        .then(res => setExternalMovies(res))
        .finally(() => setLoadingApi(false));
    }

    return () => unsubscribe();
  }, [currentCategory]);

  const categories = [
    { id: 'all', name: 'Tất Cả', icon: Film },
    { id: 'chautinhtri', name: 'Châu Tinh Trì & HK', icon: Flame },
    { id: 'dienanh', name: 'Điện Ảnh', icon: Sparkles },
    { id: 'hoathinh', name: 'Hoạt Hình', icon: Compass },
    { id: 'm3u8-vip', name: 'Stream M3U8', icon: Zap },
    { id: 'online-api', name: 'Phim Mới (API)', icon: Sparkles },
  ];

  const handleCategoryChange = (catId) => {
    const params = new URLSearchParams(searchParams);
    if (catId === 'all') {
      params.delete('cat');
      params.delete('m3u8');
    } else if (catId === 'm3u8-vip') {
      params.delete('cat');
      params.set('m3u8', 'true');
    } else {
      params.delete('m3u8');
      params.set('cat', catId);
    }
    setSearchParams(params);
  };

  const filteredMovies = useMemo(() => {
    if (currentCategory === 'online-api') {
      return externalMovies;
    }

    return movieService.searchMovies({
      query: currentQuery,
      category: isOnlyM3U8 ? 'all' : currentCategory,
      onlyM3U8: isOnlyM3U8 || currentCategory === 'm3u8-vip'
    });
  }, [localMovies, externalMovies, currentCategory, currentQuery, isOnlyM3U8]);

  return (
    <div className="home-page animate-fade-in">
      {/* Hero Highlight Slider */}
      {!currentQuery && currentCategory === 'all' && !isOnlyM3U8 && (
        <HeroBanner movies={localMovies} />
      )}

      <div className="container main-catalog">
        {/* Category Tab Bar */}
        <div className="catalog-header">
          <div className="category-tabs">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive =
                (cat.id === 'all' && currentCategory === 'all' && !isOnlyM3U8) ||
                (cat.id === 'm3u8-vip' && (isOnlyM3U8 || currentCategory === 'm3u8-vip')) ||
                (cat.id === currentCategory && !isOnlyM3U8);

              return (
                <button
                  key={cat.id}
                  className={`category-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <Icon size={14} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter / Search Title Banner */}
        <div className="filter-summary">
          <div className="summary-title">
            <h2>
              {currentQuery ? (
                <>Kết quả "{currentQuery}"</>
              ) : isOnlyM3U8 || currentCategory === 'm3u8-vip' ? (
                <>Phim Stream M3U8 VIP</>
              ) : currentCategory === 'chautinhtri' ? (
                <>Châu Tinh Trì & Hong Kong</>
              ) : currentCategory === 'dienanh' ? (
                <>Điện Ảnh Chiếu Rạp</>
              ) : currentCategory === 'hoathinh' ? (
                <>Anime & Hoạt Hình</>
              ) : currentCategory === 'online-api' ? (
                <>Phim Mới Cập Nhật</>
              ) : (
                <>Danh Sách Phim</>
              )}
            </h2>
            <span className="movie-count-badge">{filteredMovies.length}</span>
          </div>

          {currentQuery && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('q');
                setSearchParams(params);
              }}
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Movies Grid */}
        {loadingApi ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách phim...</p>
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="movie-grid">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-panel">
            <Film size={44} color="var(--text-muted)" />
            <h3>Không tìm thấy phim phù hợp</h3>
            <p>Hãy thử tìm kiếm với từ khóa khác.</p>
            <button
              className="btn btn-primary"
              onClick={() => handleCategoryChange('all')}
            >
              Xem tất cả phim
            </button>
          </div>
        )}
      </div>

      <style>{`
        .main-catalog {
          padding-top: 24px;
          padding-bottom: 60px;
        }
        .catalog-header {
          margin-bottom: 20px;
        }
        .category-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-bottom: 6px;
        }
        .category-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .category-tab-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .category-tab-btn.active {
          background: var(--accent-red);
          color: #fff;
          border-color: var(--accent-red);
          box-shadow: 0 2px 10px rgba(229, 9, 20, 0.4);
        }
        .filter-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 10px;
        }
        .summary-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .summary-title h2 {
          font-size: 17px;
          font-weight: 700;
        }
        .movie-count-badge {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-full);
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 16px;
        }
        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px 16px;
          text-align: center;
          gap: 14px;
          border-radius: var(--radius-lg);
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent-red);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile First Grid */
        @media (max-width: 600px) {
          .main-catalog {
            padding-top: 14px;
          }
          .category-tabs {
            gap: 6px 6px;
            flex-wrap: wrap;
          }
          .movie-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .summary-title h2 {
            font-size: 15px;
          }
          .category-tab-btn {
            font-size: 11.5px;
            padding: 5px 10px;
          }
        }

        @media (max-width: 380px) {
          .movie-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
