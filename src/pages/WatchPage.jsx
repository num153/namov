import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { movieService } from '../services/movieService';
import VideoPlayer from '../components/VideoPlayer';
import MovieCard from '../components/MovieCard';
import { Bookmark, Share2, Server, ArrowLeft, Zap, Info, Check, Film, AlertCircle, Layers, PlayCircle } from 'lucide-react';

export default function WatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setActiveSourceIndex(0);
    window.scrollTo(0, 0);

    const loadMovie = async () => {
      try {
        let found = await movieService.getMovieByIdAsync(id);

        if (!found && id && id.startsWith('ophim-')) {
          found = await movieService.fetchExternalMovieDetail(id);
        }

        setMovie(found);

        if (found) {
          document.title = `${found.title} - Xem Phim | NAM.OV`;
          const all = movieService.getLocalMovies() || [];
          
          // Related movies excluding the current one and other parts of the same franchise
          const currentFranchisePartIds = found.franchise?.parts?.map(p => p.id) || [];
          const related = all.filter(m => 
            m && m.id !== found.id && 
            !currentFranchisePartIds.includes(m.id) &&
            m.category === found.category
          ).slice(0, 6);
          
          setRelatedMovies(related);

          try {
            const saved = JSON.parse(localStorage.getItem('namov_watchlist') || '[]');
            setIsSaved(saved.some(m => m.id === found.id));
          } catch {
            setIsSaved(false);
          }
        }
      } catch (err) {
        console.error('Error loading movie:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id]);

  const toggleBookmark = () => {
    if (!movie) return;
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

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const sources = movie?.streams || movie?.sources || [];
  const hasSources = sources.length > 0;
  const franchise = movie?.franchise;
  const hasFranchise = franchise && franchise.parts && franchise.parts.length > 1;

  // Tách biệt các mùa (Seasons) nếu phim có nhiều season/tập (gọi Hook ở cấp đầu tiên)
  const seasonGroups = useMemo(() => {
    if (!sources || sources.length === 0) return null;
    const hasMultipleSeasons = sources.some(s => {
      const name = s.server || s.name || '';
      return name.startsWith('SS0') || name.startsWith('S1') || name.startsWith('S2') || s.season;
    });

    if (!hasMultipleSeasons) return null;

    const groups = {};
    sources.forEach((src, idx) => {
      const name = src.server || src.name || '';
      let groupKey = 'Khác';
      if (src.season) {
        groupKey = src.season;
      } else if (name.startsWith('SS01') || name.startsWith('S1')) {
        groupKey = 'Mùa 1 (Season 1)';
      } else if (name.startsWith('SS02') || name.startsWith('S2')) {
        groupKey = 'Mùa 2 (Season 2)';
      } else if (name.startsWith('SS03') || name.startsWith('S3')) {
        groupKey = 'Mùa 3 (Season 3)';
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({ src, originalIndex: idx });
    });

    return groups;
  }, [sources]);

  if (loading) {
    return (
      <div className="container watch-page-loading">
        <div className="spinner"></div>
        <p>Đang chuẩn bị luồng phát phim...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container not-found-wrapper">
        <Film size={54} color="var(--accent-red)" />
        <h2>Không tìm thấy bộ phim yêu cầu</h2>
        <p>Có thể liên kết đã thay đổi hoặc phim đã được cập nhật đường dẫn mới.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="watch-page animate-fade-in">
      <div className="container watch-container">
        {/* Navigation Breadcrumb */}
        <div className="watch-breadcrumb">
          <Link to="/" className="breadcrumb-link">
            <ArrowLeft size={15} /> Trang chủ
          </Link>
          <span className="breadcrumb-sep">/</span>
          <Link to={`/?cat=${movie.category}`} className="breadcrumb-link">
            {movie.categoryLabel || movie.category}
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{movie.title}</span>
        </div>

        {/* Video Player Section */}
        <div className="player-main-area">
          {hasSources ? (
            <VideoPlayer
              movie={movie}
              activeSourceIndex={activeSourceIndex}
              onSourceChange={setActiveSourceIndex}
            />
          ) : (
            <div className="no-source-box glass-panel">
              <AlertCircle size={36} color="#f59e0b" />
              <h3>Đang cập nhật luồng phát</h3>
              <p>Bộ phim này đang được cập nhật lại nguồn phát chất lượng cao. Bạn hãy chọn phim khác trong danh mục nhé!</p>
            </div>
          )}
        </div>

        {/* Multi-Part / Franchise Selector Box */}
        {hasFranchise && (
          <div className="franchise-selector-card glass-panel animate-fade-in">
            <div className="franchise-header">
              <div className="franchise-title-wrap">
                <Layers size={18} color="var(--accent-red)" />
                <span className="franchise-title">{franchise.name}</span>
              </div>
              <span className="franchise-count-badge">{franchise.parts.length} Phần / Tập</span>
            </div>

            <div className={`franchise-parts-list ${franchise.parts.length > 6 ? 'grid-episodes' : 'flex-parts'}`}>
              {franchise.parts.map((part) => {
                const isActive = part.id === movie.id;
                return (
                  <Link
                    key={part.id}
                    to={`/watch/${part.id}`}
                    className={`franchise-part-btn ${isActive ? 'active' : ''}`}
                    title={part.title || part.name}
                  >
                    <PlayCircle size={14} />
                    <span>{part.name}</span>
                    {isActive && <span className="active-dot" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Server / Season Switcher Bar */}
        {hasSources && (
          <div className="server-switcher-card glass-panel">
            {seasonGroups ? (
              <div className="seasons-container">
                {Object.entries(seasonGroups).map(([seasonName, epList]) => (
                  <div key={seasonName} className="season-group-block">
                    <div className="season-group-header">
                      <div className="season-group-title">
                        <Layers size={15} color="var(--accent-red)" />
                        <span>{seasonName}</span>
                      </div>
                      <span className="season-group-count">{epList.length} Tập</span>
                    </div>
                    <div className="server-list episode-list">
                      {epList.map(({ src, originalIndex }) => {
                        const isM3U8 = src.type === 'm3u8';
                        const isActive = originalIndex === activeSourceIndex;
                        return (
                          <button
                            key={originalIndex}
                            className={`server-btn ep-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveSourceIndex(originalIndex)}
                          >
                            {isM3U8 && <Zap size={12} color="#10b981" />}
                            <span>{src.server || src.name || `Tập ${originalIndex + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="server-label">
                  <Server size={17} color="var(--accent-red)" />
                  <span>Máy Chủ Phát:</span>
                </div>
                <div className="server-list">
                  {sources.map((src, idx) => {
                    const isM3U8 = src.type === 'm3u8';
                    const isActive = idx === activeSourceIndex;
                    return (
                      <button
                        key={idx}
                        className={`server-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveSourceIndex(idx)}
                      >
                        {isM3U8 && <Zap size={13} color="#10b981" />}
                        <span>{src.server || src.name || `Server ${idx + 1}`}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Movie Info & Actions Block */}
        <div className="movie-detail-card">
          <div className="detail-header">
            <div>
              <div className="detail-badges">
                <span className="badge badge-category">{movie.categoryLabel}</span>
                {franchise && (
                  <span className="badge badge-vip">
                    <Layers size={11} /> {franchise.currentPartName || 'Tuyển tập'}
                  </span>
                )}
                {movie.tags && movie.tags.map((t, idx) => (
                  <span key={idx} className="badge badge-tag">{t}</span>
                ))}
              </div>
              <h1 className="detail-title">{movie.title}</h1>
            </div>

            <div className="detail-actions">
              <button
                className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleBookmark}
              >
                <Bookmark size={16} fill={isSaved ? 'white' : 'none'} />
                <span>{isSaved ? 'Đã Lưu' : 'Lưu Xem Sau'}</span>
              </button>

              <button className="btn btn-secondary" onClick={handleShare}>
                {copied ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
                <span>{copied ? 'Đã Sao Chép!' : 'Chia Sẻ'}</span>
              </button>
            </div>
          </div>

          <div className="detail-body">
            <h3>Nội Dung Phim</h3>
            <p className="detail-desc">{movie.description}</p>
          </div>
        </div>

        {/* Related Movies */}
        {relatedMovies.length > 0 && (
          <div className="related-section">
            <h2 className="section-heading">Phim Cùng Thể Loại</h2>
            <div className="related-grid">
              {relatedMovies.map((rel) => (
                <MovieCard key={rel.id} movie={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .watch-page {
          max-width: 1020px;
          margin: 0 auto;
          padding-top: 16px;
          padding-bottom: 60px;
        }
        .watch-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .breadcrumb-link {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
          transition: color 0.2s;
        }
        .breadcrumb-link:hover {
          color: #fff;
        }
        .breadcrumb-current {
          color: #fff;
          font-weight: 600;
        }
        .player-main-area {
          margin-bottom: 18px;
        }
        .no-source-box {
          aspect-ratio: 16 / 9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          text-align: center;
          border-radius: var(--radius-lg);
          gap: 12px;
        }
        .no-source-box h3 {
          font-size: 18px;
        }
        .no-source-box p {
          color: var(--text-secondary);
          font-size: 14px;
          max-width: 480px;
        }

        /* Franchise / Parts Selector Box */
        .franchise-selector-card {
          padding: 16px 20px;
          border-radius: var(--radius-md);
          margin-bottom: 16px;
          border: 1px solid rgba(229, 9, 20, 0.25);
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.06) 0%, rgba(18, 20, 26, 0.85) 100%);
        }
        .franchise-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .franchise-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14.5px;
          font-weight: 700;
          color: #fff;
        }
        .franchise-count-badge {
          font-size: 11.5px;
          color: #ff6b6b;
          background: rgba(229, 9, 20, 0.15);
          padding: 3px 8px;
          border-radius: var(--radius-full);
          font-weight: 600;
        }
        .franchise-parts-list.flex-parts {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .franchise-parts-list.grid-episodes {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .franchise-part-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }
        .franchise-part-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.3);
        }
        .franchise-part-btn.active {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: #fff;
          box-shadow: 0 4px 12px rgba(229, 9, 20, 0.4);
        }
        .active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
        }

        .server-switcher-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .server-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 13.5px;
          color: #fff;
        }
        .server-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .server-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .server-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
        }
        .server-btn.active {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: #fff;
          box-shadow: 0 4px 12px rgba(229, 9, 20, 0.4);
        }
        .seasons-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .season-group-block {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }
        .season-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .season-group-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          font-size: 13.5px;
          color: #fff;
        }
        .season-group-count {
          font-size: 11px;
          color: #9ca3af;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
        }
        .episode-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ep-btn {
          min-width: 90px;
          justify-content: center;
        }
        .movie-detail-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 36px;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .detail-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .detail-title {
          font-size: clamp(20px, 3.5vw, 26px);
          font-weight: 800;
          line-height: 1.2;
        }
        .detail-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .detail-body h3 {
          font-size: 15px;
          color: #fff;
          margin-bottom: 8px;
        }
        .detail-desc {
          color: var(--text-secondary);
          font-size: 13.5px;
          line-height: 1.65;
        }
        .related-section {
          margin-top: 36px;
        }
        .section-heading {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 16px;
        }
        .watch-page-loading, .not-found-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          gap: 16px;
        }

        @media (max-width: 600px) {
          .related-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .detail-header {
            flex-direction: column;
          }
          .movie-detail-card {
            padding: 16px;
          }
          .franchise-parts-list.grid-episodes {
            grid-template-columns: repeat(4, 1fr);
          }
          .franchise-part-btn {
            padding: 6px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
