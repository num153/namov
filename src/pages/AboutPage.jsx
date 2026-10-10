import React, { useState, useEffect } from 'react';
import { Film, Sparkles, Server, Zap, Shield, Heart, Code2, Play, Users, Image as ImageIcon, X } from 'lucide-react';

export default function AboutPage() {
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    document.title = 'Giới Thiệu & Bộ Sưu Tập - NAM.OV';
    window.scrollTo(0, 0);
  }, []);

  const galleryImages = [
    { src: '/about/images/pic1.webp', title: 'Son Gohan SSJ2' },
    { src: '/about/images/pic2.webp', title: 'Anime Wallpaper' },
    { src: '/about/images/pic3.webp', title: 'Dragon Ball Z' },
    { src: '/about/images/pic4.webp', title: 'Cinematic Artwork' },
    { src: '/about/images/pic5.webp', title: 'Epic Visual' },
    { src: '/about/images/pic6.webp', title: 'Top Tier Anime' },
    { src: '/about/images/pic7.webp', title: 'Hero Collection' },
    { src: '/about/images/pic8.webp', title: 'Visual Aesthetic' },
    { src: '/about/images/pic9.webp', title: 'Iconic Moment' },
    { src: '/about/images/pic10.webp', title: 'Masterpiece Art' },
  ];

  return (
    <div className="about-page animate-fade-in">
      <div className="container about-container">
        {/* Header Hero with Avatar */}
        <div className="about-hero glass-panel">
          <div className="avatar-wrapper">
            <img src="/about/images/avt.jpg" alt="Avatar" className="user-avatar" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="avatar-badge">
              <Sparkles size={14} color="#f59e0b" />
            </div>
          </div>

          <div className="about-tag">
            <Sparkles size={14} />
            <span>NAM.OV Project v2.0</span>
          </div>

          <h1 className="about-title">Nền Tảng Xem Phim Cá Nhân</h1>
          
          <p className="about-lead">
            Dự án website xem phim trực tuyến được xây dựng từ năm 2024, dành riêng để lưu trữ và thưởng thức những tác phẩm điện ảnh kinh điển, trọn bộ phim Châu Tinh Trì hài hước và Anime tuyển chọn với chất lượng cao nhất.
          </p>
        </div>

        {/* Gallery Section: Gohan & Top Tier Wallpapers */}
        <div className="gallery-section">
          <div className="gallery-header">
            <div className="gallery-title-box">
              <ImageIcon size={20} color="var(--accent-red)" />
              <h2>Top Tier Wallpapers & Anime Art</h2>
            </div>
            <p className="gallery-desc">Bộ sưu tập hình ảnh Gohan và Anime Artwork yêu thích được lưu giữ trong dự án.</p>
          </div>

          <div className="gallery-grid">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                className="gallery-item"
                onClick={() => setSelectedImg(img.src)}
              >
                <img
                  src={img.src}
                  alt={img.title}
                  className="gallery-img"
                  loading="lazy"
                />
                <div className="gallery-overlay">
                  <span>{img.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight Tech Specs */}
        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-icon-box" style={{ background: 'rgba(229, 9, 20, 0.15)', color: 'var(--accent-red)' }}>
              <Zap size={22} />
            </div>
            <h3>HLS M3U8 Native Stream</h3>
            <p>Phát video trực tiếp thông qua giao thức phân mảnh HTTP Live Streaming (M3U8), tải cực nhanh và hỗ trợ tua mượt mà.</p>
          </div>

          <div className="tech-card">
            <div className="tech-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
              <Code2 size={22} />
            </div>
            <h3>Kiến Trúc Tối Giản SPA</h3>
            <p>Tái cấu trúc từ hơn 20+ file HTML tĩnh sang Vite + React với hệ thống dữ liệu tập trung và Artplayer hiện đại.</p>
          </div>

          <div className="tech-card">
            <div className="tech-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Server size={22} />
            </div>
            <h3>Multi-Source Fallback</h3>
            <p>Hỗ trợ đa máy chủ phát: Server M3U8 VIP tốc độ cao, Server Embed dự phòng và tích hợp nguồn API mở rộng.</p>
          </div>
        </div>

        {/* Story & Credits Section */}
        <div className="credits-section glass-panel">
          <h2 className="credits-title">
            <Heart size={18} color="var(--accent-red)" /> Về Dự Án NAM.OV
          </h2>
          <div className="credits-content">
            <p>
              Dự án website xem phim trực tuyến cá nhân do <strong>Nam Phương</strong> phát triển và thiết kế, tập trung vào trải nghiệm mượt mà, tối giản và phát trực tiếp qua luồng HLS M3U8 chất lượng cao.
            </p>
            <p>
              Phiên bản 2.0 đã được tái cấu trúc hoàn toàn sang Single Page Application (Vite + React), tổng hợp hơn 120+ phim điện ảnh, anime và trọn bộ phim Châu Tinh Trì kinh điển.
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImg && (
        <div className="lightbox-modal" onClick={() => setSelectedImg(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImg(null)}>
              <X size={24} />
            </button>
            <img src={selectedImg} alt="Preview" className="lightbox-image" />
          </div>
        </div>
      )}

      <style>{`
        .about-page {
          padding-top: 20px;
          padding-bottom: 60px;
        }
        .about-hero {
          padding: 36px 24px;
          border-radius: var(--radius-lg);
          margin-bottom: 36px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .avatar-wrapper {
          position: relative;
          width: 84px;
          height: 84px;
          margin-bottom: 16px;
        }
        .user-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent-red);
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4);
        }
        .avatar-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #181b24;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .about-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(229, 9, 20, 0.15);
          color: #ff6b6b;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .about-title {
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 800;
          margin-bottom: 12px;
        }
        .about-lead {
          color: var(--text-secondary);
          font-size: 14.5px;
          max-width: 680px;
          line-height: 1.65;
        }

        /* Gallery */
        .gallery-section {
          margin-bottom: 36px;
        }
        .gallery-header {
          margin-bottom: 18px;
        }
        .gallery-title-box {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .gallery-title-box h2 {
          font-size: 18px;
          font-weight: 700;
        }
        .gallery-desc {
          font-size: 13px;
          color: var(--text-muted);
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        .gallery-item {
          position: relative;
          aspect-ratio: 16 / 10;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #151821;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .gallery-item:hover .gallery-img {
          transform: scale(1.05);
        }
        .gallery-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%);
          display: flex;
          align-items: flex-end;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          opacity: 0.9;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 36px;
        }
        .tech-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 22px;
        }
        .tech-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .tech-card h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .tech-card p {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.55;
        }
        .credits-section {
          padding: 24px;
          border-radius: var(--radius-lg);
        }
        .credits-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          margin-bottom: 12px;
        }
        .credits-content p {
          color: var(--text-secondary);
          font-size: 13.5px;
          line-height: 1.65;
          margin-bottom: 8px;
        }
        .credits-content strong {
          color: #fff;
        }

        /* Lightbox */
        .lightbox-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }
        .lightbox-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
        }
        .lightbox-image {
          max-width: 90vw;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        }

        @media (max-width: 600px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .about-hero {
            padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  );
}
