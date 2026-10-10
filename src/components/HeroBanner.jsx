import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Bookmark, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export default function HeroBanner({ movies = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Filter top featured movies (preferably with M3U8 or high rating)
  const featured = movies.filter(m => 
    m.id.includes('vuahaikich') || 
    m.id.includes('batman') || 
    m.id.includes('tuyetdinhkungfu') ||
    m.id.includes('coco') ||
    m.id.includes('spiderman') ||
    m.id.includes('truonghocuylong')
  ).slice(0, 5);

  const heroList = featured.length > 0 ? featured : movies.slice(0, 5);

  const currentMovie = heroList[currentIndex];

  useEffect(() => {
    if (heroList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroList.length]);

  useEffect(() => {
    if (!currentMovie) return;
    try {
      const saved = JSON.parse(localStorage.getItem('namov_watchlist') || '[]');
      setIsSaved(saved.some(m => m.id === currentMovie.id));
    } catch {
      setIsSaved(false);
    }
  }, [currentMovie]);

  if (!currentMovie) return null;

  const toggleBookmark = () => {
    try {
      let saved = JSON.parse(localStorage.getItem('namov_watchlist') || '[]');
      if (isSaved) {
        saved = saved.filter(m => m.id !== currentMovie.id);
        setIsSaved(false);
      } else {
        saved.unshift({
          id: currentMovie.id,
          title: currentMovie.title,
          poster: currentMovie.poster,
          categoryLabel: currentMovie.categoryLabel,
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

  return (
    <div className="hero-banner">
      {/* Background with Dark Backdrop Gradients */}
      <div className="hero-backdrop-container">
        <img
          src={currentMovie.banner || currentMovie.poster}
          alt={currentMovie.title}
          className="hero-backdrop"
        />
        <div className="hero-gradient-overlay" />
        <div className="hero-gradient-bottom" />
      </div>

      <div className="container hero-content">
        <div className="hero-text-block animate-fade-in" key={currentMovie.id}>
          <div className="hero-tags">
            <span className="badge badge-vip">
              <Zap size={12} /> Nổi Bật
            </span>
            <span className="badge badge-category">
              {currentMovie.categoryLabel}
            </span>
          </div>

          <h1 className="hero-title">{currentMovie.title}</h1>
          
          <p className="hero-description">
            {currentMovie.description}
          </p>

          <div className="hero-actions">
            <Link to={`/watch/${currentMovie.id}`} className="btn btn-primary btn-lg">
              <Play size={20} fill="white" />
              <span>Xem Phim Ngay</span>
            </Link>

            <button
              className={`btn btn-secondary ${isSaved ? 'btn-saved' : ''}`}
              onClick={toggleBookmark}
            >
              <Bookmark size={18} fill={isSaved ? 'white' : 'none'} />
              <span>{isSaved ? 'Đã Lưu' : 'Thêm Vào Danh Sách'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="hero-indicators">
        {heroList.map((m, idx) => (
          <button
            key={m.id}
            className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      <style>{`
        .hero-banner {
          position: relative;
          min-height: 540px;
          height: 65vh;
          max-height: 700px;
          display: flex;
          align-items: center;
          margin-top: -72px; /* Extend beneath fixed navbar */
          overflow: hidden;
        }
        .hero-backdrop-container {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .hero-backdrop {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          filter: brightness(0.7) contrast(1.1);
          transform: scale(1.02);
          transition: transform 6s ease;
        }
        .hero-banner:hover .hero-backdrop {
          transform: scale(1.05);
        }
        .hero-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(10, 11, 14, 0.95) 0%,
            rgba(10, 11, 14, 0.7) 45%,
            rgba(10, 11, 14, 0.1) 100%
          );
        }
        .hero-gradient-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 180px;
          background: linear-gradient(180deg, transparent 0%, var(--bg-primary) 100%);
        }
        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          padding-top: 60px;
        }
        .hero-text-block {
          max-width: 620px;
        }
        .hero-tags {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .hero-title {
          font-size: clamp(32px, 5vw, 54px);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 16px;
          text-shadow: 0 4px 12px rgba(0,0,0,0.8);
        }
        .hero-description {
          color: #d1d5db;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 28px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        }
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .btn-lg {
          padding: 12px 28px;
          font-size: 16px;
          border-radius: var(--radius-md);
        }
        .hero-indicators {
          position: absolute;
          bottom: 24px;
          right: 40px;
          z-index: 3;
          display: flex;
          gap: 8px;
        }
        .indicator-dot {
          width: 28px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .indicator-dot.active {
          width: 44px;
          background: var(--accent-red);
        }
        @media (max-width: 768px) {
          .hero-banner {
            min-height: 480px;
            height: auto;
            padding: 100px 0 40px 0;
          }
          .hero-indicators {
            bottom: 14px;
            right: 20px;
          }
        }
      `}</style>
    </div>
  );
}
