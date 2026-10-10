import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      className="back-to-top-btn animate-fade-in"
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      title="Lên đầu trang"
    >
      <ArrowUp size={20} />
      <style>{`
        .back-to-top-btn {
          position: fixed;
          bottom: 24px;
          right: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(229, 9, 20, 0.9);
          backdrop-filter: blur(8px);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 990;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .back-to-top-btn:hover {
          background: var(--accent-red-hover);
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 24px rgba(229, 9, 20, 0.5);
        }
        .back-to-top-btn:active {
          transform: scale(0.92);
        }

        @media (max-width: 600px) {
          .back-to-top-btn {
            bottom: 20px;
            right: 16px;
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </button>
  );
}
