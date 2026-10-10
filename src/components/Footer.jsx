import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Sparkles, Shield, PlayCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="container footer-content">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <Film size={20} />
              </div>
              <span>NAM.OV</span>
            </Link>
            <p className="footer-desc">
              Trang web xem phim trực tuyến phi lợi nhuận với tuyển tập phim Châu Tinh Trì kinh điển, điện ảnh Hollywood và anime chất lượng cao hỗ trợ giao thức stream M3U8 siêu mượt.
            </p>
            <div className="footer-badge">
              <Sparkles size={14} />
              <span>Hỗ trợ HLS M3U8 Native Player</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="footer-column">
            <h4>Danh Mục</h4>
            <ul>
              <li><Link to="/?cat=chautinhtri">Châu Tinh Trì Tuyển Tập</Link></li>
              <li><Link to="/?cat=dienanh">Điện Ảnh Chiếu Rạp</Link></li>
              <li><Link to="/?cat=hoathinh">Anime & Hoạt Hình</Link></li>
              <li><Link to="/?m3u8=true">Phim Stream VIP M3U8</Link></li>
              <li><Link to="/collection">Phim Yêu Thích Của Tôi</Link></li>
            </ul>
          </div>

          {/* Series & Special */}
          <div className="footer-column">
            <h4>Tuyển Tập Nổi Bật</h4>
            <ul>
              <li><Link to="/watch/chautinhtri-vuahaikich">Vua Hài Kịch (1999)</Link></li>
              <li><Link to="/watch/dienanh-batman">The Dark Knight Rises</Link></li>
              <li><Link to="/watch/dienanh-spiderman1">Spider-Man Series</Link></li>
              <li><Link to="/watch/chautinhtri-tuyetdinhkungfu">Tuyệt Đỉnh Kungfu</Link></li>
              <li><Link to="/watch/hoathinh-coco">Coco (2017)</Link></li>
            </ul>
          </div>

          {/* About & Disclaimer */}
          <div className="footer-column">
            <h4>Thông Tin</h4>
            <ul>
              <li><Link to="/about">Về Dự Án NAM.OV</Link></li>
              <li><a href="#disclaimer">Miễn Trừ Trách Nhiệm</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer">Mã Nguồn Mở</a></li>
            </ul>
            <p className="disclaimer-note">
              Trang web phục vụ mục đích học tập phi thương mại. Mọi tư liệu media được tổng hợp từ nguồn mở trên internet.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} NAM.OV. All rights reserved.</p>
          <div className="credits">
            <span>Thiết kế & Phát triển bởi <strong>Nam Phương</strong></span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-section {
          background: #0d0f14;
          border-top: 1px solid var(--border-color);
          padding: 60px 0 30px 0;
          margin-top: 60px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 16px;
        }
        .footer-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--accent-red);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .footer-desc {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(229, 9, 20, 0.1);
          color: #ff6b6b;
          border: 1px solid rgba(229, 9, 20, 0.2);
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
        }
        .footer-column h4 {
          font-size: 15px;
          color: #fff;
          margin-bottom: 18px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer-column ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-column a {
          color: var(--text-secondary);
          font-size: 13px;
          transition: color 0.2s;
        }
        .footer-column a:hover {
          color: #fff;
        }
        .disclaimer-note {
          color: var(--text-muted);
          font-size: 12px;
          margin-top: 14px;
          line-height: 1.5;
        }
        .footer-bottom {
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-muted);
          flex-wrap: wrap;
          gap: 12px;
        }
        .credits strong {
          color: #e5e7eb;
        }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
