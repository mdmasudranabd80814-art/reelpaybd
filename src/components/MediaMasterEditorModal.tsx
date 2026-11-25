import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Check,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Type,
  Scissors,
  Volume2,
  VolumeX,
  Music,
  Trash2,
  Plus,
  Eye,
  Film,
  Layers,
  Upload,
  Loader2,
  Mic,
  Square,
  FastForward,
  Rewind,
  MessageSquare,
  Smile,
  Palette,
  CheckCircle2,
  Sparkle,
} from 'lucide-react';
import {
  ASPECT_RATIO_DIMENSIONS,
  AspectRatioOption,
  BG_GRADIENTS,
  BG_SOLID_COLORS,
  BackgroundMode,
  COLOR_PRESETS,
  ImageMotionPreset,
  MediaEditConfig,
  PRESET_MUSIC_LIBRARY,
  BENGALI_VOICE_CLIPS,
  STICKER_PACK,
  StickerOverlayItem,
  TextOverlayItem,
  VFX_EFFECTS,
  buildCssFilterString,
  createDefaultEditConfig,
  exportCanvasThumbnail,
  exportEditedImage,
  exportEditedVideo,
  exportImageAsVideo,
  renderEditedFrame,
} from '../utils/mediaEditorEngine';
import { extractYouTubeId } from '../utils/video';
import { WatermarkConfigurator } from './WatermarkConfigurator';

export interface MasterEditorResult {
  mediaType: 'video' | 'image';
  editedFile?: File;
  editedPreviewUrl?: string;
  thumbnailDataUrl: string;
  cssFilter: string;
  config: MediaEditConfig;
  isRenderedVideo: boolean;
}

interface MediaMasterEditorModalProps {
  isOpen: boolean;
  mediaType: 'video' | 'image';
  sourceUrl: string;
  sourceFile?: File | null;
  initialConfig?: MediaEditConfig;
  lang: 'bn' | 'en';
  onClose: () => void;
  onApplyEdit: (result: MasterEditorResult) => void;
}

export type StudioTab = 'trim' | 'filter' | 'effects' | 'music' | 'voice' | 'overlay' | 'background';

const TEXT_COLORS = ['#ffffff', '#000000', '#10b981', '#fbbf24', '#f43f5e', '#38bdf8', '#a855f7', '#ec4899'];
const TEXT_BG_COLORS = ['transparent', 'rgba(0,0,0,0.78)', '#059669', '#e11d48', '#f59e0b', '#1e293b', '#ffffff'];
const CHROMA_PRESETS = [
  { label: 'Green', color: '#00d800' },
  { label: 'Blue', color: '#0044ff' },
  { label: 'Black', color: '#080808' },
  { label: 'White', color: '#f5f5f5' },
];

function formatTimeSec(sec: number): string {
  const s = Math.max(0, sec || 0);
  const mins = Math.floor(s / 60);
  const rem = (s % 60).toFixed(1).padStart(4, '0');
  return `${String(mins).padStart(2, '0')}:${rem}`;
}

function playEditorSfx(type: 'applause' | 'laugh' | 'bell' | 'coin' | 'whoosh') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    if (type === 'coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'bell') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'laugh') {
      [600, 750, 900].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.18, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.085);
      });
    } else if (type === 'whoosh') {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.25);
    } else if (type === 'applause') {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.5);
    }
  } catch {}
}

