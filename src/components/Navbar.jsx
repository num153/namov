import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Search, Bookmark, Menu, X, PlayCircle, Sparkles } from 'lucide-react';

export default function Navbar({ onSearch }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('namov_watchlist') || '[]');
        setWatchlistCount(saved.length);
      } catch {
        setWatchlistCount(0);
      }
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
      if (onSearch) onSearch(searchTerm.trim());
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Châu Tinh Trì & HK', path: '/?cat=chautinhtri' },
    { name: 'Điện Ảnh', path: '/?cat=dienanh' },
    { name: 'Anime & Hoạt Hình', path: '/?cat=hoathinh' },
    { name: 'Stream M3U8 VIP', path: '/?m3u8=true' },
    { name: 'Bộ Sưu Tập', path: '/collection' },
    { name: 'Giới Thiệu', path: '/about' },
  ];

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <span className="brand-name">
            NAM<span className="brand-dot">.</span>OV
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-item-link ${location.pathname + location.search === item.path ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Search Bar & Action Buttons */}
        <div className="nav-actions">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Tìm phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </form>

          <Link to="/collection" className="watchlist-btn" title="Danh sách của tôi">
            <Bookmark size={18} />
            {watchlistCount > 0 && <span className="watchlist-badge">{watchlistCount}</span>}
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer glass-panel animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="mobile-search-form">
            <Search size={17} />
            <input
              type="text"
              placeholder="Tìm kiếm phim, diễn viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-search-input"
              autoFocus
            />
          </form>

          <div className="mobile-links">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="mobile-link-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <PlayCircle size={17} color="var(--accent-red)" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .navbar-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          z-index: 1000;
          transition: all 0.3s ease;
          background: linear-gradient(180deg, rgba(10, 11, 14, 0.98) 0%, rgba(10, 11, 14, 0.8) 100%);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid transparent;
        }
        .navbar-header.scrolled {
          background: rgba(10, 11, 14, 0.96);
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          gap: 16px;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .logo-icon-wrapper {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent-red), #ff4757);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 10px rgba(229, 9, 20, 0.35);
        }
        .brand-name {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #fff;
        }
        .brand-dot {
          color: var(--accent-red);
        }
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .nav-item-link {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          position: relative;
          padding: 6px 0;
        }
        .nav-item-link:hover, .nav-item-link.active {
          color: #fff;
        }
        .nav-item-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-red);
          border-radius: 2px;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .search-form {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 7px 14px 7px 34px;
          color: #fff;
          font-size: 13px;
          width: 170px;
          transition: all 0.2s ease;
        }
        .search-input:focus {
          outline: none;
          width: 230px;
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .watchlist-btn {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .watchlist-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .watchlist-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--accent-red);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
        }
        .mobile-toggle {
          display: none;
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 4px;
        }
        .mobile-drawer {
          position: absolute;
          top: 56px;
          left: 0;
          right: 0;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        .mobile-search-form {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-secondary);
        }
        .mobile-search-input {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 14px;
          width: 100%;
        }
        .mobile-search-input:focus {
          outline: none;
        }
        .mobile-links {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mobile-link-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
        }
        .mobile-link-item:hover, .mobile-link-item:active {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        @media (max-width: 992px) {
          .desktop-nav {
            display: none;
          }
          .search-form {
            display: none;
          }
          .mobile-toggle {
            display: block;
          }
          .navbar-header {
            height: 56px;
          }
        }
      `}</style>
    </header>
  );
}
