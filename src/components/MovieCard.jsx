import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bookmark, Zap, Layers } from 'lucide-react';

export default function MovieCard({ movie }) {
  const [isSaved, setIsSaved] = useState(false);
  const [imgSrc, setImgSrc] = useState(movie.poster || '/img/banner1.jpg');

  const streamsList = movie.streams || movie.sources || [];
  const hasM3U8 = streamsList.some(s => s.type === 'm3u8');
  const franchise = movie.franchise;
  const isSeries = franchise && franchise.parts && franchise.parts.length > 1;
  const seriesCount = isSeries ? franchise.parts.length : 0;
  const seriesLabel = isSeries
    ? (franchise.name?.includes('Tập') || franchise.parts.some(p => p.name?.startsWith('Tập'))
        ? `${seriesCount} Tập`
        : `${seriesCount} Phần`)
    : null;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('namov_watchlist') || '[]');
      setIsSaved(saved.some(m => m.id === movie.id));
    } catch {
      setIsSaved(false);
    }
  }, [movie.id]);

  const toggleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let saved = JSON.parse(localStorage.getItem('namov_watchlist') || '[]');
      if (isSaved) {
        saved = saved.filter(m => m.id !== movie.id);
        setIsSaved(false);
      } else {
        saved.unshift({
          id: movie.id,
          title: movie.title,
          poster: movie.poster,
          categoryLabel: movie.categoryLabel,
          addedAt: Date.now()
        });
        setIsSaved(true);
      }
      localStorage.setItem('namov_watchlist', JSON.stringify(saved));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleImgError = () => {
    setImgSrc('https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Black_flag.svg/1024px-Black_flag.svg.png');
  };

  return (
    <div className="movie-card">
      <Link to={`/watch/${movie.id}`} className="movie-card-link">
        <div className="poster-wrapper">
          <img
            src={imgSrc}
            alt={movie.title}
            className="movie-poster"
            loading="lazy"
            onError={handleImgError}
          />
          
          <div className="poster-overlay">
            <div className="play-circle">
              <Play size={20} fill="white" />
            </div>
          </div>

          {/* Badges */}
          <div className="card-badges">
            {isSeries && (
              <span className="badge-series">
                <Layers size={9} /> {seriesLabel}
              </span>
            )}
            {hasM3U8 && (
              <span className="badge-m3u8">
                <Zap size={9} /> M3U8
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            className={`bookmark-toggle-btn ${isSaved ? 'active' : ''}`}
            onClick={toggleBookmark}
            title={isSaved ? 'Xóa khỏi danh sách' : 'Lưu vào xem sau'}
          >
            <Bookmark size={14} fill={isSaved ? '#e50914' : 'none'} color={isSaved ? '#e50914' : 'white'} />
          </button>
        </div>

        {/* Clean Title without gray box */}
        <div className="movie-info">
          <h3 className="movie-title" title={movie.title}>
            {movie.title}
          </h3>
        </div>
      </Link>

      <style>{`
        .movie-card {
          position: relative;
          background: transparent; /* No gray container */
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: none;
        }
        .movie-card-link {
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
        }
        .poster-wrapper {
          position: relative;
          aspect-ratio: 2 / 3;
          width: 100%;
          background: #151821;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .movie-card:hover .poster-wrapper {
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
        }
        .movie-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .poster-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .movie-card:hover .poster-overlay,
        .movie-card:active .poster-overlay {
          opacity: 1;
        }
        .play-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent-red);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 14px rgba(229, 9, 20, 0.6);
        }
        .card-badges {
          position: absolute;
          top: 8px;
          left: 8px;
          display: flex;
          gap: 4px;
          z-index: 2;
        }
        .badge-m3u8 {
          background: #10b981;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }
        .badge-series {
          background: rgba(229, 9, 20, 0.88);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
        }
        .bookmark-toggle-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 3;
          transition: all 0.2s;
        }
        .bookmark-toggle-btn:hover,
        .bookmark-toggle-btn:active {
          background: rgba(229, 9, 20, 0.85);
        }
        .bookmark-toggle-btn.active {
          background: rgba(255, 255, 255, 0.95);
        }
        .movie-info {
          padding: 8px 2px 2px 2px;
          background: transparent;
        }
        .movie-title {
          font-size: 13px;
          font-weight: 600;
          color: #f3f4f6;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
        }
        .movie-card:hover .movie-title {
          color: #fff;
        }

        @media (max-width: 600px) {
          .poster-wrapper {
            border-radius: 8px;
          }
          .movie-title {
            font-size: 12.5px;
            font-weight: 500;
          }
          .play-circle {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>
    </div>
  );
}
