import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { movieService } from '../services/movieService';
import { Bookmark, Clock, Trash2, Film, PlayCircle, ArrowLeft } from 'lucide-react';

export default function CollectionPage() {
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' | 'history'
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    document.title = 'Bộ Sưu Tập Của Tôi - NAM.OV';
    loadData();
  }, []);

  const loadData = () => {
    try {
      const savedWatchlist = JSON.parse(localStorage.getItem('namov_watchlist') || '[]');
      const savedHistory = JSON.parse(localStorage.getItem('namov_history') || '[]');
      
      const all = movieService.getLocalMovies();
      // Hydrate watchlist with full movie info
      const hydratedWatchlist = savedWatchlist.map(item => {
        const full = all.find(m => m.id === item.id);
        return full || item;
      });

      const hydratedHistory = savedHistory.map(item => {
        const full = all.find(m => m.id === item.id);
        return full || item;
      });

      setWatchlist(hydratedWatchlist);
      setHistory(hydratedHistory);
    } catch (e) {
      console.error(e);
    }
  };

  const clearWatchlist = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ phim trong Danh sách yêu thích?')) {
      localStorage.setItem('namov_watchlist', JSON.stringify([]));
      setWatchlist([]);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const clearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ Lịch sử xem phim?')) {
      localStorage.setItem('namov_history', JSON.stringify([]));
      setHistory([]);
    }
  };

  return (
    <div className="collection-page animate-fade-in">
      <div className="container collection-container">
        <div className="collection-header">
          <div>
            <h1 className="collection-title">Bộ Sưu Tập Của Tôi</h1>
            <p className="collection-subtitle">Quản lý các bộ phim yêu thích và theo dõi tiến độ xem phim.</p>
          </div>

          <div className="collection-tabs">
            <button
              className={`collection-tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              <Bookmark size={16} />
              <span>Đã Lưu ({watchlist.length})</span>
            </button>

            <button
              className={`collection-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={16} />
              <span>Lịch Sử Xem ({history.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Watchlist */}
        {activeTab === 'watchlist' && (
          <div className="tab-content">
            {watchlist.length > 0 ? (
              <>
                <div className="tab-actions-bar">
                  <span>Tổng cộng {watchlist.length} bộ phim đã lưu</span>
                  <button className="btn btn-outline btn-sm" onClick={clearWatchlist}>
                    <Trash2 size={14} /> Xóa tất cả
                  </button>
                </div>
                <div className="movie-grid">
                  {watchlist.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-collection glass-panel">
                <Bookmark size={48} color="var(--text-muted)" />
                <h3>Danh sách lưu phim đang trống</h3>
                <p>Hãy nhấn vào biểu tượng dấu trang trên các bộ phim để lưu lại xem sau.</p>
                <Link to="/" className="btn btn-primary">
                  Khám phá phim ngay
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: History */}
        {activeTab === 'history' && (
          <div className="tab-content">
            {history.length > 0 ? (
              <>
                <div className="tab-actions-bar">
                  <span>Đã xem gần đây ({history.length} phim)</span>
                  <button className="btn btn-outline btn-sm" onClick={clearHistory}>
                    <Trash2 size={14} /> Xóa lịch sử
                  </button>
                </div>
                <div className="movie-grid">
                  {history.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-collection glass-panel">
                <Clock size={48} color="var(--text-muted)" />
                <h3>Chưa có lịch sử xem</h3>
                <p>Những bộ phim bạn đã xem sẽ tự động được lưu lại tại đây.</p>
                <Link to="/" className="btn btn-primary">
                  Xem phim ngay
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .collection-page {
          padding-top: 30px;
          padding-bottom: 60px;
          min-height: 70vh;
        }
        .collection-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 20px;
        }
        .collection-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .collection-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
        }
        .collection-tabs {
          display: flex;
          gap: 10px;
        }
        .collection-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .collection-tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .collection-tab-btn.active {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: #fff;
        }
        .tab-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
        }
        .empty-collection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          gap: 16px;
          border-radius: var(--radius-lg);
          margin-top: 20px;
        }
        @media (max-width: 600px) {
          .movie-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .collection-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
