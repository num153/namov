import React, { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { AlertCircle, Server, Zap, Play, RefreshCw } from 'lucide-react';

export default function VideoPlayer({ movie, activeSourceIndex = 0, onSourceChange }) {
  const artRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isIframe, setIsIframe] = useState(false);

  const sources = movie?.streams || movie?.sources || [];
  const currentSource = sources[activeSourceIndex] || sources[0];

  useEffect(() => {
    if (!movie || !currentSource) return;

    setErrorMsg(null);

    const url = currentSource?.url || '';
    const isM3U8OrVideo = url.includes('.m3u8') || url.includes('.mp4') || currentSource?.type === 'm3u8' || currentSource?.type === 'video';

    // Only use iframe if it is NOT an m3u8 stream and matches embed patterns
    const isEmbed = !isM3U8OrVideo && (
      currentSource?.type === 'iframe' ||
      currentSource?.type === 'embed' ||
      url.includes('youtube.com') ||
      url.includes('helvid.com') ||
      url.includes('embedwish.com') ||
      url.includes('voe.sx') ||
      url.includes('/play/') ||
      url.includes('/embed/')
    );

    setIsIframe(isEmbed);

    if (isEmbed) {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) { }
        playerInstanceRef.current = null;
      }
      return;
    }

    // Initialize Artplayer safely
    if (!artRef.current) return;

    // Clean up container
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.destroy(false);
      } catch (e) { }
      playerInstanceRef.current = null;
    }
    artRef.current.innerHTML = '';

    const storageKey = `namov_resume_${movie.id}`;
    let savedTime = 0;
    try {
      savedTime = parseFloat(localStorage.getItem(storageKey) || '0');
    } catch (e) {
      savedTime = 0;
    }

    try {
      const artOptions = {
        container: artRef.current,
        url: currentSource.url,
        type: currentSource.url.includes('.m3u8') ? 'm3u8' : 'auto',
        customType: {
          m3u8: function (video, url, art) {
            if (Hls.isSupported()) {
              if (art.hls) art.hls.destroy();
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
              });
              hls.loadSource(url);
              hls.attachMedia(video);
              art.hls = hls;

              hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                  console.warn('HLS Fatal Error:', data);
                  setErrorMsg('Không thể tải luồng phát M3U8 từ nguồn này (có thể do giới hạn kết nối hoặc link hết hạn). Vui lòng chuyển sang Server khác phía dưới.');
                }
              });

              art.on('destroy', () => hls.destroy());
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            } else {
              art.notice.show = 'Trình duyệt của bạn không hỗ trợ HLS M3U8!';
            }
          },
        },
        poster: movie.banner || movie.poster,
        volume: 0.8,
        isLive: false,
        muted: false,
        autoplay: false,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: true,
        setting: true,
        loop: false,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        miniProgressBar: false, // Ẩn thanh thời gian nhỏ màu đỏ dưới đáy khi đang xem
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        airplay: true,
        theme: '#e50914',
        hotkey: true,
        subtitleOffset: true,
      };

      const hasSubtitles = movie.subtitles && movie.subtitles.length > 0 && movie.subtitles[0].src;

      // Configure subtitle if available
      if (hasSubtitles) {
        artOptions.subtitle = {
          url: movie.subtitles[0].src,
          type: 'vtt',
          style: {
            color: '#fff',
            fontSize: '18px',
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.8)',
            marginBottom: '20px',
          },
          encoding: 'utf-8',
        };
      }

      // Add Custom Controls (Tua lại 10s, Tua tới 10s, Bật/Tắt CC) for ALL movies
      artOptions.controls = [
        {
          name: 'backward-10',
          position: 'left',
          index: 10,
          html: '<span class="art-icon" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0 3px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="12" y="15.5" font-size="8" font-family="Arial, sans-serif" font-weight="900" fill="currentColor" text-anchor="middle" stroke="none">10</text></svg></span>',
          tooltip: '(Phím ←)',
          click: function () {
            if (art.currentTime) {
              art.currentTime = Math.max(0, art.currentTime - 10);
              art.notice.show = 'Tua lại 10 giây';
            }
          },
        },
        {
          name: 'forward-10',
          position: 'left',
          index: 11,
          html: '<span class="art-icon" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0 3px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="12" y="15.5" font-size="8" font-family="Arial, sans-serif" font-weight="900" fill="currentColor" text-anchor="middle" stroke="none">10</text></svg></span>',
          tooltip: '(Phím →)',
          click: function () {
            if (art.currentTime !== undefined) {
              art.currentTime = Math.min(art.duration || 999999, art.currentTime + 10);
              art.notice.show = 'Tua tới 10 giây';
            }
          },
        },
        {
          name: 'cc-toggle',
          position: 'right',
          index: 10,
          html: '<span class="art-icon art-icon-cc" style="display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:1.5px solid #888;color:#888;border-radius:3px;padding:1px 4px;cursor:pointer;line-height:1;margin:0 4px;transition:all 0.2s;">CC</span>',
          tooltip: 'Phụ đề (CC)',
          click: function (item, $element) {
            const ccIcon = $element.querySelector('.art-icon-cc') || $element;
            if (art.subtitle && hasSubtitles) {
              art.subtitle.show = !art.subtitle.show;
              const isShown = art.subtitle.show;
              if (isShown) {
                ccIcon.style.color = '#e50914';
                ccIcon.style.borderColor = '#e50914';
                art.notice.show = 'Đã BẬT phụ đề rời (VTT)';
              } else {
                ccIcon.style.color = '#888';
                ccIcon.style.borderColor = '#888';
                art.notice.show = 'Đã TẮT phụ đề rời';
              }
            } else {
              art.notice.show = 'Phim này đã có sẵn phụ đề / thuyết minh chuẩn trong video';
            }
          },
        },
      ];

      // Add CC options in Settings menu for ALL movies
      const subItems = (movie.subtitles || []).map((s, idx) => ({
        html: s.label || `Phụ đề ${idx + 1}`,
        value: s.src,
        default: false,
      }));

      artOptions.settings = [
        {
          html: 'Phụ đề (CC)',
          width: 240,
          tooltip: hasSubtitles ? 'Đang tắt' : 'Đã tích hợp trong video',
          selector: [
            {
              html: hasSubtitles ? 'Tắt phụ đề rời (Mặc định)' : 'Phụ đề có sẵn trong video',
              value: 'off',
              default: true,
            },
            ...subItems,
          ],
          onSelect: function (item) {
            const ccBtn = artRef.current?.querySelector('.art-icon-cc');
            if (item.value === 'off') {
              if (art.subtitle) art.subtitle.show = false;
              if (ccBtn) {
                ccBtn.style.color = '#888';
                ccBtn.style.borderColor = '#888';
              }
              art.notice.show = hasSubtitles ? 'Đã tắt phụ đề rời' : 'Phụ đề đã có sẵn trong video';
              return 'Tắt';
            } else {
              if (art.subtitle) {
                art.subtitle.switch(item.value, { name: item.html });
                art.subtitle.show = true;
              }
              if (ccBtn) {
                ccBtn.style.color = '#e50914';
                ccBtn.style.borderColor = '#e50914';
              }
              art.notice.show = `Đã bật: ${item.html}`;
              return item.html;
            }
          },
        },
      ];

      const art = new Artplayer(artOptions);
      playerInstanceRef.current = art;

      art.on('ready', () => {
        // Tắt phụ đề rời mặc định để tránh bị đè lên phụ đề cứng có sẵn của video
        if (art.subtitle) {
          art.subtitle.show = false;
        }

        if (savedTime > 10) {
          art.notice.show = `Tiếp tục xem từ phút ${Math.floor(savedTime / 60)}:${Math.floor(savedTime % 60).toString().padStart(2, '0')}`;
          art.currentTime = savedTime;
        }
      });

      let lastSave = 0;
      art.on('video:timeupdate', () => {
        const now = Date.now();
        if (now - lastSave > 4000) {
          lastSave = now;
          if (art.currentTime > 5 && art.currentTime < art.duration - 20) {
            localStorage.setItem(storageKey, art.currentTime.toString());
          }
        }
      });

      art.on('error', (err) => {
        console.warn('Artplayer error', err);
        setErrorMsg('Nguồn phát này hiện gặp sự cố. Bạn hãy thử chọn Server khác hoặc tải lại trang.');
      });

    } catch (err) {
      console.error('Failed to init Artplayer', err);
      setErrorMsg('Không thể khởi tạo trình phát. Hãy thử chuyển sang Server khác phía dưới.');
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy(false);
        } catch (e) { }
        playerInstanceRef.current = null;
      }
    };
  }, [movie?.id, currentSource?.url, activeSourceIndex]);

  return (
    <div className="player-wrapper">
      <div className="player-screen">
        {isIframe ? (
          <div className="iframe-container">
            <iframe
              src={currentSource?.url}
              title={movie?.title || 'Player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="player-iframe"
            />
          </div>
        ) : (
          <div ref={artRef} className="artplayer-element" />
        )}

        {errorMsg && (
          <div className="player-error-overlay glass-panel animate-fade-in">
            <AlertCircle size={32} color="#ef4444" />
            <p className="error-text">{errorMsg}</p>
            {sources.length > 1 && (
              <div className="error-actions">
                <span>Thử chọn Server khác:</span>
                {sources.map((src, idx) => (
                  <button
                    key={idx}
                    className={`btn btn-sm ${idx === activeSourceIndex ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => onSourceChange(idx)}
                  >
                    {src.server || src.name || `Server ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .player-wrapper {
          position: relative;
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          background: #000;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
          border: 1px solid var(--border-color);
        }
        .player-screen {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          max-height: min(60vh, 510px);
          background: #050608;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .artplayer-element {
          width: 100%;
          height: 100%;
        }
        .iframe-container {
          width: 100%;
          height: 100%;
        }
        .player-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .player-error-overlay {
          position: absolute;
          inset: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          border-radius: var(--radius-md);
          text-align: center;
          z-index: 20;
          background: rgba(10, 11, 14, 0.92);
        }
        .error-text {
          color: #fca5a5;
          font-size: 13.5px;
          max-width: 480px;
          line-height: 1.5;
        }
        .error-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 6px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .btn-sm {
          padding: 5px 12px;
          font-size: 12px;
        }

        @media (max-width: 600px) {
          .player-wrapper {
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}
