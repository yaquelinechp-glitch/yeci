import { useState, useEffect, useRef, forwardRef, useImperativeHandle, type CSSProperties } from 'react';
import { getVideoType, parseYouTube, parseVimeo, type VideoType } from '../lib/videoSource';

declare global { interface Window { YT: any; onYouTubeIframeAPIReady?: () => void } }

const YT_IFRAME_API = 'https://www.youtube.com/iframe_api';

function ensureYTScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return; }
    if (document.getElementById('yt-iframe-api')) {
      const poll = setInterval(() => { if (window.YT && window.YT.Player) { clearInterval(poll); resolve(); } }, 50);
      return;
    }
    const orig = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { orig?.(); resolve(); };
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api';
    tag.src = YT_IFRAME_API;
    document.head.appendChild(tag);
  });
}

export interface VideoPlayerHandle {
  getCurrentTime: () => number;
  getDuration: () => number;
  pause: () => void;
  play: () => void;
  seekTo: (t: number) => void;
  isReady: () => boolean;
}

interface Props {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  preload?: string;
  onTimeTick?: (t: number) => void;
  onDuration?: (d: number) => void;
  onPlayerReady?: (h: VideoPlayerHandle) => void;
  style?: CSSProperties;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  { src, className = 'w-full h-full', controls = true, autoPlay = false, preload, onTimeTick, onDuration, onPlayerReady, style },
  ref,
) {
  const [type, setType] = useState<VideoType>('direct');
  const [ytId, setYtId] = useState<string | null>(null);
  const [ytStart, setYtStart] = useState<number | undefined>(undefined);
  const [vimeoId, setVimeoId] = useState<string | null>(null);

  const videoElRef = useRef<HTMLVideoElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const yt = parseYouTube(src);
    if (yt) { setType('youtube'); setYtId(yt.id); setYtStart(yt.start); return; }
    const vm = parseVimeo(src);
    if (vm) { setType('vimeo'); setVimeoId(vm); return; }
    setType('direct');
  }, [src]);

  const isYouTube = type === 'youtube';
  const isDirect = type === 'direct';

  const handle: VideoPlayerHandle = {
    getCurrentTime: () => {
      if (isYouTube && ytPlayerRef.current?.getCurrentTime) return ytPlayerRef.current.getCurrentTime();
      return videoElRef.current?.currentTime ?? 0;
    },
    getDuration: () => {
      if (isYouTube && ytPlayerRef.current?.getDuration) return ytPlayerRef.current.getDuration();
      return videoElRef.current?.duration ?? 0;
    },
    pause: () => {
      if (isYouTube && ytPlayerRef.current?.pauseVideo) { ytPlayerRef.current.pauseVideo(); return; }
      videoElRef.current?.pause();
    },
    play: () => {
      if (isYouTube && ytPlayerRef.current?.playVideo) { ytPlayerRef.current.playVideo(); return; }
      videoElRef.current?.play();
    },
    seekTo: (t) => {
      if (isYouTube && ytPlayerRef.current?.seekTo) { ytPlayerRef.current.seekTo(t, true); return; }
      if (videoElRef.current) { videoElRef.current.currentTime = t; }
    },
    isReady: () => isYouTube ? ytReadyRef.current : true,
  };

  useImperativeHandle(ref, () => handle, [isYouTube, ytId]);

  useEffect(() => {
    if (!onPlayerReady) return;
    if (isYouTube && ytReadyRef.current) onPlayerReady(handle);
    else if (isDirect) onPlayerReady(handle);
  }, [isYouTube, isDirect]);

  useEffect(() => {
    if (!isYouTube || !ytId || !ytContainerRef.current) return;
    let cancelled = false;
    const init = async () => {
      await ensureYTScript();
      if (cancelled || !window.YT?.Player || !ytContainerRef.current) return;
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: ytId,
        playerVars: { controls: controls ? 1 : 0, playsinline: 1, rel: 0, autoplay: autoPlay ? 1 : 0, start: ytStart ?? 0 },
        events: {
          onReady: () => {
            if (cancelled) return;
            ytReadyRef.current = true;
            const d = ytPlayerRef.current.getDuration?.() ?? 0;
            if (d > 0) onDuration?.(d);
            onPlayerReady?.(handle);
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            const d = ytPlayerRef.current?.getDuration?.() ?? 0;
            if (d > 0 && e.data === 1) onDuration?.(d);
          },
        },
      });
    };
    init();
    return () => { cancelled = true; };
  }, [isYouTube, ytId, controls, autoPlay, ytStart]);

  useEffect(() => {
    if (!onTimeTick || isDirect) return;
    tickRef.current = window.setInterval(() => { onTimeTick(handle.getCurrentTime()); }, 250);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [onTimeTick, isDirect, isYouTube]);

  if (isYouTube && ytId) {
    return <div ref={ytContainerRef} className={className} style={style} />;
  }

  if (type === 'vimeo' && vimeoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?h=0&autoplay=${autoPlay ? 1 : 0}`}
        className={className}
        style={style}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      ref={videoElRef}
      className={className}
      style={style}
      controls={controls}
      autoPlay={autoPlay}
      preload={preload ?? 'metadata'}
      onTimeUpdate={(e) => {
        const t = e.currentTarget.currentTime;
        onTimeTick?.(t);
        if (onDuration && e.currentTarget.duration) onDuration(e.currentTarget.duration);
      }}
    >
      <source src={src} />
    </video>
  );
});

export function VideoThumb({ src, className = 'w-full h-full object-cover' }: { src: string; className?: string }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const yt = parseYouTube(src);
  const vm = parseVimeo(src);

  useEffect(() => {
    if (yt) setThumb(`https://img.youtube.com/vi/${yt.id}/hqdefault.jpg`);
    else if (vm) setThumb(`https://i.vimeocdn.com/video/${vm}_640.jpg`);
    else setThumb(null);
  }, [src]);

  if (thumb) return <img src={thumb} alt="" className={className} />;
  return (
    <video className={className} preload="metadata" muted>
      <source src={src} />
    </video>
  );
}

export default VideoPlayer;