export const MediaMasterEditorModal: React.FC<MediaMasterEditorModalProps> = ({
  isOpen,
  mediaType,
  sourceUrl,
  sourceFile,
  initialConfig,
  lang,
  onClose,
  onApplyEdit,
}) => {
  const [config, setConfig] = useState<MediaEditConfig>(() => initialConfig || createDefaultEditConfig());
  const [activeTab, setActiveTab] = useState<StudioTab>(mediaType === 'video' ? 'trim' : 'filter');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isComparingRaw, setIsComparingRaw] = useState(false);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [newTextDraft, setNewTextDraft] = useState('');
  const [exportPhotoAsVideo, setExportPhotoAsVideo] = useState(false);
  const [photoVideoDuration, setPhotoVideoDuration] = useState(6);

  // Audio / Music / Voiceover preview states
  const [previewingAudioUrl, setPreviewingAudioUrl] = useState<string | null>(null);
  const activePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Live Microphone Voiceover Recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordSec, setVoiceRecordSec] = useState(0);
  const [voiceRecordError, setVoiceRecordError] = useState<string | null>(null);
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<BlobPart[]>([]);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Speech-to-Text state ("কথা শুনেও সাবটাইটেল")
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const speechRecognitionRef = useRef<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Rendering / export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [corsRestricted, setCorsRestricted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgAudioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const voiceoverPreviewRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const draggingRef = useRef<{ id: string; kind: 'text' | 'sticker' } | null>(null);
  const animStartRef = useRef<number>(performance.now());

  const bgImgInputRef = useRef<HTMLInputElement>(null);
  const bgAudioInputRef = useRef<HTMLInputElement>(null);

  const isExternalYouTube = Boolean(extractYouTubeId(sourceUrl));
  const isLocalMedia = Boolean(sourceFile || sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:'));

  // Load media element when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setExportError(null);
    setCorsRestricted(false);

    if (mediaType === 'image') {
      const img = new Image();
      if (!sourceUrl.startsWith('blob:') && !sourceUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        imageRef.current = img;
      };
      img.onerror = () => {
        setCorsRestricted(true);
      };
      img.src = sourceUrl;
      videoRef.current = null;
      return;
    }

    if (isExternalYouTube) {
      setCorsRestricted(true);
      return;
    }

    const vid = document.createElement('video');
    if (!sourceUrl.startsWith('blob:') && !sourceUrl.startsWith('data:')) {
      vid.crossOrigin = 'anonymous';
    }
    vid.playsInline = true;
    vid.loop = true;
    vid.preload = 'auto';
    vid.src = sourceUrl;

    vid.onloadedmetadata = () => {
      const dur = Number.isFinite(vid.duration) ? vid.duration : 15;
      setDuration(dur);
      setConfig((prev) => ({
        ...prev,
        trimEnd: prev.trimEnd > 0 && prev.trimEnd <= dur ? prev.trimEnd : dur,
      }));
    };
    vid.onloadeddata = () => {
      videoRef.current = vid;
      if (isPlaying) {
        vid.play().catch(() => {});
      }
    };
    vid.onerror = () => {
      setCorsRestricted(true);
    };

    return () => {
      vid.pause();
      vid.src = '';
      videoRef.current = null;
    };
  }, [isOpen, mediaType, sourceUrl, isExternalYouTube]);

  // Load custom background image when changed
  useEffect(() => {
    if (!config.backgroundImageUrl) {
      bgImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      bgImageRef.current = img;
    };
    img.src = config.backgroundImageUrl;
  }, [config.backgroundImageUrl]);

  // Sync video playback controls (play/pause, volume, playbackRate, trim loop)
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || mediaType !== 'video') return;
    vid.playbackRate = config.playbackRate || 1;
    vid.volume = Math.max(0, Math.min(1, config.originalVolume));
    vid.muted = config.originalVolume === 0;
  }, [config.playbackRate, config.originalVolume, mediaType]);

  // Sync background audio preview
  useEffect(() => {
    if (!isOpen || !config.bgAudioUrl) {
      if (bgAudioPreviewRef.current) {
        bgAudioPreviewRef.current.pause();
        bgAudioPreviewRef.current = null;
      }
      return;
    }
    const audio = new Audio(config.bgAudioUrl);
    audio.loop = true;
    audio.volume = config.bgAudioVolume;
    bgAudioPreviewRef.current = audio;
    if (isPlaying) {
      audio.play().catch(() => {});
    }
    return () => {
      audio.pause();
      audio.src = '';
      bgAudioPreviewRef.current = null;
    };
  }, [isOpen, config.bgAudioUrl]);

  useEffect(() => {
    if (bgAudioPreviewRef.current) {
      bgAudioPreviewRef.current.volume = config.bgAudioVolume;
      if (isPlaying && !isExporting) {
        bgAudioPreviewRef.current.play().catch(() => {});
      } else {
        bgAudioPreviewRef.current.pause();
      }
    }
  }, [config.bgAudioVolume, isPlaying, isExporting]);

  // Sync voiceover audio preview
  useEffect(() => {
    if (!isOpen || !config.voiceoverUrl) {
      if (voiceoverPreviewRef.current) {
        voiceoverPreviewRef.current.pause();
        voiceoverPreviewRef.current = null;
      }
      return;
    }
    const audio = new Audio(config.voiceoverUrl);
    audio.loop = false;
    audio.volume = config.voiceoverVolume ?? 1;
    voiceoverPreviewRef.current = audio;
    if (isPlaying) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    return () => {
      audio.pause();
      audio.src = '';
      voiceoverPreviewRef.current = null;
    };
  }, [isOpen, config.voiceoverUrl]);

  useEffect(() => {
    if (voiceoverPreviewRef.current) {
      voiceoverPreviewRef.current.volume = config.voiceoverVolume ?? 1;
      if (isPlaying && !isExporting) {
        voiceoverPreviewRef.current.play().catch(() => {});
      } else {
        voiceoverPreviewRef.current.pause();
      }
    }
  }, [config.voiceoverVolume, isPlaying, isExporting]);

  // Clean up recording or speech recognition on unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (activePreviewAudioRef.current) activePreviewAudioRef.current.pause();
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Live 30fps preview render loop
  useEffect(() => {
    if (!isOpen || corsRestricted) return;
    let rafId = 0;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dims = ASPECT_RATIO_DIMENSIONS[config.aspectRatio];
        if (canvas.width !== dims.w || canvas.height !== dims.h) {
          canvas.width = dims.w;
          canvas.height = dims.h;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const vid = videoRef.current;
          const img = imageRef.current;
          const source = mediaType === 'video' ? vid : img;

          if (vid && mediaType === 'video') {
            const trimEnd = config.trimEnd > 0 ? config.trimEnd : vid.duration || 999;
            if (isPlaying && !vid.paused) {
              if (vid.currentTime < config.trimStart || vid.currentTime >= trimEnd) {
                vid.currentTime = config.trimStart;
                if (voiceoverPreviewRef.current) {
                  voiceoverPreviewRef.current.currentTime = 0;
                  voiceoverPreviewRef.current.play().catch(() => {});
                }
              }
            }
            setCurrentTime(vid.currentTime || 0);
          }

          const effectiveConfig = isComparingRaw
            ? {
                ...createDefaultEditConfig(duration),
                aspectRatio: config.aspectRatio,
                trimStart: config.trimStart,
                trimEnd: config.trimEnd,
              }
            : config;

          const elapsedSec = (performance.now() - animStartRef.current) / 1000;
          renderEditedFrame(ctx, dims.w, dims.h, source, effectiveConfig, elapsedSec, {
            isImageSource: mediaType === 'image',
            bgImage: bgImageRef.current,
            selectedOverlayId: isComparingRaw ? null : selectedOverlayId,
          });
        }
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, corsRestricted, config, mediaType, isPlaying, isComparingRaw, selectedOverlayId, duration]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      const vid = videoRef.current;
      if (vid) {
        if (next) vid.play().catch(() => {});
        else vid.pause();
      }
      return next;
    });
  }, []);

  const updateConfig = useCallback((patch: Partial<MediaEditConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleResetAll = () => {
    setConfig(createDefaultEditConfig(duration));
    setSelectedOverlayId(null);
  };

  // Pointer drag for Text & Sticker overlays directly on Canvas
  const getNormalizedCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getNormalizedCoords(e);
    // Hit test stickers first, then texts
    for (let i = config.stickers.length - 1; i >= 0; i--) {
      const st = config.stickers[i];
      if (Math.hypot(st.x - x, st.y - y) < 0.09) {
        setSelectedOverlayId(st.id);
        draggingRef.current = { id: st.id, kind: 'sticker' };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }
    for (let i = config.texts.length - 1; i >= 0; i--) {
      const txt = config.texts[i];
      if (Math.abs(txt.x - x) < 0.22 && Math.abs(txt.y - y) < 0.08) {
        setSelectedOverlayId(txt.id);
        draggingRef.current = { id: txt.id, kind: 'text' };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }
    setSelectedOverlayId(null);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const { x, y } = getNormalizedCoords(e);
    const { id, kind } = draggingRef.current;
    if (kind === 'sticker') {
      setConfig((prev) => ({
        ...prev,
        stickers: prev.stickers.map((s) => (s.id === id ? { ...s, x, y } : s)),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((t) => (t.id === id ? { ...t, x, y } : t)),
      }));
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current) {
      draggingRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleAddText = (customText?: string) => {
    const txt = (customText || newTextDraft).trim();
    if (!txt) return;
    const id = `txt_${Date.now()}`;
    const item: TextOverlayItem = {
      id,
      text: txt,
      x: 0.5,
      y: 0.45,
      color: '#ffffff',
      bgColor: 'rgba(0,0,0,0.78)',
      fontSize: 36,
      fontWeight: 'bold',
      align: 'center',
    };
    updateConfig({ texts: [...config.texts, item] });
    setSelectedOverlayId(id);
    if (!customText) setNewTextDraft('');
  };

  const handleAddSticker = (emoji: string) => {
    const id = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const item: StickerOverlayItem = {
      id,
      emoji,
      x: 0.5,
      y: 0.35 + (config.stickers.length % 3) * 0.08,
      size: 68,
      rotation: 0,
    };
    updateConfig({ stickers: [...config.stickers, item] });
    setSelectedOverlayId(id);
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateConfig({ backgroundMode: 'image', backgroundImageUrl: url });
  };

  const handleBgAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateConfig({ bgAudioUrl: url, bgAudioName: file.name });
  };

  // Preview or pause any sound/music track in library
  const handlePreviewAudio = (url: string) => {
    if (previewingAudioUrl === url) {
      activePreviewAudioRef.current?.pause();
      setPreviewingAudioUrl(null);
      return;
    }
    if (activePreviewAudioRef.current) {
      activePreviewAudioRef.current.pause();
    }
    const aud = new Audio(url);
    aud.onended = () => setPreviewingAudioUrl(null);
    aud.onerror = () => setPreviewingAudioUrl(null);
    aud.play().catch(() => {});
    activePreviewAudioRef.current = aud;
    setPreviewingAudioUrl(url);
  };

  // Live microphone recording
  const startVoiceRecording = async () => {
    try {
      setVoiceRecordError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setVoiceRecordError(lang === 'bn' ? 'মাইক্রোফোন ডিভাইস পাওয়া যায়নি।' : 'Microphone not supported.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) voiceChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        updateConfig({
          voiceoverUrl: url,
          voiceoverName: lang === 'bn' ? '🎙️ আপনার রেকর্ড করা ভয়েস' : '🎙️ Recorded Voiceover',
          voiceoverVolume: 1,
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      voiceMediaRecorderRef.current = mr;
      setIsRecordingVoice(true);
      setVoiceRecordSec(0);
      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordSec((s) => s + 1);
      }, 1000);
    } catch {
      setVoiceRecordError(lang === 'bn' ? 'মাইক্রোফোন ব্যবহারের অনুমতি দিন।' : 'Microphone permission denied.');
    }
  };

  const stopVoiceRecording = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (voiceMediaRecorderRef.current && voiceMediaRecorderRef.current.state !== 'inactive') {
      voiceMediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
  };

  // Speech-to-Text ("কথা শুনেও করেন")
  const toggleSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechError(
        lang === 'bn'
          ? 'এই ব্রাউজারে অটো ভয়েস স্পিচ সাপোর্ট নেই। নিচের জনপ্রিয় বাংলা ক্যাপশন থেকে ক্লিক করে বসাতে পারেন।'
          : 'Speech recognition not supported in this browser. You can use preset captions.'
      );
      return;
    }
    setSpeechError(null);

    if (isListeningSpeech) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
        speechRecognitionRef.current = null;
      }
      setIsListeningSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        let finalStr = '';
        for (let i = 0; i < e.results.length; i++) {
          finalStr += e.results[i][0].transcript + ' ';
        }
        setSpeechTranscript(finalStr.trim());
      };
      recognition.onerror = () => {
        setIsListeningSpeech(false);
        setSpeechError(lang === 'bn' ? 'কথা স্পষ্ট শোনা যায়নি বা মাইক অনুমতি প্রয়োজন।' : 'Speech error or no voice detected.');
      };
      recognition.onend = () => {
        setIsListeningSpeech(false);
      };
      recognition.start();
      speechRecognitionRef.current = recognition;
      setIsListeningSpeech(true);
    } catch {
      setIsListeningSpeech(false);
      setSpeechError(lang === 'bn' ? 'মাইক্রোফোন পারমিশন প্রয়োজন।' : 'Microphone permission required.');
    }
  };

  const handleAddSpeechToOverlay = () => {
    if (!speechTranscript.trim()) return;
    const id = `txt_${Date.now()}`;
    const item: TextOverlayItem = {
      id,
      text: speechTranscript.trim(),
      x: 0.5,
      y: 0.8,
      color: '#ffffff',
      bgColor: 'rgba(0,0,0,0.85)',
      fontSize: 32,
      fontWeight: 'bold',
      align: 'center',
    };
    updateConfig({ texts: [...config.texts, item] });
    setSelectedOverlayId(id);
    setSpeechTranscript('');
    setActiveTab('overlay');
  };

  const selectedText = config.texts.find((t) => t.id === selectedOverlayId) || null;
  const selectedSticker = config.stickers.find((s) => s.id === selectedOverlayId) || null;

  const hasCanvasOnlyEdits = Boolean(
    config.backgroundMode !== 'blur' ||
      config.aspectRatio !== '9:16' ||
      config.fitMode !== 'cover' ||
      config.scale !== 1 ||
      config.borderRadius > 0 ||
      config.frameBorderWidth > 0 ||
      config.chromaKeyEnabled ||
      config.rotation !== 0 ||
      config.flipH ||
      config.flipV ||
      config.vfxEffect !== 'none' ||
      config.texts.length > 0 ||
      config.stickers.length > 0 ||
      config.trimStart > 0.2 ||
      (duration > 0 && config.trimEnd > 0 && config.trimEnd < duration - 0.3) ||
      config.playbackRate !== 1 ||
      config.originalVolume !== 1 ||
      config.bgAudioUrl ||
      config.voiceoverUrl ||
      config.warmth !== 0 ||
      config.fade > 0 ||
      config.vignette > 0
  );

  const handleApplyAndSave = async (quickFilterOnly = false) => {
    setExportError(null);
    const cssFilter = buildCssFilterString(config);

    // Stop background preview audios
    if (activePreviewAudioRef.current) activePreviewAudioRef.current.pause();

    // Case 1: External video or explicit Quick Save
    if (corsRestricted || (quickFilterOnly && mediaType === 'video')) {
      let thumb = '';
      if (videoRef.current && !corsRestricted) {
        try {
          thumb = await exportCanvasThumbnail(videoRef.current, config, false, bgImageRef.current);
        } catch {}
      }
      onApplyEdit({
        mediaType,
        thumbnailDataUrl: thumb,
        cssFilter,
        config,
        isRenderedVideo: false,
      });
      return;
    }

    // Case 2: Image editing
    if (mediaType === 'image') {
      const img = imageRef.current;
      if (!img) {
        setExportError(lang === 'bn' ? 'ছবিটি লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন।' : 'Image is still loading.');
        return;
      }

      if (!exportPhotoAsVideo) {
        try {
          setIsExporting(true);
          setExportProgress(60);
          const exported = await exportEditedImage(img, config, bgImageRef.current);
          setExportProgress(100);
          onApplyEdit({
            mediaType: 'image',
            editedFile: exported.file,
            editedPreviewUrl: exported.dataUrl,
            thumbnailDataUrl: exported.dataUrl,
            cssFilter: 'none',
            config,
            isRenderedVideo: false,
          });
        } catch (err) {
          console.error(err);
          setExportError(lang === 'bn' ? 'ছবি সেভ করতে সমস্যা হয়েছে।' : 'Failed to export edited image.');
        } finally {
          setIsExporting(false);
        }
        return;
      }

      // Image -> Animated Video Reel export
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsExporting(true);
      setExportProgress(0);
      try {
        const res = await exportImageAsVideo(
          img,
          config,
          photoVideoDuration,
          (pct) => setExportProgress(pct),
          controller.signal,
          bgImageRef.current
        );
        const previewUrl = URL.createObjectURL(res.blob);
        onApplyEdit({
          mediaType: 'video',
          editedFile: res.file,
          editedPreviewUrl: previewUrl,
          thumbnailDataUrl: res.thumbnailDataUrl,
          cssFilter: 'none',
          config,
          isRenderedVideo: true,
        });
      } catch (err) {
        if ((err as Error).message !== 'Render cancelled') {
          setExportError(
            lang === 'bn'
              ? 'অ্যানিমেটেড ভিডিও তৈরি করা যায়নি। ফটো রিল হিসেবে সেভ করুন।'
              : 'Video render failed. Try saving as Photo Reel.'
          );
        }
      } finally {
        setIsExporting(false);
      }
      return;
    }

    // Case 3: Video editing
    if (!hasCanvasOnlyEdits && !isLocalMedia) {
      let thumb = '';
      if (videoRef.current) {
        try {
          thumb = await exportCanvasThumbnail(videoRef.current, config, false, bgImageRef.current);
        } catch {}
      }
      onApplyEdit({
        mediaType: 'video',
        thumbnailDataUrl: thumb,
        cssFilter,
        config,
        isRenderedVideo: false,
      });
      return;
    }

    // Full Master Video Render
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsExporting(true);
    setExportProgress(0);
    if (videoRef.current) videoRef.current.pause();
    if (bgAudioPreviewRef.current) bgAudioPreviewRef.current.pause();
    if (voiceoverPreviewRef.current) voiceoverPreviewRef.current.pause();

    try {
      const res = await exportEditedVideo(
        sourceUrl,
        config,
        (pct) => setExportProgress(pct),
        controller.signal,
        bgImageRef.current
      );
      const previewUrl = URL.createObjectURL(res.blob);
      onApplyEdit({
        mediaType: 'video',
        editedFile: res.file,
        editedPreviewUrl: previewUrl,
        thumbnailDataUrl: res.thumbnailDataUrl,
        cssFilter: 'none',
        config,
        isRenderedVideo: true,
      });
    } catch (err) {
      if ((err as Error).message !== 'Render cancelled') {
        console.error('Master video render failed:', err);
        setExportError(
          lang === 'bn'
            ? 'ভিডিও রেন্ডারিং সম্পন্ন করা যায়নি। "দ্রুত ফিল্টার সেভ" ব্যবহার করে দেখতে পারেন।'
            : 'Video rendering failed. You can try Quick Filter Save.'
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const studioTabs: Array<{ id: StudioTab; labelBn: string; labelEn: string; icon: React.ReactNode }> = [
    { id: 'trim', labelBn: mediaType === 'video' ? 'কাট/স্পিড' : 'মোশন', labelEn: mediaType === 'video' ? 'Cut/Speed' : 'Motion', icon: <Scissors className="w-4 h-4" /> },
    { id: 'filter', labelBn: 'ফিল্টার', labelEn: 'Filters', icon: <Sliders className="w-4 h-4" /> },
    { id: 'effects', labelBn: 'ইফেক্ট', labelEn: 'Effects', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'music', labelBn: 'গান/সাউন্ড', labelEn: 'Music', icon: <Music className="w-4 h-4" /> },
    { id: 'voice', labelBn: 'ভয়েস/কথা', labelEn: 'Voice/Mic', icon: <Mic className="w-4 h-4" /> },
    { id: 'overlay', labelBn: 'টেক্সট/স্টিকার', labelEn: 'Text/Sticker', icon: <Type className="w-4 h-4" /> },
    { id: 'background', labelBn: 'ক্যানভাস', labelEn: 'Canvas', icon: <Layers className="w-4 h-4" /> },
  ];

  const trimEndEffective = config.trimEnd > 0 ? config.trimEnd : duration;

  return (
    <div className="fixed inset-0 z-[70] bg-[#070c09] text-white flex flex-col overflow-hidden select-none">
      {/* Top Studio Bar */}
      <header className="h-14 px-3 sm:px-5 border-b border-white/10 bg-[#0b130f] flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isExporting}
          className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">{lang === 'bn' ? 'বাতিল' : 'Cancel'}</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Film className="w-4 h-4 text-emerald-400 shrink-0" />
          <h2 className="text-xs sm:text-base font-bold tracking-tight truncate">
            {lang === 'bn' ? 'প্রো মিডিয়া মাস্টার স্টুডিও' : 'Pro Media Master Studio'}
          </h2>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden xs:inline">
            A-to-Z PRO
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={isExporting}
            title={lang === 'bn' ? 'সব রিসেট করুন' : 'Reset all edits'}
            className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleApplyAndSave(false)}
            disabled={isExporting}
            className="min-h-[44px] px-4 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{lang === 'bn' ? 'সেভ ও প্রয়োগ' : 'Save & Apply'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Mobile Stack / Desktop 2-Pane Workstation */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left/Top: Preview Stage */}
        <div className="relative flex-1 bg-[#050907] flex flex-col items-center justify-center p-3 sm:p-5 min-h-0 overflow-hidden">
          {corsRestricted ? (
            <div className="w-full max-w-sm flex flex-col items-center gap-3">
              <div className="relative w-full aspect-[9/16] max-h-[42vh] lg:max-h-[65vh] rounded-2xl overflow-hidden border border-white/10 bg-black">
                {isExternalYouTube ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(sourceUrl)}?autoplay=1&mute=1&controls=1`}
                    title="YouTube Preview"
                    className="w-full h-full border-0"
                    style={{ filter: isComparingRaw ? 'none' : buildCssFilterString(config) }}
                  />
                ) : mediaType === 'image' ? (
                  <img
                    src={sourceUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{ filter: isComparingRaw ? 'none' : buildCssFilterString(config) }}
                  />
                ) : (
                  <video
                    src={sourceUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    style={{ filter: isComparingRaw ? 'none' : buildCssFilterString(config) }}
                  />
                )}
              </div>
              <p className="text-[11px] text-amber-300 text-center max-w-xs">
                {lang === 'bn'
                  ? 'বাহ্যিক লিংকের ভিডিওতে কালার ফিল্টার সরাসরি কাজ করবে। সম্পূর্ণ ব্যাকগ্রাউন্ড ও অডিও মিক্সিং এর জন্য ডিভাইস থেকে ফাইল বাছুন।'
                  : 'External link supports color grading. Upload a local file for full VFX, voiceover, and multi-track audio.'}
              </p>
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-full h-full min-h-0">
              <canvas
                ref={canvasRef}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10 touch-none cursor-grab active:cursor-grabbing bg-black"
                style={{ aspectRatio: config.aspectRatio.replace(':', '/') }}
              />

              {/* Floating Compare (Before/After) Button */}
              <button
                type="button"
                onPointerDown={() => setIsComparingRaw(true)}
                onPointerUp={() => setIsComparingRaw(false)}
                onPointerLeave={() => setIsComparingRaw(false)}
                className="absolute top-2 right-2 min-h-[40px] px-3 rounded-xl bg-black/75 hover:bg-black/95 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-lg"
                title={lang === 'bn' ? 'আসল ভিডিও দেখতে চেপে ধরুন' : 'Hold to compare original'}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isComparingRaw ? (lang === 'bn' ? 'আসল' : 'Original') : (lang === 'bn' ? 'তুলনা' : 'Compare')}</span>
              </button>

              {/* Active Sound / Voiceover Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                {config.bgAudioUrl && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/35 flex items-center gap-1">
                    <Music className="w-3 h-3 text-emerald-400" />
                    <span className="max-w-[110px] truncate">{config.bgAudioName || 'Song'}</span>
                  </span>
                )}
                {config.voiceoverUrl && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-400/35 flex items-center gap-1">
                    <Mic className="w-3 h-3 text-cyan-300" />
                    <span>{lang === 'bn' ? 'ভয়েস যুক্ত' : 'Voiceover'}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Transport Bar (Play/Pause + Scrubber + Skip) */}
          {!corsRestricted && (
            <div className="w-full max-w-md mt-2 flex items-center gap-2 px-2 shrink-0">
              {mediaType === 'video' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
                    title="-5s"
                  >
                    <Rewind className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="min-w-[40px] min-h-[40px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center cursor-pointer shrink-0 shadow-md"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
                    title="+5s"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(0.5, duration)}
                    step={0.05}
                    value={currentTime}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value);
                      setCurrentTime(t);
                      if (videoRef.current) videoRef.current.currentTime = t;
                    }}
                    className="flex-1 accent-emerald-400 h-1.5 cursor-pointer"
                  />

                  <span className="text-[11px] font-mono tabular-nums text-slate-300 shrink-0">
                    {formatTimeSec(currentTime)} / {formatTimeSec(duration)}
                  </span>
                </>
              )}

              {mediaType === 'image' && (
                <div className="w-full flex items-center justify-between text-xs text-slate-400">
                  <span>{lang === 'bn' ? 'ক্যানভাসে টেক্সট বা স্টিকার টেনে বসান' : 'Drag text or stickers on canvas'}</span>
                  <span className="tabular-nums text-emerald-400 font-semibold">{config.aspectRatio}</span>
                </div>
              )}
            </div>
          )}

          {exportError && (
            <div className="mt-2 px-3 py-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 max-w-md">
              <span className="flex-1">{exportError}</span>
              {mediaType === 'video' && (
                <button
                  type="button"
                  onClick={() => handleApplyAndSave(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  {lang === 'bn' ? 'দ্রুত ফিল্টার সেভ' : 'Quick Save'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right/Bottom: Studio Inspector Panel */}
        <aside className="w-full lg:w-[410px] xl:w-[450px] bg-[#0d1612] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shrink-0 max-h-[48vh] lg:max-h-none">
          {/* Active Tool Controls Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: TRIM, SPLIT, SPEED & VIDEO EDIT */}
            {activeTab === 'trim' && (
              <div className="space-y-4">
                {mediaType === 'video' ? (
                  <>
                    {/* Trim and Cut In/Out */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Scissors className="w-4 h-4 text-emerald-400" />
                          <span>{lang === 'bn' ? 'ভিডিও ট্রিম ও কাট (Trim & Split)' : 'Trim & Split Video'}</span>
                        </span>
                        <span className="font-mono tabular-nums text-emerald-400 font-bold">
                          {formatTimeSec(config.trimStart)} – {formatTimeSec(trimEndEffective)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateConfig({ trimStart: currentTime });
                          }}
                          className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>✂️ {lang === 'bn' ? 'এখানে শুরু কাটুন' : 'Set Trim In'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateConfig({ trimEnd: Math.max(config.trimStart + 0.5, currentTime) });
                          }}
                          className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>✂️ {lang === 'bn' ? 'এখানে শেষ কাটুন' : 'Set Trim Out'}</span>
                        </button>
                      </div>

                      <div className="space-y-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="w-12 shrink-0">{lang === 'bn' ? 'শুরু:' : 'Start:'}</span>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, trimEndEffective - 0.5)}
                            step={0.1}
                            value={config.trimStart}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateConfig({ trimStart: val });
                              if (videoRef.current) videoRef.current.currentTime = val;
                            }}
                            className="flex-1 accent-emerald-400 h-1.5 cursor-pointer"
                          />
                          <span className="w-12 text-right font-mono text-emerald-400">{formatTimeSec(config.trimStart)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="w-12 shrink-0">{lang === 'bn' ? 'শেষ:' : 'End:'}</span>
                          <input
                            type="range"
                            min={Math.min(duration, config.trimStart + 0.5)}
                            max={Math.max(0.5, duration)}
                            step={0.1}
                            value={trimEndEffective}
                            onChange={(e) => updateConfig({ trimEnd: Number(e.target.value) })}
                            className="flex-1 accent-emerald-400 h-1.5 cursor-pointer"
                          />
                          <span className="w-12 text-right font-mono text-emerald-400">{formatTimeSec(trimEndEffective)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Speed Control */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          {lang === 'bn' ? 'প্লেব্যাক গতি (Playback Speed)' : 'Playback Speed'}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">{config.playbackRate}x</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => updateConfig({ playbackRate: spd })}
                            className={`min-h-[40px] rounded-xl text-xs font-bold font-mono tabular-nums border cursor-pointer transition ${
                              config.playbackRate === spd
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Original Audio Volume & Mute */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          {config.originalVolume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                          <span>{lang === 'bn' ? 'মূল ভিডিওর শব্দ (Original Volume)' : 'Original Video Audio'}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateConfig({ originalVolume: config.originalVolume === 0 ? 1 : 0 })}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                              config.originalVolume === 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/5 text-slate-300 border-white/10'
                            }`}
                          >
                            {config.originalVolume === 0 ? (lang === 'bn' ? 'মিউট আছে' : 'Muted') : (lang === 'bn' ? 'মিউট করুন' : 'Mute')}
                          </button>
                          <span className="font-mono tabular-nums text-emerald-400 font-bold">{Math.round(config.originalVolume * 100)}%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(config.originalVolume * 100)}
                        onChange={(e) => updateConfig({ originalVolume: Number(e.target.value) / 100 })}
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                  </>
                ) : (
                  /* Photo Animation Mode */
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-300 block">
                      {lang === 'bn' ? 'ছবির মোশন অ্যানিমেশন (Photo Motion)' : 'Photo Motion Animation'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: 'ken_burns', bn: 'সিনেমা জুম', en: 'Ken Burns' },
                          { id: 'pan_horizontal', bn: 'প্যান স্লাইড', en: 'Pan Slide' },
                          { id: 'pulse_beat', bn: 'বিট পালস', en: 'Beat Pulse' },
                          { id: 'static', bn: 'স্থির ছবি', en: 'Static' },
                        ] as Array<{ id: ImageMotionPreset; bn: string; en: string }>
                      ).map((mp) => (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => updateConfig({ imageMotion: mp.id })}
                          className={`min-h-[44px] rounded-xl border text-xs font-semibold cursor-pointer ${
                            config.imageMotion === mp.id
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          {lang === 'bn' ? mp.bn : mp.en}
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">
                        {lang === 'bn' ? 'ফটো আউটপুট মোড' : 'Photo Output Mode'}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setExportPhotoAsVideo(false)}
                          className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                            !exportPhotoAsVideo
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>{lang === 'bn' ? 'এডিটেড ফটো' : 'Edited Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportPhotoAsVideo(true)}
                          className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                            exportPhotoAsVideo
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          <Film className="w-4 h-4" />
                          <span>{lang === 'bn' ? 'অ্যানিমেটেড ভিডিও রিল' : 'Video Reel'}</span>
                        </button>
                      </div>
                      {exportPhotoAsVideo && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300">{lang === 'bn' ? 'ভিডিও দৈর্ঘ্য' : 'Video Duration'}</span>
                            <span className="font-mono tabular-nums text-emerald-400 font-bold">{photoVideoDuration}s</span>
                          </div>
                          <input
                            type="range"
                            min={3}
                            max={15}
                            value={photoVideoDuration}
                            onChange={(e) => setPhotoVideoDuration(Number(e.target.value))}
                            className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: COLOR & 16 PRO FILTERS */}
            {activeTab === 'filter' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'প্রো কালার প্রিসেট (16 LUTs)' : '16 Pro Color Grading LUTs'}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateConfig({ presetId: 'normal', ...COLOR_PRESETS[0].patch })}
                      className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      {lang === 'bn' ? 'রিসেট' : 'Reset'}
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {COLOR_PRESETS.map((preset) => {
                      const active = config.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updateConfig({ presetId: preset.id, ...preset.patch })}
                          className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border shrink-0 min-w-[72px] cursor-pointer transition ${
                            active
                              ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/30'
                              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                          }`}
                        >
                          <div
                            className="w-14 h-10 rounded-lg border border-white/15 shadow-sm"
                            style={{ background: preset.swatch }}
                          />
                          <span className="text-[11px] font-medium text-slate-200 whitespace-nowrap">
                            {lang === 'bn' ? preset.nameBn : preset.nameEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Fine-Tuning Sliders */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  {[
                    { key: 'brightness', labelBn: 'উজ্জ্বলতা (Brightness)', labelEn: 'Brightness', min: 50, max: 160, unit: '%' },
                    { key: 'contrast', labelBn: 'কনট্রাস্ট (Contrast)', labelEn: 'Contrast', min: 50, max: 160, unit: '%' },
                    { key: 'saturate', labelBn: 'রঙের গভীরতা (Saturation)', labelEn: 'Saturation', min: 0, max: 200, unit: '%' },
                    { key: 'warmth', labelBn: 'কালার উষ্ণতা (Warm / Cool)', labelEn: 'Temperature', min: -100, max: 100, unit: '' },
                    { key: 'hueRotate', labelBn: 'হিউ শিফট (Hue Rotate)', labelEn: 'Hue Shift', min: -180, max: 180, unit: '°' },
                    { key: 'fade', labelBn: 'ম্যাট ফেড (Fade / Shadows)', labelEn: 'Matte Fade', min: 0, max: 60, unit: '%' },
                    { key: 'vignette', labelBn: 'ভিন্যেট বর্ডার (Vignette)', labelEn: 'Vignette', min: 0, max: 100, unit: '%' },
                  ].map((slider) => {
                    const val = config[slider.key as keyof MediaEditConfig] as number;
                    return (
                      <div key={slider.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">{lang === 'bn' ? slider.labelBn : slider.labelEn}</span>
                          <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                            {val}{slider.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          value={val}
                          onChange={(e) => updateConfig({ [slider.key]: Number(e.target.value), presetId: 'custom' })}
                          className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: VISUAL EFFECTS & INFECTS (14 VFX) */}
            {activeTab === 'effects' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">
                      {lang === 'bn' ? 'ভিজ্যুয়াল ইফেক্টস (14 VFX)' : '14 Visual Effects (VFX)'}
                    </span>
                    {config.vfxEffect !== 'none' && (
                      <button
                        type="button"
                        onClick={() => updateConfig({ vfxEffect: 'none' })}
                        className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        {lang === 'bn' ? 'ইফেক্ট বন্ধ' : 'Clear Effect'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {VFX_EFFECTS.map((fx) => (
                      <button
                        key={fx.id}
                        type="button"
                        onClick={() => updateConfig({ vfxEffect: fx.id })}
                        className={`min-h-[56px] p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                          config.vfxEffect === fx.id
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/30'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg leading-none">{fx.icon}</span>
                        <span className="text-[11px] font-medium whitespace-nowrap">
                          {lang === 'bn' ? fx.labelBn : fx.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {config.vfxEffect !== 'none' && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-emerald-500/30">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-semibold">{lang === 'bn' ? 'ইফেক্ট মাত্রা (Intensity)' : 'Effect Intensity'}</span>
                      <span className="font-mono tabular-nums text-emerald-400 font-bold">{config.vfxIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={config.vfxIntensity}
                      onChange={(e) => updateConfig({ vfxIntensity: Number(e.target.value) })}
                      className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MUSIC & SONG ADDER */}
            {activeTab === 'music' && (
              <div className="space-y-4">
                {/* Upload Custom Music */}
                <div>
                  <span className="text-xs font-bold text-slate-200 block mb-2">
                    {lang === 'bn' ? 'কাস্টম গান বা মিউজিক যোগ করুন' : 'Add Custom Song / Music'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => bgAudioInputRef.current?.click()}
                      className="flex-1 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 border border-dashed border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer px-3 truncate shadow-sm"
                    >
                      <Upload className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {config.bgAudioName || (lang === 'bn' ? 'ডিভাইস থেকে MP3 অডিও বাছুন' : 'Upload MP3 / Audio File')}
                      </span>
                    </button>
                    {config.bgAudioUrl && (
                      <button
                        type="button"
                        onClick={() => updateConfig({ bgAudioUrl: undefined, bgAudioName: undefined })}
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center cursor-pointer"
                        title={lang === 'bn' ? 'গান সরান' : 'Remove song'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      ref={bgAudioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleBgAudioUpload}
                    />
                  </div>
                </div>

                {/* Music Volume Slider */}
                {config.bgAudioUrl && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-300 font-bold">{lang === 'bn' ? 'মিউজিক ভলিউম (Music Volume)' : 'Music Volume'}</span>
                      <span className="font-mono tabular-nums text-emerald-400 font-bold">{Math.round(config.bgAudioVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={150}
                      value={Math.round(config.bgAudioVolume * 100)}
                      onChange={(e) => updateConfig({ bgAudioVolume: Number(e.target.value) / 100 })}
                      className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                    />
                  </div>
                )}

                {/* Built-in Trending Bengali Song Library */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    {lang === 'bn' ? 'জনপ্রিয় বাংলা গান লাইব্রেরি' : 'Trending Bengali Music Library'}
                  </span>
                  <div className="space-y-2">
                    {PRESET_MUSIC_LIBRARY.map((track) => {
                      const isAttached = config.bgAudioUrl === track.url;
                      const isPreviewing = previewingAudioUrl === track.url;
                      return (
                        <div
                          key={track.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                            isAttached
                              ? 'bg-emerald-500/15 border-emerald-400'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handlePreviewAudio(track.url)}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-emerald-500 text-white hover:text-black flex items-center justify-center cursor-pointer shrink-0 transition"
                            title={isPreviewing ? 'Pause' : 'Play Preview'}
                          >
                            {isPreviewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {lang === 'bn' ? track.titleBn : track.titleEn}
                              </span>
                              <span className="text-[10px] text-amber-300 shrink-0">{track.badge}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {lang === 'bn' ? track.artistBn : track.artistEn} • {lang === 'bn' ? track.genreBn : track.genreEn}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isAttached) {
                                updateConfig({ bgAudioUrl: undefined, bgAudioName: undefined });
                              } else {
                                updateConfig({
                                  bgAudioUrl: track.url,
                                  bgAudioName: lang === 'bn' ? track.titleBn : track.titleEn,
                                  bgAudioVolume: 0.75,
                                });
                                if (previewingAudioUrl) {
                                  activePreviewAudioRef.current?.pause();
                                  setPreviewingAudioUrl(null);
                                }
                              }
                            }}
                            className={`min-h-[36px] px-3 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition ${
                              isAttached
                                ? 'bg-emerald-500 text-black shadow-md'
                                : 'bg-white/10 hover:bg-white/20 text-slate-200'
                            }`}
                          >
                            {isAttached ? (lang === 'bn' ? 'যুক্ত আছে ✓' : 'Added ✓') : (lang === 'bn' ? 'গান নিন' : 'Add')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: VOICE, MIC RECORDING, SPEECH-TO-TEXT & SOUND FX */}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                {/* 1. Live Microphone Voiceover Recording */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-emerald-950/20 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-cyan-400" />
                        <span>{lang === 'bn' ? 'লাইভ ভয়েস রেকর্ড (Voiceover)' : 'Record Live Voiceover'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'bn' ? 'ভিডিওর ওপর নিজের কণ্ঠ সরাসরি রেকর্ড করুন' : 'Record voiceover directly over video'}
                      </p>
                    </div>

                    {isRecordingVoice && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>{formatTimeSec(voiceRecordSec)}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isRecordingVoice ? (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="flex-1 min-h-[44px] rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
                      >
                        <Mic className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'ভয়েস রেকর্ড শুরু করুন' : 'Start Mic Recording'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-pulse"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>{lang === 'bn' ? 'রেকর্ড সম্পন্ন করুন' : 'Stop & Save Recording'}</span>
                      </button>
                    )}
                  </div>

                  {voiceRecordError && (
                    <p className="text-[11px] text-rose-300">{voiceRecordError}</p>
                  )}

                  {config.voiceoverUrl && (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-cyan-200 font-semibold truncate flex-1">
                          {config.voiceoverName || 'Voiceover'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePreviewAudio(config.voiceoverUrl!)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'শুনুন' : 'Play'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateConfig({ voiceoverUrl: undefined, voiceoverName: undefined })}
                            className="p-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer"
                            title="Delete voiceover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">{lang === 'bn' ? 'ভয়েস ভলিউম' : 'Voice Volume'}</span>
                          <span className="font-mono text-cyan-300">{Math.round((config.voiceoverVolume ?? 1) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={150}
                          value={Math.round((config.voiceoverVolume ?? 1) * 100)}
                          onChange={(e) => updateConfig({ voiceoverVolume: Number(e.target.value) / 100 })}
                          className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Speech-to-Text Voice Captions ("কথা শুনেও করেন") */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        <span>{lang === 'bn' ? 'কথা শুনে অটো সাবটাইটেল (Speech to Text)' : 'Auto Voice Captions'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'bn' ? 'মুখে কথা বলুন, স্বয়ংক্রিয়ভাবে সাবটাইটেল হয়ে যাবে' : 'Speak to create subtitles automatically'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => setSpeechLang('bn-BD')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          speechLang === 'bn-BD' ? 'bg-amber-400 text-black' : 'text-slate-400'
                        }`}
                      >
                        বাংলা
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechLang('en-US')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          speechLang === 'en-US' ? 'bg-amber-400 text-black' : 'text-slate-400'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`flex-1 min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                        isListeningSpeech
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-md shadow-amber-400/20'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>
                        {isListeningSpeech
                          ? (lang === 'bn' ? 'কথা শুনছি... (বন্ধ করতে চাপুন)' : 'Listening... (Tap to stop)')
                          : (lang === 'bn' ? 'কথা বলা শুরু করুন' : 'Start Speaking')}
                      </span>
                    </button>
                  </div>

                  {speechError && (
                    <p className="text-[11px] text-rose-300">{speechError}</p>
                  )}

                  {speechTranscript && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-amber-400/40 space-y-2">
                      <p className="text-xs text-white leading-relaxed font-semibold">"{speechTranscript}"</p>
                      <button
                        type="button"
                        onClick={handleAddSpeechToOverlay}
                        className="w-full min-h-[36px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'ভিডিওতে সাবটাইটেল হিসেবে যোগ করুন' : 'Add as Subtitle'}</span>
                      </button>
                    </div>
                  )}

                  {/* Quick Preset Subtitles */}
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">
                      {lang === 'bn' ? 'দ্রুত জনপ্রিয় ক্যাপশন ট্যাগ:' : 'Quick Trending Captions:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['🔴 ব্রেকিং নিউজ', '🔥 ভাইরাল রিল', '😂 হাসির কৌতুক', '🎶 সেরা গান', '৳ টাকা ইনকাম'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddText(tag)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-slate-200 cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Bengali Voice Clips */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    {lang === 'bn' ? 'জনপ্রিয় বাংলা ভয়েস ক্লিপস' : 'Popular Bengali Voice Lines'}
                  </span>
                  <div className="space-y-1.5">
                    {BENGALI_VOICE_CLIPS.map((clip) => {
                      const isAttached = config.voiceoverUrl === clip.url;
                      const isPreviewing = previewingAudioUrl === clip.url;
                      return (
                        <div
                          key={clip.id}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                            isAttached ? 'bg-cyan-500/15 border-cyan-400' : 'bg-white/[0.02] border-white/10'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handlePreviewAudio(clip.url)}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-cyan-400 text-white hover:text-black flex items-center justify-center cursor-pointer shrink-0"
                            title="Play"
                          >
                            {isPreviewing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-200 truncate">{clip.textBn}</p>
                            <span className="text-[10px] text-slate-400">{clip.duration}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (isAttached) {
                                updateConfig({ voiceoverUrl: undefined, voiceoverName: undefined });
                              } else {
                                updateConfig({
                                  voiceoverUrl: clip.url,
                                  voiceoverName: clip.labelBn,
                                  voiceoverVolume: 1,
                                });
                              }
                            }}
                            className={`min-h-[32px] px-2.5 rounded-lg text-xs font-bold cursor-pointer ${
                              isAttached ? 'bg-cyan-400 text-black' : 'bg-white/10 text-slate-200 hover:bg-white/15'
                            }`}
                          >
                            {isAttached ? '✓' : (lang === 'bn' ? 'নিন' : 'Use')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Instant Sound Effects (SFX) */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    {lang === 'bn' ? 'ইনস্ট্যান্ট সাউন্ড ইফেক্টস (SFX)' : 'Instant Sound Effects'}
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'applause', label: '👏 তালি' },
                      { id: 'laugh', label: '😂 হাসি' },
                      { id: 'bell', label: '🔔 বেল' },
                      { id: 'coin', label: '💰 কয়েন' },
                      { id: 'whoosh', label: '💨 হুশ' },
                    ].map((sfx) => (
                      <button
                        key={sfx.id}
                        type="button"
                        onClick={() => playEditorSfx(sfx.id as any)}
                        className="min-h-[44px] rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition"
                      >
                        <span>{sfx.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: TEXT, CAPTIONS & STICKERS */}
            {activeTab === 'overlay' && (
              <div className="space-y-4">
                {/* Watermark Configurator */}
                <WatermarkConfigurator
                  watermark={
                    config.watermark || {
                      enabled: false,
                      type: 'text',
                      text: 'ReelPay BD',
                      position: 'bottom-right',
                      opacity: 0.85,
                      size: 'medium',
                      color: '#ffffff',
                    }
                  }
                  onChange={(wm) => updateConfig({ watermark: wm })}
                  creatorName="Creator"
                  creatorHandle="@creator"
                  lang={lang}
                />

                {/* Add Custom Text */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-xs font-bold text-slate-200 block">
                    {lang === 'bn' ? 'ভিডিওতে ক্যাপশন বা লেখা যোগ করুন' : 'Add Text Caption'}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTextDraft}
                      onChange={(e) => setNewTextDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddText();
                        }
                      }}
                      placeholder={lang === 'bn' ? 'বাংলা বা ইংরেজি লিখুন...' : 'Type caption text...'}
                      className="flex-1 min-h-[44px] bg-white/5 border border-white/15 rounded-xl px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddText()}
                      className="min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'যোগ' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                {/* Selected Text Style Editor */}
                {selectedText && (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-emerald-500/35 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={selectedText.text}
                        onChange={(e) =>
                          updateConfig({
                            texts: config.texts.map((t) =>
                              t.id === selectedText.id ? { ...t, text: e.target.value } : t
                            ),
                          })
                        }
                        className="flex-1 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig({ texts: config.texts.filter((t) => t.id !== selectedText.id) });
                          setSelectedOverlayId(null);
                        }}
                        className="min-w-[36px] min-h-[36px] rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{lang === 'bn' ? 'ফন্ট সাইজ' : 'Font Size'}</span>
                        <span className="font-mono tabular-nums text-emerald-400">{selectedText.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={84}
                        value={selectedText.fontSize}
                        onChange={(e) =>
                          updateConfig({
                            texts: config.texts.map((t) =>
                              t.id === selectedText.id ? { ...t, fontSize: Number(e.target.value) } : t
                            ),
                          })
                        }
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-300">{lang === 'bn' ? 'রং:' : 'Color:'}</span>
                      <div className="flex gap-1.5">
                        {TEXT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() =>
                              updateConfig({
                                texts: config.texts.map((t) =>
                                  t.id === selectedText.id ? { ...t, color: c } : t
                                ),
                              })
                            }
                            className={`w-6 h-6 rounded-full border cursor-pointer ${
                              selectedText.color === c ? 'border-emerald-400 scale-110' : 'border-white/25'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-300">{lang === 'bn' ? 'বক্স ব্যাকগ্রাউন্ড:' : 'Box:'}</span>
                      <div className="flex gap-1.5">
                        {TEXT_BG_COLORS.map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() =>
                              updateConfig({
                                texts: config.texts.map((t) =>
                                  t.id === selectedText.id ? { ...t, bgColor: bg } : t
                                ),
                              })
                            }
                            className={`w-6 h-6 rounded-md border cursor-pointer text-[9px] font-bold flex items-center justify-center ${
                              selectedText.bgColor === bg ? 'border-emerald-400 scale-110' : 'border-white/25'
                            }`}
                            style={{ backgroundColor: bg === 'transparent' ? '#1e293b' : bg }}
                          >
                            {bg === 'transparent' ? '✕' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stickers Grid */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    {lang === 'bn' ? 'স্টিকার ও রিয়্যাকশন প্যাক' : 'Stickers & Reactions'}
                  </span>
                  <div className="grid grid-cols-8 gap-1.5 max-h-44 overflow-y-auto p-1 bg-white/[0.02] rounded-xl border border-white/10">
                    {STICKER_PACK.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleAddSticker(em)}
                        className="min-h-[40px] rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-lg flex items-center justify-center cursor-pointer active:scale-95 transition"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedSticker && (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-amber-400/35 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        {selectedSticker.emoji} {lang === 'bn' ? 'স্টিকার কন্ট্রোল' : 'Sticker Controls'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig({ stickers: config.stickers.filter((s) => s.id !== selectedSticker.id) });
                          setSelectedOverlayId(null);
                        }}
                        className="min-w-[34px] min-h-[34px] rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-300 block mb-1">{lang === 'bn' ? 'আকার (Size)' : 'Size'}</span>
                        <input
                          type="range"
                          min={28}
                          max={140}
                          value={selectedSticker.size}
                          onChange={(e) =>
                            updateConfig({
                              stickers: config.stickers.map((s) =>
                                s.id === selectedSticker.id ? { ...s, size: Number(e.target.value) } : s
                              ),
                            })
                          }
                          className="w-full accent-amber-400 h-1.5 cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-300 block mb-1">{lang === 'bn' ? 'ঘোরানো (Rotate)' : 'Rotate'}</span>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={selectedSticker.rotation}
                          onChange={(e) =>
                            updateConfig({
                              stickers: config.stickers.map((s) =>
                                s.id === selectedSticker.id ? { ...s, rotation: Number(e.target.value) } : s
                              ),
                            })
                          }
                          className="w-full accent-amber-400 h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: CANVAS, ASPECT RATIO, BACKDROP & CHROMA KEY */}
            {activeTab === 'background' && (
              <div className="space-y-4">
                {/* Aspect Ratio */}
                <div>
                  <span className="text-xs font-bold text-slate-200 block mb-2">
                    {lang === 'bn' ? 'ক্যানভাস অনুপাত (Aspect Ratio)' : 'Canvas Aspect Ratio'}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['9:16', '1:1', '4:5', '16:9'] as AspectRatioOption[]).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => updateConfig({ aspectRatio: ratio })}
                        className={`min-h-[44px] px-2 rounded-xl text-xs font-bold border cursor-pointer transition whitespace-nowrap ${
                          config.aspectRatio === ratio
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Framing + Zoom + Corners */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'ফ্রেম মোড' : 'Framing'}
                    </span>
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateConfig({ fitMode: 'cover' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          config.fitMode === 'cover' ? 'bg-emerald-500 text-black' : 'text-slate-300'
                        }`}
                      >
                        {lang === 'bn' ? 'ফুল স্ক্রিন' : 'Fill'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig({ fitMode: 'contain' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          config.fitMode === 'contain' ? 'bg-emerald-500 text-black' : 'text-slate-300'
                        }`}
                      >
                        {lang === 'bn' ? 'ফিট + ব্যাকড্রপ' : 'Fit + BG'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{lang === 'bn' ? 'জুম / স্কেল' : 'Zoom / Scale'}</span>
                      <span className="font-mono tabular-nums text-emerald-400 font-bold">{Math.round(config.scale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={160}
                      value={Math.round(config.scale * 100)}
                      onChange={(e) => updateConfig({ scale: Number(e.target.value) / 100 })}
                      className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{lang === 'bn' ? 'কোণ রাউন্ড' : 'Corner Radius'}</span>
                        <span className="font-mono tabular-nums text-emerald-400">{config.borderRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={48}
                        value={config.borderRadius}
                        onChange={(e) => updateConfig({ borderRadius: Number(e.target.value) })}
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{lang === 'bn' ? 'বর্ডার ফ্রেম' : 'Frame Border'}</span>
                        <span className="font-mono tabular-nums text-emerald-400">{config.frameBorderWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={16}
                        value={config.frameBorderWidth}
                        onChange={(e) => updateConfig({ frameBorderWidth: Number(e.target.value) })}
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Transform: Rotate & Flip */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    {lang === 'bn' ? 'রোটেট ও মিরর (Transform)' : 'Rotate & Flip'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateConfig({ rotation: (((config.rotation + 90) % 360) as 0 | 90 | 180 | 270) })}
                      className="min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4 text-emerald-400" />
                      <span>{config.rotation}°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConfig({ flipH: !config.flipH })}
                      className={`min-h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                        config.flipH ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <FlipHorizontal2 className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'মিরর' : 'Flip H'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConfig({ flipV: !config.flipV })}
                      className={`min-h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                        config.flipV ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <FlipVertical2 className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'উল্টো' : 'Flip V'}</span>
                    </button>
                  </div>
                </div>

                {/* Background Modes */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">
                    {lang === 'bn' ? 'ব্যাকগ্রাউন্ড স্টাইল' : 'Background Style'}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'blur', bn: 'ব্লার', en: 'Blur' },
                        { id: 'solid', bn: 'সলিড', en: 'Solid' },
                        { id: 'gradient', bn: 'গ্রেডিয়েন্ট', en: 'Gradient' },
                        { id: 'image', bn: 'ছবি', en: 'Photo' },
                      ] as Array<{ id: BackgroundMode; bn: string; en: string }>
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => updateConfig({ backgroundMode: m.id, fitMode: config.fitMode === 'cover' && !config.chromaKeyEnabled ? 'contain' : config.fitMode })}
                        className={`min-h-[40px] px-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          config.backgroundMode === m.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-slate-300'
                        }`}
                      >
                        {lang === 'bn' ? m.bn : m.en}
                      </button>
                    ))}
                  </div>

                  {config.backgroundMode === 'blur' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{lang === 'bn' ? 'ব্যাকগ্রাউন্ড ব্লার মাত্রা' : 'Blur Intensity'}</span>
                        <span className="font-mono tabular-nums text-emerald-400">{config.backgroundBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={45}
                        value={config.backgroundBlur}
                        onChange={(e) => updateConfig({ backgroundBlur: Number(e.target.value) })}
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                  )}

                  {config.backgroundMode === 'solid' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {BG_SOLID_COLORS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => updateConfig({ backgroundColor: hex })}
                          className={`w-9 h-9 rounded-xl border-2 cursor-pointer ${
                            config.backgroundColor === hex ? 'border-emerald-400 scale-110' : 'border-white/15'
                          }`}
                          style={{ backgroundColor: hex }}
                          aria-label={`Color ${hex}`}
                        />
                      ))}
                      <label className="w-9 h-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center cursor-pointer text-[10px] font-bold">
                        +
                        <input
                          type="color"
                          value={config.backgroundColor}
                          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}

                  {config.backgroundMode === 'gradient' && (
                    <div className="grid grid-cols-3 gap-2">
                      {BG_GRADIENTS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => updateConfig({ backgroundGradient: g.value })}
                          className="h-11 rounded-xl border border-white/15 text-[11px] font-bold text-white shadow cursor-pointer flex items-center justify-center px-2 truncate"
                          style={{
                            background: `linear-gradient(${g.value[2]}deg, ${g.value[0]}, ${g.value[1]})`,
                          }}
                        >
                          {lang === 'bn' ? g.labelBn : g.labelEn}
                        </button>
                      ))}
                    </div>
                  )}

                  {config.backgroundMode === 'image' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => bgImgInputRef.current?.click()}
                        className="w-full min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 border border-dashed border-emerald-500/50 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'ব্যাকগ্রাউন্ড ছবি আপলোড করুন' : 'Upload Background Photo'}</span>
                      </button>
                      <input
                        ref={bgImgInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBgImageUpload}
                      />
                    </div>
                  )}
                </div>

                {/* Chroma Key / Green Screen */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        {lang === 'bn' ? 'ক্রোমা কী (Green Screen Remover)' : 'Chroma Key / BG Remover'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'bn' ? 'গ্রিন বা সলিড ব্যাকগ্রাউন্ড সরিয়ে ফেলুন' : 'Remove green/blue screen backdrop'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ chromaKeyEnabled: !config.chromaKeyEnabled })}
                      className={`min-h-[36px] px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                        config.chromaKeyEnabled
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {config.chromaKeyEnabled ? (lang === 'bn' ? 'চালু ✓' : 'ON ✓') : (lang === 'bn' ? 'বন্ধ' : 'OFF')}
                    </button>
                  </div>

                  {config.chromaKeyEnabled && (
                    <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300">{lang === 'bn' ? 'কী কালার:' : 'Key Color:'}</span>
                        <div className="flex items-center gap-1.5">
                          {CHROMA_PRESETS.map((cp) => (
                            <button
                              key={cp.color}
                              type="button"
                              onClick={() => updateConfig({ chromaKeyColor: cp.color })}
                              className={`w-7 h-7 rounded-lg border-2 cursor-pointer ${
                                config.chromaKeyColor === cp.color ? 'border-white scale-110' : 'border-white/20'
                              }`}
                              style={{ backgroundColor: cp.color }}
                              title={cp.label}
                            />
                          ))}
                          <input
                            type="color"
                            value={config.chromaKeyColor}
                            onChange={(e) => updateConfig({ chromaKeyColor: e.target.value })}
                            className="w-7 h-7 rounded bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">{lang === 'bn' ? 'কালার মিল (Similarity)' : 'Similarity'}</span>
                          <span className="font-mono tabular-nums text-emerald-400">{config.chromaKeySimilarity}</span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={130}
                          value={config.chromaKeySimilarity}
                          onChange={(e) => updateConfig({ chromaKeySimilarity: Number(e.target.value) })}
                          className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">{lang === 'bn' ? 'এজ মসৃণতা (Smoothness)' : 'Smoothness'}</span>
                          <span className="font-mono tabular-nums text-emerald-400">{config.chromaKeySmoothness}</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={60}
                          value={config.chromaKeySmoothness}
                          onChange={(e) => updateConfig({ chromaKeySmoothness: Number(e.target.value) })}
                          className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Dock 7 Studio Tabs */}
          <nav className="border-t border-white/10 bg-[#09100c] flex items-center overflow-x-auto no-scrollbar px-1 py-1 shrink-0">
            {studioTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[50px] min-w-[58px] flex-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer transition ${
                    active ? 'bg-emerald-500/20 text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span className="whitespace-nowrap px-1">
                    {lang === 'bn' ? tab.labelBn : tab.labelEn}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* Rendering / Exporting Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#111c16] border border-emerald-500/35 rounded-2xl p-5 text-center space-y-4 shadow-2xl">
            <Loader2 className="w-9 h-9 text-emerald-400 animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'bn' ? 'মাস্টার এডিট রেন্ডার হচ্ছে...' : 'Rendering Master Edit...'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'কালার, ব্যাকগ্রাউন্ড, ইফেক্ট, মিউজিক ও অডিও সংযুক্ত করা হচ্ছে'
                  : 'Encoding color, background, VFX, music and audio'}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-400 font-bold block">
                {exportProgress}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => abortControllerRef.current?.abort()}
              className="w-full min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 cursor-pointer"
            >
              {lang === 'bn' ? 'রেন্ডার বাতিল করুন' : 'Cancel Render'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
