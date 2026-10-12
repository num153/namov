import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, KeyRound, Film, PlusCircle, Trash2, ExternalLink,
  CheckCircle2, AlertCircle, RefreshCw, Eye, Sparkles, LogOut,
  Home, Search, Filter, Layers, Play
} from 'lucide-react';
import { movieService } from '../services/movieService';

// Chuyển tiếng Việt có dấu thành slug không dấu
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [customId, setCustomId] = useState('');
  const [isCustomIdEdited, setIsCustomIdEdited] = useState(false);
  const [category, setCategory] = useState('dienanh');
  const [streamUrl, setStreamUrl] = useState('');
  const [serverName, setServerName] = useState('VIP HLS (M3U8)');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [duration, setDuration] = useState('110 phút');
  const [rating, setRating] = useState('8.5');
  const [genres, setGenres] = useState('Hành Động, Hài Hước');
  const [description, setDescription] = useState('');

  // Status & Management State
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }
  const [allMovies, setAllMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // Check login state on mount
  useEffect(() => {
    document.title = 'Admin Quản Trị - NAM.OV';
    const savedAuth = sessionStorage.getItem('namov_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch movies when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setAllMovies(movieService.getLocalMovies());
      const unsub = movieService.subscribe((updated) => {
        setAllMovies(updated);
      });
      return () => unsub();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || '25081503';
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('namov_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Mật khẩu không chính xác. Vui lòng thử lại!');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('namov_admin_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Auto-generate Movie ID when Title or Category changes
  useEffect(() => {
    if (!isCustomIdEdited && title.trim()) {
      const slug = slugify(title);
      setCustomId(`${category}-${slug}`);
    }
  }, [title, category, isCustomIdEdited]);

  // Handle Submit Form
  const handleSubmitMovie = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Vui lòng nhập tiêu đề phim!' });
      return;
    }

    if (!streamUrl.trim()) {
      setNotification({ type: 'error', message: 'Vui lòng nhập đường dẫn Link M3U8!' });
      return;
    }

    const finalId = (customId.trim() || `${category}-${slugify(title)}`).toLowerCase();
    const parsedGenres = genres
      ? genres.split(',').map(g => g.trim()).filter(Boolean)
      : ['Chiếu Rạp'];

    const moviePayload = {
      id: finalId,
      title: title.trim(),
      category: category,
      poster: posterUrl.trim() || '/img/banner1.jpg',
      banner: bannerUrl.trim() || posterUrl.trim() || '/img/banner1.jpg',
      description: description.trim() || `Phim ${title.trim()} tuyển chọn chất lượng cao trên NAM.OV.`,
      duration: duration.trim() || '110 phút',
      releaseYear: parseInt(releaseYear, 10) || new Date().getFullYear(),
      rating: parseFloat(rating) || 8.5,
      genres: parsedGenres,
      streams: [
        {
          server: serverName.trim() || 'VIP HLS',
          url: streamUrl.trim(),
          type: 'm3u8'
        }
      ],
      subtitles: [],
      franchise: null
    };

    setLoading(true);
    try {
      const res = await movieService.addMovie(moviePayload);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Thêm phim "${title}" thành công vào Supabase! Đã sẵn sàng phát trực tuyến.`,
          movieId: finalId
        });
        // Reset form fields
        setTitle('');
        setCustomId('');
        setIsCustomIdEdited(false);
        setStreamUrl('');
        setPosterUrl('');
        setBannerUrl('');
        setDescription('');
      } else {
        setNotification({
          type: 'error',
          message: `Lỗi Supabase: ${res.error || 'Không thể ghi dữ liệu'}`
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Lỗi bất ngờ: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Movie
  const handleDeleteMovie = async (movie) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa phim "${movie.title}" (ID: ${movie.id}) khỏi Supabase không?`);
    if (!confirmDelete) return;

    setDeletingId(movie.id);
    try {
      const res = await movieService.deleteMovie(movie.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Đã xóa phim "${movie.title}" thành công!`
        });
      } else {
        setNotification({
          type: 'error',
          message: `Lỗi khi xóa phim: ${res.error}`
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Lỗi khi xóa: ${err.message}`
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter existing movies
  const filteredExistingMovies = useMemo(() => {
    return allMovies.filter(m => {
      const matchCat = selectedFilterCategory === 'all' || m.category === selectedFilterCategory;
      const matchQuery = !searchQuery ||
        m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [allMovies, selectedFilterCategory, searchQuery]);

  // RENDER: PASSWORD LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        <div className="lock-box glass-panel animate-fade-in">
          <div className="lock-icon-wrap">
            <Lock size={32} color="#e50914" />
          </div>
          <h2>Bảo Mật Quản Trị</h2>
          <p className="lock-subtitle">Ngày sinh Ngố và Húi viết liền</p>

          <form onSubmit={handleLogin} className="lock-form">
            <div className="input-group">
              <KeyRound size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>

            {authError && <div className="auth-error-msg">{authError}</div>}

            <button type="submit" className="btn-login-admin">
              Mở Khóa Quản Trị
            </button>
          </form>

          <Link to="/" className="btn-back-home">
            <Home size={16} /> Quay lại Trang Chủ
          </Link>
        </div>

        <style>{`
          .admin-lock-screen {
            min-height: calc(100vh - 160px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .lock-box {
            background: rgba(21, 24, 33, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 36px 30px;
            width: 100%;
            max-width: 420px;
            text-align: center;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
          }
          .lock-icon-wrap {
            width: 64px;
            height: 64px;
            background: rgba(229, 9, 20, 0.12);
            border: 1px solid rgba(229, 9, 20, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
          }
          .lock-box h2 {
            font-size: 22px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
          }
          .lock-subtitle {
            font-size: 13px;
            color: #9ca3af;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .lock-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .input-group {
            position: relative;
            display: flex;
            align-items: center;
          }
          .input-icon {
            position: absolute;
            left: 14px;
            color: #6b7280;
          }
          .input-group input {
            width: 100%;
            padding: 12px 14px 12px 42px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            color: #fff;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
          }
          .input-group input:focus {
            border-color: #e50914;
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.2);
          }
          .auth-error-msg {
            color: #ef4444;
            font-size: 13px;
            text-align: left;
            background: rgba(239, 68, 68, 0.1);
            padding: 8px 12px;
            border-radius: 6px;
            border-left: 3px solid #ef4444;
          }
          .btn-login-admin {
            background: #e50914;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          .btn-login-admin:hover {
            background: #b80710;
          }
          .btn-back-home {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 20px;
            color: #9ca3af;
            font-size: 13px;
            text-decoration: none;
            transition: color 0.2s;
          }
          .btn-back-home:hover {
            color: #fff;
          }
        `}</style>
      </div>
    );
  }

  // RENDER: ADMIN DASHBOARD
  return (
    <div className="admin-page animate-fade-in">
      <div className="container admin-container">
        {/* Top Header Bar */}
        <div className="admin-header glass-panel">
          <div className="admin-title-box">
            <div className="admin-badge">
              <Sparkles size={14} color="#e50914" />
              <span>BẢNG ĐIỀU KHIỂN</span>
            </div>
            <h1>Quản Trị Phim NAM.OV</h1>
            <p className="admin-desc">
              Chủ động thêm phim mới và đồng bộ trực tiếp lên cơ sở dữ liệu Supabase Cloud.
            </p>
          </div>

          <div className="admin-header-actions">
            <Link to="/" className="btn-nav-action" title="Xem Trang Chủ">
              <Home size={16} /> Trang Chủ
            </Link>
            <button onClick={handleLogout} className="btn-nav-action btn-logout" title="Đăng xuất">
              <LogOut size={16} /> Thoát
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {notification && (
          <div className={`admin-alert ${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} className="alert-icon" />
            ) : (
              <AlertCircle size={20} className="alert-icon" />
            )}
            <div className="alert-content">
              <span>{notification.message}</span>
              {notification.movieId && (
                <Link to={`/watch/${notification.movieId}`} target="_blank" className="alert-view-link">
                  <ExternalLink size={14} /> Mở xem ngay
                </Link>
              )}
            </div>
            <button onClick={() => setNotification(null)} className="alert-close">×</button>
          </div>
        )}

        {/* Main Grid: Form Left, Preview & List Right */}
        <div className="admin-grid">
          {/* LEFT: FORM ADD MOVIE */}
          <div className="admin-card glass-panel">
            <div className="card-header">
              <div className="header-title">
                <PlusCircle size={20} color="#e50914" />
                <h2>Thêm Phim Mới</h2>
              </div>
              <span className="cloud-indicator">
                <span className="pulse-dot"></span> Supabase Connected
              </span>
            </div>

            <form onSubmit={handleSubmitMovie} className="admin-form">
              {/* Tiêu đề phim */}
              <div className="form-group">
                <label>Tiêu đề phim <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Danh mục & ID */}
              <div className="form-row">
                <div className="form-group">
                  <label>Danh mục <span className="req">*</span></label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="dienanh">Điện Ảnh Chiếu Rạp (dienanh)</option>
                    <option value="hoathinh">Phim Hoạt Hình (hoathinh)</option>
                    <option value="chautinhtri">Châu Tinh Trì & HK (chautinhtri)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Mã ID / Slug
                    <small style={{ color: '#9ca3af', marginLeft: 4 }}>(Tự động tạo)</small>
                  </label>
                  <input
                    type="text"
                    placeholder="dienanh-ten-phim"
                    value={customId}
                    onChange={(e) => {
                      setCustomId(e.target.value);
                      setIsCustomIdEdited(true);
                    }}
                  />
                </div>
              </div>

              {/* Link M3U8 */}
              <div className="form-group">
                <label>Đường dẫn Link M3U8 <span className="req">*</span></label>
                <div className="input-with-badge">
                  <input
                    type="url"
                    placeholder="https://example.com/hls/stream.m3u8"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    required
                  />
                  <span className="input-tag">M3U8 HLS</span>
                </div>
              </div>

              {/* Tên Server */}
              <div className="form-group">
                <label>Tên Server hiển thị</label>
                <input
                  type="text"
                  placeholder="VIP HLS (M3U8)"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                />
              </div>

              {/* Poster & Thumbnail */}
              <div className="form-group">
                <label>Đường dẫn ảnh Thumbnail / Poster</label>
                <input
                  type="text"
                  placeholder="https://... hoặc /dienanh/img/ten-phim.webp"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                />
                <small className="field-hint">
                  Dán link ảnh online bất kỳ hoặc link nội bộ (như /dienanh/img/..., /hoathinh/img/...).
                </small>
              </div>

              {/* Thông tin phụ: Năm, Thời lượng, Đánh giá */}
              <div className="form-row-three">
                <div className="form-group">
                  <label>Năm phát hành</label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Thời lượng</label>
                  <input
                    type="text"
                    placeholder="105 phút"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Điểm đánh giá</label>
                  <input
                    type="text"
                    placeholder="8.5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>
              </div>

              {/* Thể loại con */}
              <div className="form-group">
                <label>Thể loại con (ngăn cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="Hành Động, Hài Hước, Gia Đình"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                />
              </div>

              {/* Tóm tắt nội dung */}
              <div className="form-group">
                <label>Mô tả ngắn</label>
                <textarea
                  rows="3"
                  placeholder="Nội dung tóm tắt sơ lược của bộ phim..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-submit-movie"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinner-icon" /> Đang lưu lên Supabase...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Lưu Phim Lên Supabase
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: LIVE PREVIEW & RECENT MOVIES */}
          <div className="admin-side-col">
            {/* Live Preview Card */}
            <div className="admin-card glass-panel preview-card">
              <div className="card-header">
                <div className="header-title">
                  <Eye size={18} color="#f59e0b" />
                  <h3>Xem Trước Giao Diện</h3>
                </div>
              </div>

              <div className="preview-content">
                <div className="preview-poster-wrap">
                  <img
                    src={posterUrl || '/img/banner1.jpg'}
                    alt="Preview"
                    className="preview-img"
                    onError={(e) => {
                      e.target.src = '/img/banner1.jpg';
                    }}
                  />
                  <div className="preview-badge">
                    {category === 'dienanh' ? 'Điện Ảnh' : category === 'hoathinh' ? 'Hoạt Hình' : 'Châu Tinh Trì'}
                  </div>
                </div>

                <div className="preview-meta">
                  <h4 className="preview-title">{title || 'Tiêu đề phim mẫu'}</h4>
                  <p className="preview-id">ID: <code>{customId || `${category}-...`}</code></p>
                  <div className="preview-tags">
                    <span>{releaseYear || 2024}</span>
                    <span>•</span>
                    <span>{duration || '110 phút'}</span>
                    <span>•</span>
                    <span className="rating-tag">★ {rating || 8.5}</span>
                  </div>
                  <p className="preview-stream-info">
                    <strong>Nguồn:</strong> {serverName || 'VIP HLS'} ({streamUrl ? 'Đã có link M3U8' : 'Chưa có link'})
                  </p>
                </div>
              </div>
            </div>

            {/* Existing Movies List */}
            <div className="admin-card glass-panel movie-list-card">
              <div className="card-header">
                <div className="header-title">
                  <Layers size={18} color="#3b82f6" />
                  <h3>Danh Sách Phim ({filteredExistingMovies.length})</h3>
                </div>
              </div>

              {/* Filters */}
              <div className="list-filters">
                <div className="search-filter-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="cat-filter-select"
                >
                  <option value="all">Tất cả</option>
                  <option value="dienanh">Điện Ảnh</option>
                  <option value="hoathinh">Hoạt Hình</option>
                  <option value="chautinhtri">Châu Tinh Trì</option>
                </select>
              </div>

              {/* Movie List Items */}
              <div className="movie-items-scroll">
                {filteredExistingMovies.length === 0 ? (
                  <div className="empty-movies">Không tìm thấy phim phù hợp.</div>
                ) : (
                  filteredExistingMovies.slice(0, 50).map((m) => (
                    <div key={m.id} className="movie-item-row">
                      <img
                        src={m.poster || '/img/banner1.jpg'}
                        alt={m.title}
                        className="item-thumb"
                        onError={(e) => { e.target.src = '/img/banner1.jpg'; }}
                      />
                      <div className="item-info">
                        <div className="item-title" title={m.title}>{m.title}</div>
                        <div className="item-sub">
                          <span className="item-category">{m.category}</span>
                          <span className="item-id">{m.id}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <Link
                          to={`/watch/${m.id}`}
                          target="_blank"
                          className="btn-item-action btn-view"
                          title="Xem thử phim"
                        >
                          <Play size={13} />
                        </Link>
                        <button
                          onClick={() => handleDeleteMovie(m)}
                          disabled={deletingId === m.id}
                          className="btn-item-action btn-delete"
                          title="Xóa khỏi Supabase"
                        >
                          {deletingId === m.id ? (
                            <RefreshCw size={13} className="spinner-icon" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-page {
          padding-top: 90px;
          padding-bottom: 60px;
          min-height: 100vh;
        }
        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* Top Header */
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          border-radius: 16px;
          background: rgba(21, 24, 33, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 24px;
        }
        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #e50914;
          background: rgba(229, 9, 20, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .admin-title-box h1 {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 4px;
        }
        .admin-desc {
          font-size: 13px;
          color: #9ca3af;
        }
        .admin-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-nav-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e5e7eb;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-nav-action:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }
        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }

        /* Alert */
        .admin-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          animation: fadeIn 0.3s ease;
        }
        .admin-alert.success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        .admin-alert.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .alert-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .alert-view-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #fff;
          background: rgba(16, 185, 129, 0.3);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }
        .alert-close {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
          opacity: 0.7;
        }
        .alert-close:hover {
          opacity: 1;
        }

        /* Main Grid */
        .admin-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Card common */
        .admin-card {
          background: rgba(21, 24, 33, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .header-title h2, .header-title h3 {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .cloud-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        /* Form Controls */
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #d1d5db;
        }
        .req {
          color: #ef4444;
        }
        .form-group input, 
        .form-group select, 
        .form-group textarea {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 14px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .form-group select {
          cursor: pointer;
        }
        .form-group select option {
          background: #151821;
          color: #fff;
        }
        .form-group input:focus, 
        .form-group select:focus, 
        .form-group textarea:focus {
          border-color: #e50914;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 2px rgba(229, 9, 20, 0.2);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .form-row-three {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 600px) {
          .form-row, .form-row-three {
            grid-template-columns: 1fr;
          }
        }
        .input-with-badge {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-badge input {
          width: 100%;
          padding-right: 90px;
        }
        .input-tag {
          position: absolute;
          right: 10px;
          background: rgba(229, 9, 20, 0.18);
          color: #e50914;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid rgba(229, 9, 20, 0.3);
        }
        .field-hint {
          font-size: 12px;
          color: #9ca3af;
        }
        .btn-submit-movie {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #e50914;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          padding: 14px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(229, 9, 20, 0.35);
        }
        .btn-submit-movie:hover:not(:disabled) {
          background: #b80710;
          transform: translateY(-1px);
        }
        .btn-submit-movie:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spinner-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        /* Right Column */
        .admin-side-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Preview Card */
        .preview-card .preview-content {
          display: flex;
          gap: 16px;
        }
        .preview-poster-wrap {
          position: relative;
          width: 100px;
          aspect-ratio: 2 / 3;
          border-radius: 8px;
          overflow: hidden;
          background: #0d0f15;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          background: rgba(0, 0, 0, 0.75);
          color: #fff;
          font-size: 9px;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .preview-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .preview-title {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
        }
        .preview-id {
          font-size: 12px;
          color: #9ca3af;
        }
        .preview-id code {
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
          padding: 1px 4px;
          border-radius: 4px;
        }
        .preview-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .rating-tag {
          color: #f59e0b;
          font-weight: 600;
        }
        .preview-stream-info {
          margin-top: 6px;
          font-size: 12px;
          color: #10b981;
        }

        /* Movie List Card */
        .list-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        .search-filter-box {
          position: relative;
          flex: 1;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }
        .search-filter-box input {
          width: 100%;
          padding: 8px 10px 8px 30px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 12px;
          outline: none;
        }
        .cat-filter-select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 12px;
          padding: 0 8px;
          outline: none;
          cursor: pointer;
        }
        .movie-items-scroll {
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }
        .movie-item-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: background 0.2s;
        }
        .movie-item-row:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .item-thumb {
          width: 36px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
          background: #000;
          flex-shrink: 0;
        }
        .item-info {
          flex: 1;
          min-width: 0;
        }
        .item-title {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-sub {
          display: flex;
          gap: 6px;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .item-category {
          color: #e50914;
        }
        .item-id {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }
        .item-actions {
          display: flex;
          gap: 4px;
        }
        .btn-item-action {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-view {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }
        .btn-view:hover {
          background: rgba(59, 130, 246, 0.3);
        }
        .btn-delete {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .btn-delete:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.3);
        }
        .btn-delete:disabled {
          opacity: 0.5;
        }
        .empty-movies {
          text-align: center;
          padding: 24px;
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
