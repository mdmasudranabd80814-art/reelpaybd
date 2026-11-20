import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Gift,
  Send,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Heart,
  Radio,
  Share2,
  RotateCcw,
  Pin,
  MessageSquare,
  MessageSquareOff,
  Hand,
  Trash2,
  SlidersHorizontal,
  UserPlus,
  UserMinus,
  Check,
  Power,
  Sparkles,
  ShieldAlert,
  Clock,
  Volume2,
  VolumeX,
  AlertTriangle,
  Crown,
  Wifi,
} from 'lucide-react';
import { increment, orderBy, limit, where } from 'firebase/firestore';
import { toBengaliNumber } from '../utils/bengali';
import { playPopSound, playSuccessChime } from '../utils/audio';
import { useFirebase } from '../hooks/useFirebase';
import { GIFTS_LIST } from '../data/initialData';
import {
  LiveStream,
  LiveChatMessage,
  LiveSpeakerRequest,
  LiveCoHost,
  GiftItem,
  User,
} from '../types';

interface LiveViewerItem {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

interface RtcPeerSignalDoc {
  id: string;
  type: 'peer' | 'preview';
  viewerId?: string;
  viewerName?: string;
  hostId?: string;
  status?: 'requesting' | 'offered' | 'answered';
  offer?: { type: RTCSdpType; sdp: string };
  answer?: { type: RTCSdpType; sdp: string };
  hostCandidates?: string[];
  viewerCandidates?: string[];
  frameDataUrl?: string | null;
  audioLevel?: number;
  isCameraOn?: boolean;
  isMicMuted?: boolean;
  updatedAt: string;
}

interface LiveStreamSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGift: (stream: LiveStream) => void;
  onQuickGift?: (gift: GiftItem, stream: LiveStream) => void;
  lang: 'bn' | 'en';
  isMuted: boolean;
  liveStreamId: string | null;
  currentUser: User;
  isAuthenticated?: boolean;
  onRequireAuth?: (msg?: string) => void;
  onEndLive?: (id: string, byAdmin?: boolean, reason?: string) => Promise<void> | void;
  onShare?: (stream: LiveStream) => void;
  onOpenProfile?: (userId: string) => void;
  onToggleFollow?: (userId: string, creatorName?: string) => void;
  isFollowingHost?: boolean;
  isAdminOverride?: boolean;
  initialStream?: LiveStream | null;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const QUICK_CANCEL_REASONS_BN = [
  'কমিউনিটি নীতিমালা লঙ্ঘন',
  'অশ্লীল বা অনুপযুক্ত কন্টেন্ট',
  'স্প্যাম বা প্রতারণামূলক তথ্য',
  'ভুল ক্যাটাগরি / অডিও-ভিডিও সমস্যা',
];

const formatDuration = (createdAt?: string): string => {
  if (!createdAt) return '00:00';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
};

export const LiveStreamSheet: React.FC<LiveStreamSheetProps> = ({
  isOpen,
  onClose,
  onOpenGift,
  onQuickGift,
  lang,
  isMuted,
  liveStreamId,
  currentUser,
  isAuthenticated = true,
  onRequireAuth,
  onEndLive,
  onShare,
  onOpenProfile,
  onToggleFollow,
  isFollowingHost = false,
  isAdminOverride = false,
  initialStream = null,
}) => {
  const {
    user: firebaseUser,
    loginWithGoogle,
    onSnapshot,
    updateDocument,
    addDocument,
    setDocument,
    deleteDocument,
  } = useFirebase();

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [requests, setRequests] = useState<LiveSpeakerRequest[]>([]);
  const [viewers, setViewers] = useState<LiveViewerItem[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [floatingIcons, setFloatingIcons] = useState<{ id: number; x: number; icon: string }[]>([]);
  const [elapsedText, setElapsedText] = useState('00:00');
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  // Studio / Drawer states
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);
  const [showAdminWarningDrawer, setShowAdminWarningDrawer] = useState(false);
  const [adminWarningText, setAdminWarningText] = useState('');
  const [confirmEndStep, setConfirmEndStep] = useState(false);
  const [adminCancelReason, setAdminCancelReason] = useState('');
  const [isCancellingLive, setIsCancellingLive] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [titleEditInput, setTitleEditInput] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [mediaPermissionNote, setMediaPermissionNote] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showQuickGifts, setShowQuickGifts] = useState(false);

  // Remote WebRTC & Frame Relay States (for Admin & Viewers)
  const [livePreviewFrame, setLivePreviewFrame] = useState<string | null>(null);
  const [remoteHostAudioLevel, setRemoteHostAudioLevel] = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasRemoteAudio, setHasRemoteAudio] = useState(false);
  const [rtcStatus, setRtcStatus] = useState<'idle' | 'connecting' | 'connected' | 'relay'>('idle');
  const [isMonitorMuted, setIsMonitorMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteMediaStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioLevelRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const hasCountedViewerRef = useRef<string | null>(null);
  const lastStageTapRef = useRef<number>(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // WebRTC Signaling Refs
  const hostPeersRef = useRef<
    Record<
      string,
      {
        pc: RTCPeerConnection;
        answered: boolean;
        addedViewerCandidates: Set<string>;
        hostCandidates: string[];
      }
    >
  >({});
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const viewerHandledOfferRef = useRef<string | null>(null);
  const viewerAddedHostCandidatesRef = useRef<Set<string>>(new Set());
  const viewerLocalCandidatesRef = useRef<string[]>([]);

  const isHost = Boolean(stream && currentUser.id && stream.hostId === currentUser.id);
  const isAdmin = Boolean(isAdminOverride || currentUser.role === 'admin');
  const isAdminView = isAdmin && !isHost;
  const canManage = isHost || isAdmin;
  const isFirebaseSignedIn = Boolean(firebaseUser);
  const isAdminFirebaseAuthed = Boolean(
    firebaseUser &&
      (firebaseUser.email?.toLowerCase() === 'mdmasudranabd80814@gmail.com' ||
        firebaseUser.uid === 'system_admin')
  );

  const flashStudioNotice = (msg: string) => {
    setStudioNotice(msg);
    setTimeout(() => setStudioNotice(null), 3200);
  };

  // Live session elapsed timer
  useEffect(() => {
    if (!isOpen || !stream?.createdAt || stream.status !== 'active') return;
    setElapsedText(formatDuration(stream.createdAt));
    const timer = setInterval(() => {
      setElapsedText(formatDuration(stream.createdAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, stream?.createdAt, stream?.status]);

  // 1. Sync Stream Metadata
  useEffect(() => {
    if (!isOpen || !liveStreamId) return;
    if (initialStream && initialStream.id === liveStreamId) {
      setStream(initialStream);
    }
    setConfirmEndStep(false);
    setAdminCancelReason('');
    const unsub = onSnapshot(
      'live_streams',
      (data) => {
        const found = data.find((item: any) => item.id === liveStreamId) as LiveStream | undefined;
        if (found) {
          setStream(found);
        }
      }
    );
    return unsub;
  }, [isOpen, liveStreamId, initialStream]);

  useEffect(() => {
    if (stream) {
      setPinInput(stream.pinnedNotice || '');
      setTitleEditInput(stream.title || '');
    }
  }, [stream?.id]);

  // 2. Sync Live Chat Messages
  useEffect(() => {
    if (!isOpen || !liveStreamId) return;
    const unsub = onSnapshot(
      `live_streams/${liveStreamId}/chat`,
      (data) => {
        const sorted = (data as LiveChatMessage[]).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sorted);
      },
      [orderBy('createdAt', 'desc'), limit(60)]
    );
    return unsub;
  }, [isOpen, liveStreamId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // 3. Sync Speaker Requests & Active Viewers
  useEffect(() => {
    if (!isOpen || !liveStreamId) return;
    const unsubReqs = onSnapshot(
      `live_streams/${liveStreamId}/requests`,
      (data) => setRequests(data as LiveSpeakerRequest[]),
      [orderBy('createdAt', 'asc')]
    );
    const unsubViewers = onSnapshot(
      `live_streams/${liveStreamId}/viewers`,
      (data) => setViewers(data as LiveViewerItem[])
    );
    return () => {
      unsubReqs();
      unsubViewers();
    };
  }, [isOpen, liveStreamId]);

  // 4. Real-Time Viewer Join/Leave Presence
  useEffect(() => {
    if (
      !isOpen ||
      !liveStreamId ||
      !isAuthenticated ||
      !isFirebaseSignedIn ||
      !currentUser.id ||
      currentUser.id === 'guest'
    ) {
      return;
    }

    let cancelled = false;
    const joinLive = async () => {
      try {
        await setDocument(`live_streams/${liveStreamId}/viewers`, currentUser.id, {
          id: currentUser.id,
          name: isAdminView ? `${currentUser.name} (Admin)` : currentUser.name,
          avatar: currentUser.avatar,
          joinedAt: new Date().toISOString(),
        });
        if (!cancelled && hasCountedViewerRef.current !== liveStreamId && !isAdminView) {
          hasCountedViewerRef.current = liveStreamId;
          await updateDocument('live_streams', liveStreamId, {
            viewersCount: increment(1),
          });
        }
      } catch {
        // Ignore transient presence errors
      }
    };

    joinLive();

    return () => {
      cancelled = true;
      if (isFirebaseSignedIn) {
        deleteDocument(`live_streams/${liveStreamId}/viewers`, currentUser.id).catch(() => {});
        if (hasCountedViewerRef.current === liveStreamId) {
          hasCountedViewerRef.current = null;
          updateDocument('live_streams', liveStreamId, {
            viewersCount: increment(-1),
          }).catch(() => {});
        }
      }
    };
  }, [isOpen, liveStreamId, isAuthenticated, isFirebaseSignedIn, currentUser.id, isAdminView]);

  // Cleanup helpers for WebRTC
  const closeAllHostPeers = () => {
    Object.values(hostPeersRef.current).forEach((entry) => {
      try {
        entry.pc.close();
      } catch {}
    });
    hostPeersRef.current = {};
  };

  const closeViewerPeer = () => {
    if (viewerPcRef.current) {
      try {
        viewerPcRef.current.close();
      } catch {}
      viewerPcRef.current = null;
    }
    viewerHandledOfferRef.current = null;
    viewerAddedHostCandidatesRef.current.clear();
    viewerLocalCandidatesRef.current = [];
    remoteMediaStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setHasRemoteVideo(false);
    setHasRemoteAudio(false);
    setRtcStatus('idle');
  };

  // 5. Host Real Camera & Microphone Media Capture + Audio Level Meter
  const stopLocalMedia = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    audioLevelRef.current = 0;
    setAudioLevel(0);
  };

  useEffect(() => {
    if (!isOpen || !isHost || !stream || stream.status !== 'active') {
      stopLocalMedia();
      return;
    }

    const wantVideo = stream.mode === 'video' && stream.isCameraOn !== false;
    const wantAudio = !stream.isMicMuted;

    if (!wantVideo && !wantAudio) {
      stopLocalMedia();
      return;
    }

    let cancelled = false;
    const startMedia = async () => {
      stopLocalMedia();
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaPermissionNote(
          lang === 'bn'
            ? 'এই ব্রাউজারে ক্যামেরা/মাইক অ্যাক্সেস সমর্থিত নয়।'
            : 'Camera/mic access is not supported in this browser.'
        );
        return;
      }

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: wantVideo ? { facingMode } : false,
          audio: wantAudio,
        });

        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = media;
        setMediaPermissionNote(null);

        if (wantVideo && videoRef.current) {
          videoRef.current.srcObject = media;
        }

        // Hot-swap tracks on any active WebRTC peer connections
        Object.values(hostPeersRef.current).forEach(({ pc }) => {
          const senders = pc.getSenders();
          media.getTracks().forEach((track) => {
            const match = senders.find((s) => s.track?.kind === track.kind);
            if (match) {
              match.replaceTrack(track).catch(() => {});
            } else {
              try {
                pc.addTrack(track, media);
              } catch {}
            }
          });
        });

        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass && media.getAudioTracks().length > 0) {
          const ctx = new AudioContextClass();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(media);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            if (cancelled) return;
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
            const lvl = Math.min(100, Math.round((avg / 128) * 100));
            audioLevelRef.current = lvl;
            setAudioLevel(lvl);
            animFrameRef.current = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch {
        if (!cancelled) {
          setMediaPermissionNote(
            lang === 'bn'
              ? 'ক্যামেরা/মাইক পারমিশন পাওয়া যায়নি। স্টেজ ও চ্যাট মোডে লাইভ চলছে।'
              : 'Camera/mic permission unavailable. Running in live stage & chat mode.'
          );
        }
      }
    };

    startMedia();
    return () => {
      cancelled = true;
      stopLocalMedia();
    };
  }, [
    isOpen,
    isHost,
    stream?.status,
    stream?.mode,
    stream?.isCameraOn,
    stream?.isMicMuted,
    facingMode,
  ]);

  // 6A. HOST WebRTC Signaling Responder + Live Video Frame Relay
  useEffect(() => {
    if (!isOpen || !isHost || !isFirebaseSignedIn || !liveStreamId || !stream || stream.status !== 'active') {
      closeAllHostPeers();
      return;
    }

    // Periodic Live Video Frame + Audio Level Relay so Admin/Viewers ALWAYS see live feed even behind strict NAT
    const publishPreview = () => {
      let frameDataUrl: string | null = null;
      const vid = videoRef.current;
      if (
        stream.mode === 'video' &&
        stream.isCameraOn !== false &&
        vid &&
        vid.readyState >= 2 &&
        vid.videoWidth > 0
      ) {
        try {
          if (!previewCanvasRef.current) {
            previewCanvasRef.current = document.createElement('canvas');
          }
          const canvas = previewCanvasRef.current;
          const targetW = 240;
          const targetH = Math.max(180, Math.round((vid.videoHeight / vid.videoWidth) * targetW));
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (facingMode === 'user') {
              ctx.save();
              ctx.translate(targetW, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(vid, 0, 0, targetW, targetH);
              ctx.restore();
            } else {
              ctx.drawImage(vid, 0, 0, targetW, targetH);
            }
            frameDataUrl = canvas.toDataURL('image/jpeg', 0.45);
          }
        } catch {
          frameDataUrl = null;
        }
      }

      setDocument(`live_streams/${liveStreamId}/rtc`, 'preview', {
        id: 'preview',
        type: 'preview',
        hostId: currentUser.id,
        frameDataUrl,
        audioLevel: audioLevelRef.current,
        isCameraOn: stream.isCameraOn !== false,
        isMicMuted: Boolean(stream.isMicMuted),
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    };

    const previewTimer = setInterval(publishPreview, 1800);
    const initialPreviewTimer = setTimeout(publishPreview, 700);

    // WebRTC Peer Listener
    const unsubRtc = onSnapshot(`live_streams/${liveStreamId}/rtc`, async (docs) => {
      for (const raw of docs as RtcPeerSignalDoc[]) {
        if (raw.type !== 'peer' || !raw.viewerId || raw.viewerId === currentUser.id) continue;
        const peerId = raw.viewerId;

        if (raw.status === 'requesting' && !hostPeersRef.current[peerId]) {
          try {
            const pc = new RTCPeerConnection(RTC_CONFIG);
            const entry = {
              pc,
              answered: false,
              addedViewerCandidates: new Set<string>(),
              hostCandidates: [] as string[],
            };
            hostPeersRef.current[peerId] = entry;

            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((track) => {
                if (localStreamRef.current) {
                  pc.addTrack(track, localStreamRef.current);
                }
              });
            }

            pc.onicecandidate = (event) => {
              if (event.candidate && entry.hostCandidates.length < 25) {
                entry.hostCandidates.push(JSON.stringify(event.candidate.toJSON()));
                updateDocument(`live_streams/${liveStreamId}/rtc`, peerId, {
                  hostCandidates: entry.hostCandidates,
                  updatedAt: new Date().toISOString(),
                }).catch(() => {});
              }
            };

            const offer = await pc.createOffer({
              offerToReceiveAudio: false,
              offerToReceiveVideo: false,
            });
            await pc.setLocalDescription(offer);

            await updateDocument(`live_streams/${liveStreamId}/rtc`, peerId, {
              type: 'peer',
              status: 'offered',
              offer: { type: offer.type, sdp: offer.sdp || '' },
              hostCandidates: entry.hostCandidates,
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          } catch (err) {
            console.warn('Host WebRTC offer error:', err);
          }
        }

        const existingEntry = hostPeersRef.current[peerId];
        if (existingEntry) {
          if (raw.status === 'answered' && raw.answer && !existingEntry.answered) {
            existingEntry.answered = true;
            try {
              await existingEntry.pc.setRemoteDescription(new RTCSessionDescription(raw.answer));
            } catch {}
          }
          if (Array.isArray(raw.viewerCandidates)) {
            for (const candStr of raw.viewerCandidates) {
              if (!existingEntry.addedViewerCandidates.has(candStr)) {
                existingEntry.addedViewerCandidates.add(candStr);
                try {
                  await existingEntry.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr)));
                } catch {}
              }
            }
          }
        }
      }
    });

    return () => {
      clearInterval(previewTimer);
      clearTimeout(initialPreviewTimer);
      unsubRtc();
      closeAllHostPeers();
    };
  }, [isOpen, isHost, isFirebaseSignedIn, liveStreamId, stream?.status, stream?.mode, stream?.isCameraOn, stream?.isMicMuted, facingMode]);

  // 6B. VIEWER / ADMIN WebRTC Receiver + Live Preview Subscriber
  useEffect(() => {
    if (!isOpen || isHost || !liveStreamId || !stream || stream.status !== 'active') {
      closeViewerPeer();
      setLivePreviewFrame(null);
      setRemoteHostAudioLevel(0);
      return;
    }

    let cancelled = false;
    setRtcStatus('connecting');

    if (isAuthenticated && isFirebaseSignedIn && currentUser.id && currentUser.id !== 'guest') {
      setDocument(`live_streams/${liveStreamId}/rtc`, currentUser.id, {
        id: currentUser.id,
        type: 'peer',
        viewerId: currentUser.id,
        viewerName: currentUser.name,
        status: 'requesting',
        viewerCandidates: [],
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    const unsubRtc = onSnapshot(`live_streams/${liveStreamId}/rtc`, async (docs) => {
      if (cancelled) return;
      for (const raw of docs as RtcPeerSignalDoc[]) {
        if (raw.id === 'preview' && raw.type === 'preview') {
          setLivePreviewFrame(raw.frameDataUrl || null);
          setRemoteHostAudioLevel(raw.audioLevel || 0);
          setRtcStatus((prev) => (prev === 'connected' ? 'connected' : 'relay'));
        }

        if (
          raw.type === 'peer' &&
          raw.id === currentUser.id &&
          raw.offer &&
          raw.status === 'offered' &&
          viewerHandledOfferRef.current !== raw.offer.sdp
        ) {
          viewerHandledOfferRef.current = raw.offer.sdp;
          try {
            if (viewerPcRef.current) viewerPcRef.current.close();
            const pc = new RTCPeerConnection(RTC_CONFIG);
            viewerPcRef.current = pc;
            viewerLocalCandidatesRef.current = [];
            viewerAddedHostCandidatesRef.current.clear();

            const inbound = new MediaStream();
            remoteMediaStreamRef.current = inbound;

            pc.ontrack = (event) => {
              const incomingStream = event.streams?.[0];
              if (incomingStream) {
                incomingStream.getTracks().forEach((t) => {
                  if (!inbound.getTracks().some((ex) => ex.id === t.id)) {
                    inbound.addTrack(t);
                  }
                });
              } else {
                inbound.addTrack(event.track);
              }

              if (event.track.kind === 'video') {
                setHasRemoteVideo(true);
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = inbound;
                  remoteVideoRef.current.play().catch(() => {});
                }
              }
              if (event.track.kind === 'audio') {
                setHasRemoteAudio(true);
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.srcObject = inbound;
                  remoteAudioRef.current.play().catch(() => {});
                }
              }
              setRtcStatus('connected');
            };

            pc.onicecandidate = (event) => {
              if (event.candidate && viewerLocalCandidatesRef.current.length < 25) {
                viewerLocalCandidatesRef.current.push(JSON.stringify(event.candidate.toJSON()));
                updateDocument(`live_streams/${liveStreamId}/rtc`, currentUser.id, {
                  viewerCandidates: viewerLocalCandidatesRef.current,
                  updatedAt: new Date().toISOString(),
                }).catch(() => {});
              }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(raw.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateDocument(`live_streams/${liveStreamId}/rtc`, currentUser.id, {
              status: 'answered',
              answer: { type: answer.type, sdp: answer.sdp || '' },
              viewerCandidates: viewerLocalCandidatesRef.current,
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          } catch (err) {
            console.warn('Viewer WebRTC answer error:', err);
          }
        }

        if (
          raw.type === 'peer' &&
          raw.id === currentUser.id &&
          viewerPcRef.current &&
          Array.isArray(raw.hostCandidates)
        ) {
          for (const candStr of raw.hostCandidates) {
            if (!viewerAddedHostCandidatesRef.current.has(candStr)) {
              viewerAddedHostCandidatesRef.current.add(candStr);
              try {
                await viewerPcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr)));
              } catch {}
            }
          }
        }
      }
    });

    return () => {
      cancelled = true;
      unsubRtc();
      closeViewerPeer();
      if (isAuthenticated && isFirebaseSignedIn && currentUser.id && currentUser.id !== 'guest') {
        deleteDocument(`live_streams/${liveStreamId}/rtc`, currentUser.id).catch(() => {});
      }
    };
  }, [isOpen, isHost, isAuthenticated, isFirebaseSignedIn, liveStreamId, stream?.status, currentUser.id]);

  // Attach remote stream if video element mounts after track event
  useEffect(() => {
    if (hasRemoteVideo && remoteVideoRef.current && remoteMediaStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteMediaStreamRef.current;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (hasRemoteAudio && remoteAudioRef.current && remoteMediaStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteMediaStreamRef.current;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [hasRemoteVideo, hasRemoteAudio, stream?.isCameraOn, stream?.mode]);

  if (!isOpen) return null;

  const ensureAuth = (actionMsg: string) => {
    if (!isAuthenticated) {
      if (onRequireAuth) onRequireAuth(actionMsg);
      return false;
    }
    return true;
  };

  // Viewer/Host Actions
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !ensureAuth(
        lang === 'bn' ? 'লাইভে কমেন্ট করতে লগইন করুন!' : 'Login to comment in live!'
      )
    ) {
      return;
    }
    if (!inputMsg.trim() || !liveStreamId) return;
    if (stream?.chatEnabled === false && !canManage) return;

    const msgText = inputMsg.trim().slice(0, 400);
    setInputMsg('');
    try {
      await addDocument(`live_streams/${liveStreamId}/chat`, {
        userId: currentUser.id,
        userName: isAdminView ? `${currentUser.name} (Admin)` : currentUser.name,
        userAvatar: currentUser.avatar,
        text: msgText,
        type: 'chat',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!liveStreamId || !stream) return;
    if (!isMuted) playPopSound();

    const icons = ['❤️', '🔥', '✨', '💚', '👏'];
    const newIcon = {
      id: Date.now() + Math.random(),
      x: Math.random() * 60 - 30,
      icon: icons[Math.floor(Math.random() * icons.length)],
    };
    setFloatingIcons((prev) => [...prev, newIcon]);
    setTimeout(() => {
      setFloatingIcons((prev) => prev.filter((i) => i.id !== newIcon.id));
    }, 1100);

    setStream((prev) => (prev ? { ...prev, likesCount: (prev.likesCount || 0) + 1 } : prev));
    if (isAuthenticated && isFirebaseSignedIn) {
      updateDocument('live_streams', liveStreamId, { likesCount: increment(1) }).catch((err) =>
        console.error(err)
      );
    }
  };

  const handleStageDoubleTap = () => {
    const now = Date.now();
    if (now - lastStageTapRef.current < 320) {
      handleLike();
    }
    lastStageTapRef.current = now;
  };

  const handleQuickGiftSend = (gift: GiftItem) => {
    if (!stream) return;
    if (
      !ensureAuth(
        lang === 'bn' ? 'লাইভে গিফট পাঠাতে লগইন করুন!' : 'Login to send live gifts!'
      )
    ) {
      return;
    }
    if (onQuickGift) {
      onQuickGift(gift, stream);
      if (!isMuted) playSuccessChime();
      const burst = {
        id: Date.now() + Math.random(),
        x: Math.random() * 44 - 22,
        icon: gift.icon,
      };
      setFloatingIcons((prev) => [...prev, burst]);
      setTimeout(() => {
        setFloatingIcons((prev) => prev.filter((i) => i.id !== burst.id));
      }, 1200);
    } else {
      onOpenGift(stream);
    }
  };

  // Host & Admin Controls
  const updateStreamField = async (patch: Partial<LiveStream>, notice?: string) => {
    if (!liveStreamId || !canManage) return;
    if (!isFirebaseSignedIn || (isAdminView && !isAdminFirebaseAuthed)) {
      flashStudioNotice('⚠️ কন্ট্রোল করতে এডমিন Google অ্যাকাউন্টে সাইন-ইন করুন!');
      return;
    }
    const prevStream = stream;
    setStream((prev) => (prev ? { ...prev, ...patch } : prev));
    try {
      await updateDocument('live_streams', liveStreamId, patch);
      if (!isMuted) playPopSound();
      if (notice) flashStudioNotice(notice);
    } catch (err) {
      console.error('Stream update error:', err);
      setStream(prevStream);
      flashStudioNotice(
        lang === 'bn'
          ? '⚠️ পরিবর্তন সেভ হয়নি! এডমিন Google অ্যাকাউন্টে লগইন নিশ্চিত করুন।'
          : '⚠️ Update failed. Ensure signed in as Admin.'
      );
    }
  };

  const handleToggleMode = async () => {
    if (!stream || !canManage) return;
    const nextMode = stream.mode === 'audio' ? 'video' : 'audio';
    await updateStreamField(
      {
        mode: nextMode,
        isCameraOn: nextMode === 'video',
      },
      nextMode === 'video' ? '📹 ভিডিও লাইভে পরিবর্তন করা হয়েছে' : '🎙️ অডিও আড্ডায় পরিবর্তন করা হয়েছে'
    );
    if (liveStreamId) {
      addDocument(`live_streams/${liveStreamId}/chat`, {
        userId: currentUser.id,
        userName: isAdminView ? 'Admin' : currentUser.name,
        userAvatar: currentUser.avatar,
        text:
          nextMode === 'video'
            ? lang === 'bn'
              ? `${isAdminView ? 'এডমিন' : 'হোস্ট'} লাইভ ভিডিও মোডে পরিবর্তন করেছেন 📹`
              : `${isAdminView ? 'Admin' : 'Host'} switched to Video Live mode 📹`
            : lang === 'bn'
            ? `${isAdminView ? 'এডমিন' : 'হোস্ট'} অডিও আড্ডা মোডে পরিবর্তন করেছেন 🎙️`
            : `${isAdminView ? 'Admin' : 'Host'} switched to Audio Adda mode 🎙️`,
        type: 'system',
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
  };

  const handleSaveHostMeta = async () => {
    if (!canManage) return;
    await updateStreamField(
      {
        title: titleEditInput.trim() || stream?.title,
        pinnedNotice: pinInput.trim(),
      },
      '✅ লাইভ শিরোনাম ও পিন নোটিশ আপডেট হয়েছে'
    );
    setShowManagePanel(false);
  };

  const handleSendAdminWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveStreamId || !isAdmin || !adminWarningText.trim()) return;
    if (!isFirebaseSignedIn || !isAdminFirebaseAuthed) {
      flashStudioNotice('⚠️ সতর্কবার্তা পাঠাতে এডমিন Google অ্যাকাউন্টে সাইন-ইন করুন!');
      return;
    }
    const warn = adminWarningText.trim().slice(0, 220);
    setAdminWarningText('');
    setShowAdminWarningDrawer(false);
    try {
      await Promise.all([
        updateDocument('live_streams', liveStreamId, {
          pinnedNotice: `⚠️ এডমিন সতর্কবার্তা: ${warn}`,
        }),
        addDocument(`live_streams/${liveStreamId}/chat`, {
          userId: currentUser.id || 'admin',
          userName: 'Admin',
          userAvatar: currentUser.avatar || '',
          text: `⚠️ এডমিন সতর্কবার্তা: ${warn}`,
          type: 'system',
          createdAt: new Date().toISOString(),
        }),
      ]);
      if (!isMuted) playSuccessChime();
      flashStudioNotice('⚠️ লাইভে এডমিন সতর্কবার্তা পাঠানো হয়েছে!');
    } catch (err) {
      console.error('Admin warning error:', err);
      flashStudioNotice('⚠️ সতর্কবার্তা পাঠানো যায়নি। এডমিন লগইন চেক করুন।');
    }
  };

  const handleClearAllChat = async () => {
    if (!liveStreamId || !canManage || messages.length === 0) return;
    if (!isFirebaseSignedIn || (isAdminView && !isAdminFirebaseAuthed)) {
      flashStudioNotice('⚠️ চ্যাট ক্লিয়ার করতে আগে Google অ্যাকাউন্টে সাইন-ইন করুন!');
      return;
    }
    const toDelete = [...messages];
    setMessages([]);
    try {
      await Promise.all(
        toDelete.map((m) => deleteDocument(`live_streams/${liveStreamId}/chat`, m.id).catch(() => {}))
      );
      flashStudioNotice('🧹 লাইভের সকল চ্যাট ক্লিয়ার করা হয়েছে');
    } catch {
      flashStudioNotice('⚠️ চ্যাট ক্লিয়ার করতে সমস্যা হয়েছে');
    }
  };

  const handleDeleteComment = async (msgId: string) => {
    if (!liveStreamId || !canManage) return;
    if (!isFirebaseSignedIn || (isAdminView && !isAdminFirebaseAuthed)) {
      flashStudioNotice('⚠️ কমেন্ট মুছতে আগে Google অ্যাকাউন্টে সাইন-ইন করুন!');
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await deleteDocument(`live_streams/${liveStreamId}/chat`, msgId);
      flashStudioNotice('🗑️ কমেন্ট মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  // Speaker Request (Audio Adda)
  const myPendingRequest = requests.find(
    (r) => r.userId === currentUser.id && r.status === 'pending'
  );
  const coHosts = stream?.coHosts || [];
  const amICoHost = coHosts.some((c) => c.id === currentUser.id);
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const handleToggleRaiseHand = async () => {
    if (
      !ensureAuth(
        lang === 'bn' ? 'আড্ডায় যোগ দিতে লগইন করুন!' : 'Login to request speaking!'
      )
    ) {
      return;
    }
    if (!liveStreamId || !stream || isHost) return;

    if (amICoHost) {
      const updated = coHosts.filter((c) => c.id !== currentUser.id);
      await updateDocument('live_streams', liveStreamId, { coHosts: updated }).catch(() => {});
      return;
    }

    if (myPendingRequest) {
      await deleteDocument(`live_streams/${liveStreamId}/requests`, myPendingRequest.id).catch(
        () => {}
      );
      return;
    }

    await setDocument(`live_streams/${liveStreamId}/requests`, currentUser.id, {
      id: currentUser.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }).catch(() => {});
  };

  const handleApproveSpeaker = async (req: LiveSpeakerRequest) => {
    if (!liveStreamId || !stream || !canManage) return;
    const nextSeat: LiveCoHost = {
      id: req.userId,
      name: req.userName,
      avatar: req.userAvatar,
      isMuted: false,
      joinedAt: new Date().toISOString(),
    };
    const nextCoHosts = [
      ...coHosts.filter((c) => c.id !== req.userId),
      nextSeat,
    ].slice(0, 5);

    await Promise.all([
      updateStreamField({ coHosts: nextCoHosts }, `🎙️ ${req.userName}-কে স্পিকার করা হয়েছে`),
      deleteDocument(`live_streams/${liveStreamId}/requests`, req.id),
      addDocument(`live_streams/${liveStreamId}/chat`, {
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        text:
          lang === 'bn'
            ? `${req.userName} অডিও আড্ডার স্পিকার সিটে যোগ দিয়েছেন 🎙️`
            : `${req.userName} joined the speaker stage 🎙️`,
        type: 'system',
        createdAt: new Date().toISOString(),
      }),
    ]).catch(() => {});
  };

  const handleRejectSpeaker = async (reqId: string) => {
    if (!liveStreamId || !canManage) return;
    await deleteDocument(`live_streams/${liveStreamId}/requests`, reqId).catch(() => {});
  };

  const handleToggleCoHostMute = async (coHostId: string) => {
    if (!canManage || !stream) return;
    const updated = coHosts.map((c) =>
      c.id === coHostId ? { ...c, isMuted: !c.isMuted } : c
    );
    await updateStreamField({ coHosts: updated });
  };

  const handleRemoveCoHost = async (coHostId: string) => {
    if (!canManage || !stream) return;
    const updated = coHosts.filter((c) => c.id !== coHostId);
    await updateStreamField({ coHosts: updated }, 'স্পিকারকে সিট থেকে সরানো হয়েছে');
  };

  const handleEndSession = async () => {
    if (!liveStreamId || isCancellingLive) return;
    const byAdmin = Boolean(isAdmin && !isHost);
    if (!isFirebaseSignedIn || (byAdmin && !isAdminFirebaseAuthed)) {
      flashStudioNotice('⚠️ লাইভ ক্যানসেল করতে উপরের বাটন থেকে এডমিন Google অ্যাকাউন্টে লগইন করুন!');
      return;
    }
    setIsCancellingLive(true);
    stopLocalMedia();
    closeAllHostPeers();
    closeViewerPeer();

    const reasonClean = adminCancelReason.trim() || undefined;

    try {
      if (onEndLive) {
        await onEndLive(liveStreamId, byAdmin, reasonClean);
      } else {
        await updateDocument('live_streams', liveStreamId, {
          status: 'ended',
          endedAt: new Date().toISOString(),
          ...(byAdmin
            ? {
                cancelledByAdmin: true,
                cancelReason: reasonClean || 'এডমিন নীতিমালার কারণে লাইভটি বাতিল করা হয়েছে',
              }
            : {}),
        });
      }
      setAdminCancelReason('');
      setConfirmEndStep(false);
      onClose();
    } catch (err) {
      console.error('Failed to cancel/end live:', err);
      flashStudioNotice(
        lang === 'bn'
          ? '⚠️ লাইভ ক্যানসেল ব্যর্থ হয়েছে! এডমিন Google অ্যাকাউন্ট (mdmasudranabd80814@gmail.com) দিয়ে লগইন করুন।'
          : '⚠️ Failed to end live! Ensure signed in with Admin Google account.'
      );
    } finally {
      setIsCancellingLive(false);
    }
  };

  const liveEnded = stream?.status === 'ended';
  const isVideoMode = stream?.mode === 'video';
  const displayedViewersCount = Math.max(
    stream?.viewersCount || 0,
    viewers.length > 0 ? viewers.length : stream?.viewersCount || 0
  );
  const effectiveAudioLevel = isHost ? audioLevel : remoteHostAudioLevel;

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center">
      {/* Hidden Remote Audio Element for WebRTC Live Voice Playback (Video & Audio Adda) */}
      {!isHost && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          muted={isMonitorMuted}
          className="hidden"
        />
      )}

      {/* Full-Screen Mobile Studio Frame */}
      <div className="w-full max-w-md h-[100dvh] bg-[#060d09] text-white flex flex-col relative overflow-hidden">
        {/* BACKGROUND VIDEO STAGE (when Video Mode is active & not ended) */}
        {isVideoMode && !liveEnded && (
          <div
            onClick={handleStageDoubleTap}
            className="absolute inset-0 z-0 bg-black select-none"
          >
            {isHost && stream?.isCameraOn !== false && !mediaPermissionNote ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : !isHost && stream?.isCameraOn !== false && hasRemoteVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={isMonitorMuted}
                className="w-full h-full object-cover"
              />
            ) : !isHost && stream?.isCameraOn !== false && livePreviewFrame ? (
              <img
                src={livePreviewFrame}
                alt={stream?.hostName || 'Live Camera'}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <img
                  src={stream?.hostAvatar || currentUser.avatar}
                  alt={stream?.hostName || 'Host'}
                  className="w-full h-full object-cover opacity-40 blur-md scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-[#07120c]/55 to-black/95" />
                <div className="absolute inset-x-0 top-[24%] flex flex-col items-center text-center px-6 pointer-events-none">
                  <div className="relative mb-3">
                    <div
                      className="absolute -inset-2 rounded-full border-2 border-rose-500/70 transition-transform duration-150"
                      style={{
                        transform:
                          !stream?.isMicMuted && effectiveAudioLevel > 10
                            ? `scale(${1 + effectiveAudioLevel / 250})`
                            : 'scale(1)',
                      }}
                    />
                    <img
                      src={stream?.hostAvatar || currentUser.avatar}
                      alt={stream?.hostName || 'Host'}
                      className="w-24 h-24 rounded-full object-cover border-2 border-rose-500 shadow-2xl relative z-10"
                    />
                    {stream?.isCameraOn === false && (
                      <span className="absolute -bottom-1 -right-1 z-20 w-8 h-8 rounded-full bg-neutral-900 border border-rose-500/60 flex items-center justify-center text-rose-400">
                        <VideoOff className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-white drop-shadow">{stream?.hostName}</h4>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xs">
                    {mediaPermissionNote
                      ? mediaPermissionNote
                      : stream?.isCameraOn === false
                      ? lang === 'bn'
                        ? isAdminView
                          ? 'ক্যামেরা বন্ধ করা আছে (মাইক/চ্যাট কন্ট্রোল চালু)'
                          : 'হোস্ট ক্যামেরা সাময়িক বন্ধ রেখেছেন'
                        : 'Camera paused'
                      : lang === 'bn'
                      ? 'লাইভ ভিডিও ফিড সংযুক্ত হচ্ছে · ডাবল-ট্যাপ করে লাইক দিন ❤️'
                      : 'Connecting live video feed · Double tap to like ❤️'}
                  </p>
                </div>
              </>
            )}
            {/* Top & bottom legibility scrims */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-[56%] bg-gradient-to-t from-black/95 via-black/65 to-transparent pointer-events-none" />
          </div>
        )}

        {/* BACKGROUND AUDIO ROOM ATMOSPHERE */}
        {!isVideoMode && !liveEnded && (
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_rgba(7,14,10,0.96)_58%)] pointer-events-none" />
        )}

        {/* Studio Toast Notification */}
        {studioNotice && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-black shadow-2xl whitespace-nowrap animate-in fade-in">
            {studioNotice}
          </div>
        )}

        {/* Floating Hearts & Gifts Overlay */}
        {floatingIcons.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-32 right-8 text-3xl pointer-events-none animate-floatUp z-30 drop-shadow-lg"
            style={{ transform: `translateX(${item.x}px)` }}
          >
            {item.icon}
          </div>
        ))}

        {/* TOP BROADCAST HUD BAR */}
        <div className="relative z-20 px-3 pt-3 pb-1.5 flex items-center justify-between gap-2 shrink-0">
          {/* Left: Host Pill + Follow Button */}
          <div className="flex items-center gap-2 min-w-0 bg-black/55 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 pr-2.5 max-w-[66%]">
            <button
              type="button"
              onClick={() => {
                if (stream?.hostId && onOpenProfile) {
                  onClose();
                  onOpenProfile(stream.hostId);
                }
              }}
              className="relative shrink-0 cursor-pointer"
            >
              <img
                src={stream?.hostAvatar || currentUser.avatar}
                alt={stream?.hostName || 'Host'}
                className="w-10 h-10 rounded-xl object-cover border-2 border-rose-500"
              />
              {!liveEnded && (
                <span className="absolute -bottom-1 -right-1 px-1 rounded bg-rose-600 text-[8px] font-black text-white uppercase tracking-wider border border-black">
                  LIVE
                </span>
              )}
            </button>

            <div className="min-w-0">
              <p className="font-extrabold text-xs text-white truncate leading-tight">
                {stream?.title || (lang === 'bn' ? 'লাইভ লোড হচ্ছে...' : 'Loading live...')}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 mt-0.5 truncate">
                <span className="font-semibold text-emerald-300 truncate">{stream?.hostName}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 font-mono text-amber-300 shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  {elapsedText}
                </span>
              </div>
            </div>

            {!isHost && !isAdminView && stream?.hostId && onToggleFollow && !liveEnded && (
              <button
                type="button"
                onClick={() => onToggleFollow(stream.hostId, stream.hostName)}
                className={`shrink-0 min-h-[30px] px-2.5 rounded-xl text-[10px] font-black transition cursor-pointer ${
                  isFollowingHost
                    ? 'bg-white/15 text-neutral-200 border border-white/20'
                    : 'bg-[#00c853] hover:bg-[#00e676] text-black shadow'
                }`}
              >
                {isFollowingHost ? (lang === 'bn' ? '✓ ফলোয়িং' : '✓') : (lang === 'bn' ? '+ ফলো' : '+ Follow')}
              </button>
            )}
          </div>

          {/* Right: Viewers Badge + Monitor Audio + Share + Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowViewersDrawer(true)}
              className="min-h-[38px] px-2.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-1 cursor-pointer hover:bg-black/75"
              title={lang === 'bn' ? 'সক্রিয় দর্শক' : 'Active Viewers'}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toBengaliNumber(displayedViewersCount, lang)}</span>
            </button>

            {!isHost && !liveEnded && (
              <button
                type="button"
                onClick={() => setIsMonitorMuted((m) => !m)}
                className={`min-w-[38px] min-h-[38px] rounded-xl backdrop-blur-md border flex items-center justify-center transition cursor-pointer ${
                  isMonitorMuted
                    ? 'bg-rose-950/75 border-rose-500/40 text-rose-300'
                    : 'bg-black/55 border-white/10 text-cyan-300 hover:bg-black/75'
                }`}
                title={isMonitorMuted ? 'সাউন্ড চালু করুন' : 'সাউন্ড মিউট করুন'}
              >
                {isMonitorMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {onShare && stream && !liveEnded && !isAdminView && (
              <button
                type="button"
                onClick={() => onShare(stream)}
                className="min-w-[38px] min-h-[38px] rounded-xl bg-black/55 backdrop-blur-md border border-white/10 hover:bg-black/75 text-emerald-300 flex items-center justify-center transition cursor-pointer"
                title={lang === 'bn' ? 'লাইভ শেয়ার করুন' : 'Share Live'}
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-w-[38px] min-h-[38px] rounded-xl bg-black/55 backdrop-blur-md border border-white/10 hover:bg-rose-600/80 text-white flex items-center justify-center transition cursor-pointer"
              title={lang === 'bn' ? 'বন্ধ / মিনিমাইজ' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ADMIN FULL-CONTROL COMMAND BAR (Visible whenever Admin opens a user's live!) */}
        {isAdminView && stream && !liveEnded && (
          <div className="relative z-20 mx-3 mb-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-950/70 to-black/80 backdrop-blur-md border border-amber-400/40 flex items-center justify-between gap-2 shrink-0 shadow-lg">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300">
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'bn' ? 'এডমিন ফুল কন্ট্রোল' : 'ADMIN FULL CONTROL'}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                  <Wifi className="w-2.5 h-2.5" />
                  {!isAdminFirebaseAuthed
                    ? 'Google Auth Needed'
                    : hasRemoteVideo
                    ? 'WebRTC HD'
                    : livePreviewFrame
                    ? 'Live Cam Feed'
                    : hasRemoteAudio
                    ? 'Live Audio'
                    : rtcStatus === 'relay'
                    ? 'Telemetry Live'
                    : 'Connecting'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-300 mt-0.5">
                🎁 হোস্ট: <b className="text-amber-300">{toBengaliNumber(stream.giftsTotalPoints || 0, lang)}</b> · 👑 কমিশন:{' '}
                <b className="text-emerald-300">{toBengaliNumber(stream.adminGiftPoints || 0, lang)}</b>
              </p>
            </div>

            {!isAdminFirebaseAuthed ? (
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="shrink-0 min-h-[38px] px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition"
              >
                <span>🔐 Google সাইন-ইন</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmEndStep(true)}
                className="shrink-0 min-h-[38px] px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ক্যানসেল লাইভ' : 'Cancel Live'}</span>
              </button>
            )}
          </div>
        )}

        {/* SUB-HUD STATS & PINNED NOTICE */}
        {!liveEnded && (
          <div className="relative z-20 px-3 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-xl bg-black/40 backdrop-blur-sm border border-white/5">
              <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>
                  {isVideoMode
                    ? lang === 'bn'
                      ? 'লাইভ ভিডিও স্টুডিও'
                      : 'LIVE VIDEO'
                    : lang === 'bn'
                    ? 'অডিও আড্ডা রুম'
                    : 'AUDIO ADDA'}
                  {stream?.category ? ` · ${stream.category}` : ''}
                </span>
              </span>

              <span className="font-bold text-amber-300 flex items-center gap-2">
                <span>
                  🎁 {toBengaliNumber(stream?.giftsTotalPoints || 0, lang)}
                  {lang === 'bn' ? ' পয়েন্ট' : ' pts'}
                </span>
                {isAdmin && (stream?.adminGiftPoints || 0) > 0 && (
                  <span className="text-emerald-300">
                    👑 {toBengaliNumber(stream?.adminGiftPoints || 0, lang)}
                  </span>
                )}
              </span>
            </div>

            {stream?.pinnedNotice && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/25 backdrop-blur-md border border-amber-400/40 text-[11px] text-amber-100 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate font-semibold">{stream.pinnedNotice}</span>
              </div>
            )}
          </div>
        )}

        {/* LIVE ENDED / CANCELLED VIEW */}
        {liveEnded ? (
          <div className="relative z-20 flex-1 flex items-center justify-center p-6">
            <div className="w-full p-6 rounded-3xl bg-[#101c15] border border-rose-500/30 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8 text-rose-400" />
              </div>
              <h4 className="font-black text-lg text-white">
                {stream?.cancelledByAdmin
                  ? lang === 'bn'
                    ? 'এডমিন এই লাইভটি ক্যানসেল করেছেন'
                    : 'This live session was cancelled by Admin'
                  : lang === 'bn'
                  ? 'এই লাইভ সেশনটি শেষ হয়েছে'
                  : 'This live session has ended'}
              </h4>
              {stream?.cancelReason && (
                <p className="text-xs text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-xl px-3 py-2">
                  {lang === 'bn' ? 'কারণ:' : 'Reason:'} {stream.cancelReason}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-emerald-950">
                  <span className="text-neutral-400 block text-[10px]">
                    {lang === 'bn' ? 'মোট লাইক' : 'Total Likes'}
                  </span>
                  <b className="text-base text-rose-400">❤️ {toBengaliNumber(stream?.likesCount || 0, lang)}</b>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-emerald-950">
                  <span className="text-neutral-400 block text-[10px]">
                    {lang === 'bn' ? 'হোস্ট গিফট' : 'Host Gifts'}
                  </span>
                  <b className="text-base text-amber-300">🎁 {toBengaliNumber(stream?.giftsTotalPoints || 0, lang)}</b>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[46px] rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs cursor-pointer"
              >
                {lang === 'bn' ? 'ফিরে যান' : 'Go Back'}
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE FULL-SCREEN BODY */
          <div className="relative z-20 flex-1 flex flex-col justify-end min-h-0 px-3 pb-3 pt-2">
            {/* AUDIO ADDA STAGE (Only in Audio Mode) */}
            {!isVideoMode && (
              <div className="rounded-3xl bg-[#0e1a14]/90 backdrop-blur-md border border-emerald-900/60 p-4 mb-2.5 space-y-3 shrink-0 shadow-xl">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {/* Host Seat */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div
                        className="absolute -inset-2 rounded-full transition-transform duration-100 pointer-events-none"
                        style={{
                          border: stream?.isMicMuted
                            ? '2px solid rgba(244,63,94,0.4)'
                            : '2px solid rgba(0,230,118,0.85)',
                          transform:
                            !stream?.isMicMuted && effectiveAudioLevel > 10
                              ? `scale(${1 + effectiveAudioLevel / 260})`
                              : 'scale(1)',
                        }}
                      />
                      <img
                        src={stream?.hostAvatar || currentUser.avatar}
                        alt={stream?.hostName || 'Host'}
                        className="w-20 h-20 rounded-full object-cover relative z-10 bg-neutral-900"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 z-20 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#0e1a14] ${
                          stream?.isMicMuted
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-500 text-black'
                        }`}
                      >
                        {stream?.isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-white mt-2 max-w-[110px] truncate">
                      {stream?.hostName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {lang === 'bn' ? 'হোস্ট' : 'Host'}
                    </span>
                  </div>

                  {/* Co-Host / Speaker Seats */}
                  {coHosts.map((seat) => (
                    <div key={seat.id} className="flex flex-col items-center relative">
                      <div className="relative">
                        <img
                          src={seat.avatar}
                          alt={seat.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400/70 bg-neutral-900"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0e1a14] ${
                            seat.isMuted ? 'bg-rose-600 text-white' : 'bg-cyan-400 text-black'
                          }`}
                        >
                          {seat.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-neutral-200 mt-1.5 max-w-[80px] truncate">
                        {seat.name}
                      </span>
                      {canManage ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCoHostMute(seat.id)}
                            className="text-[10px] text-cyan-300 hover:underline cursor-pointer"
                          >
                            {seat.isMuted
                              ? lang === 'bn'
                                ? 'আনমিউট'
                                : 'Unmute'
                              : lang === 'bn'
                              ? 'মিউট'
                              : 'Mute'}
                          </button>
                          <span className="text-neutral-600">·</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoHost(seat.id)}
                            className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                          >
                            {lang === 'bn' ? 'সরান' : 'Drop'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-cyan-300">
                          {lang === 'bn' ? 'স্পিকার' : 'Speaker'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Audio stage action row */}
                <div className="flex items-center justify-between pt-2.5 border-t border-emerald-950/80">
                  {!isHost && !isAdminView && stream?.allowSpeakerRequests !== false ? (
                    <button
                      type="button"
                      onClick={handleToggleRaiseHand}
                      className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        amICoHost
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : myPendingRequest
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-[#1a2c22] hover:bg-[#233b2e] text-emerald-300 border border-emerald-900'
                      }`}
                    >
                      <Hand className="w-4 h-4" />
                      <span>
                        {amICoHost
                          ? lang === 'bn'
                            ? 'সিট ছাড়ুন'
                            : 'Leave Seat'
                          : myPendingRequest
                          ? lang === 'bn'
                            ? 'রিকোয়েস্ট পাঠানো হয়েছে'
                            : 'Requested'
                          : lang === 'bn'
                          ? 'আড্ডায় যোগ দিন'
                          : 'Join Adda'}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-neutral-300 truncate max-w-[65%]">
                      {mediaPermissionNote ||
                        (stream?.isMicMuted
                          ? lang === 'bn'
                            ? '🔇 হোস্টের মাইক মিউট করা আছে'
                            : 'Host mic muted'
                          : isAdminView
                          ? hasRemoteAudio
                            ? '🔊 লাইভ অডিও শোনা যাচ্ছে'
                            : '🎙️ ভয়েস আড্ডা মনিটর সক্রিয়'
                          : lang === 'bn'
                          ? 'সরাসরি ভয়েস আড্ডা চলছে'
                          : 'Live audio adda active')}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleLike}
                    className="min-h-[40px] px-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{toBengaliNumber(stream?.likesCount || 0, lang)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE CHAT OVERLAY / FEED */}
            <div
              ref={chatScrollRef}
              className={`overflow-y-auto space-y-1.5 no-scrollbar text-xs mb-2.5 ${
                isVideoMode
                  ? 'max-h-[30vh] pr-12'
                  : 'flex-1 min-h-[120px] p-3 rounded-2xl bg-[#0b140f]/80 border border-emerald-950/90'
              }`}
            >
              {messages.map((m) => {
                if (m.type === 'gift') {
                  return (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-gradient-to-r from-amber-500/30 to-rose-500/25 backdrop-blur-md border border-amber-400/40 flex items-center justify-between gap-2 animate-in fade-in"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">{m.giftIcon || '🎁'}</span>
                        <div className="min-w-0">
                          <span className="font-extrabold text-amber-200">{m.userName}</span>{' '}
                          <span className="text-white font-medium">{m.text}</span>
                        </div>
                      </div>
                      {m.giftPoints && (
                        <span className="shrink-0 text-[10px] font-black text-amber-300">
                          +{toBengaliNumber(m.giftPoints, lang)}
                        </span>
                      )}
                    </div>
                  );
                }

                if (m.type === 'system') {
                  return (
                    <div
                      key={m.id}
                      className="text-[11px] text-emerald-200 bg-emerald-950/75 backdrop-blur-sm px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 border border-emerald-500/25"
                    >
                      <Sparkles className="w-3 h-3 shrink-0 text-emerald-400" />
                      <span>{m.text}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex items-start justify-between gap-2 leading-snug animate-in fade-in ${
                      isVideoMode ? 'bg-black/45 backdrop-blur-sm px-2.5 py-1.5 rounded-xl w-fit max-w-full' : ''
                    }`}
                  >
                    <div className="flex items-start gap-1.5 min-w-0">
                      <span
                        className={`font-extrabold shrink-0 ${
                          m.userId === stream?.hostId
                            ? 'text-rose-400'
                            : m.userId === currentUser.id
                            ? 'text-cyan-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {m.userName}
                        {m.userId === stream?.hostId ? ' (হোস্ট)' : ''}:
                      </span>
                      <span className="text-neutral-100 break-words">{m.text}</span>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(m.id)}
                        className="text-neutral-400 hover:text-rose-400 shrink-0 p-0.5 cursor-pointer"
                        title={lang === 'bn' ? 'কমেন্ট মুছুন' : 'Delete comment'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {messages.length === 0 && (
                <p className="text-center py-4 text-neutral-400 text-[11px]">
                  {lang === 'bn'
                    ? 'প্রথম কমেন্ট করে আড্ডা শুরু করুন...'
                    : 'Be the first to say hello...'}
                </p>
              )}
            </div>

            {/* FLOATING VIDEO LIKE BUTTON (Right edge in Video Mode) */}
            {isVideoMode && (
              <button
                type="button"
                onClick={handleLike}
                className="absolute right-3 bottom-44 z-30 flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition"
                aria-label="Like live"
              >
                <div className="w-11 h-11 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border border-white/20">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[11px] font-extrabold text-white drop-shadow">
                  {toBengaliNumber(stream?.likesCount || 0, lang)}
                </span>
              </button>
            )}

            {/* ADMIN & HOST QUICK CONTROL DOCK */}
            {canManage && stream && (
              <div className={`grid ${isAdminView ? 'grid-cols-5' : 'grid-cols-4'} gap-1.5 mb-2 shrink-0`}>
                <button
                  type="button"
                  onClick={() =>
                    updateStreamField(
                      { isMicMuted: !stream.isMicMuted },
                      !stream.isMicMuted ? '🔇 হোস্টের মাইক মিউট করা হয়েছে' : '🎙️ হোস্টের মাইক চালু করা হয়েছে'
                    )
                  }
                  className={`min-h-[44px] rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border backdrop-blur-md transition cursor-pointer ${
                    stream.isMicMuted
                      ? 'bg-rose-950/85 border-rose-500/50 text-rose-200'
                      : 'bg-black/65 border-white/15 text-emerald-300'
                  }`}
                >
                  {stream.isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{stream.isMicMuted ? (lang === 'bn' ? 'মিউট' : 'Muted') : (lang === 'bn' ? 'মাইক' : 'Mic')}</span>
                </button>

                {isVideoMode ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateStreamField(
                        { isCameraOn: stream.isCameraOn === false },
                        stream.isCameraOn === false ? '📹 ক্যামেরা চালু করা হয়েছে' : '🚫 ক্যামেরা বন্ধ করা হয়েছে'
                      )
                    }
                    className={`min-h-[44px] rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border backdrop-blur-md transition cursor-pointer ${
                      stream.isCameraOn === false
                        ? 'bg-rose-950/85 border-rose-500/50 text-rose-200'
                        : 'bg-black/65 border-white/15 text-emerald-300'
                    }`}
                  >
                    {stream.isCameraOn === false ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span>{lang === 'bn' ? 'ক্যামেরা' : 'Cam'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="min-h-[44px] rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 bg-black/65 backdrop-blur-md border border-white/15 text-cyan-300 hover:bg-black/80 transition cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'ভিডিও অন' : 'Go Video'}</span>
                  </button>
                )}

                {isHost && isVideoMode ? (
                  <button
                    type="button"
                    onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="min-h-[44px] rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 bg-black/65 backdrop-blur-md border border-white/15 text-neutral-100 hover:bg-black/80 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'ফ্লিপ' : 'Flip'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      updateStreamField(
                        { chatEnabled: stream.chatEnabled === false },
                        stream.chatEnabled === false ? '💬 লাইভ চ্যাট চালু হয়েছে' : '🚫 লাইভ চ্যাট লক করা হয়েছে'
                      )
                    }
                    className={`min-h-[44px] rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border backdrop-blur-md transition cursor-pointer ${
                      stream.chatEnabled === false
                        ? 'bg-amber-950/85 border-amber-500/50 text-amber-200'
                        : 'bg-black/65 border-white/15 text-neutral-100'
                    }`}
                  >
                    {stream.chatEnabled === false ? (
                      <MessageSquareOff className="w-4 h-4" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    <span>{stream.chatEnabled === false ? 'চ্যাট অফ' : 'চ্যাট'}</span>
                  </button>
                )}

                {isAdminView && (
                  <button
                    type="button"
                    onClick={() => setShowAdminWarningDrawer(true)}
                    className="min-h-[44px] rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'ওয়ার্নিং' : 'Warn'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowManagePanel(true)}
                  className="min-h-[44px] rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border backdrop-blur-md relative transition cursor-pointer bg-black/65 border-white/15 text-amber-300 hover:bg-black/80"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'স্টুডিও' : 'Studio'}</span>
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* QUICK GIFT TRAY */}
            {!isHost && !isAdminView && showQuickGifts && stream && (
              <div className="mb-2 p-2 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-500/35 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in fade-in shrink-0">
                {GIFTS_LIST.map((gift) => (
                  <button
                    key={gift.id}
                    type="button"
                    onClick={() => handleQuickGiftSend(gift)}
                    className="shrink-0 min-h-[44px] px-2.5 py-1.5 rounded-xl bg-[#0e1712] hover:bg-[#1e3126] border border-emerald-950 flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-lg">{gift.icon}</span>
                    <div className="text-left">
                      <div className="text-[10px] font-bold text-white leading-tight">
                        {lang === 'bn' ? gift.nameBn : gift.nameEn}
                      </div>
                      <div className="text-[10px] text-amber-300 font-bold">
                        {toBengaliNumber(gift.costPoints, lang)}
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickGifts(false);
                    onOpenGift(stream);
                  }}
                  className="shrink-0 min-h-[44px] px-3 rounded-xl bg-amber-500 text-black font-bold text-[11px] cursor-pointer"
                >
                  {lang === 'bn' ? 'সব গিফট' : 'More'}
                </button>
              </div>
            )}

            {/* COMMENT INPUT */}
            {stream?.chatEnabled === false && !canManage ? (
              <div className="min-h-[44px] px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center text-xs text-neutral-300 flex items-center justify-center gap-1.5 mb-2 shrink-0">
                <MessageSquareOff className="w-4 h-4 text-amber-400" />
                <span>
                  {lang === 'bn' ? 'হোস্ট কমেন্ট বন্ধ রেখেছেন' : 'Comments are turned off by host'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSendComment} className="flex gap-2 mb-2 shrink-0">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  maxLength={400}
                  placeholder={
                    isAdminView
                      ? lang === 'bn'
                        ? 'এডমিন হিসেবে লাইভে মেসেজ লিখুন...'
                        : 'Write message as Admin...'
                      : lang === 'bn'
                      ? 'লাইভে কমেন্ট লিখুন...'
                      : 'Write a live comment...'
                  }
                  className="flex-1 min-h-[44px] bg-black/60 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  className="min-w-[44px] min-h-[44px] px-3.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-bold flex items-center justify-center transition cursor-pointer active:scale-95"
                  aria-label="Send comment"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* PRIMARY ACTION ROW */}
            <div className="space-y-2 shrink-0">
              {confirmEndStep && isAdminView && (
                <div className="p-3 rounded-2xl bg-[#140a0e]/95 border border-rose-500/50 space-y-2 shadow-xl">
                  <p className="text-[11px] font-bold text-rose-300">
                    ক্যানসেলের কারণ সিলেক্ট করুন বা লিখুন:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_CANCEL_REASONS_BN.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setAdminCancelReason(reason)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          adminCancelReason === reason
                            ? 'bg-rose-600 text-white border-rose-400'
                            : 'bg-black/50 text-neutral-300 border-white/10 hover:text-white'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={adminCancelReason}
                    onChange={(e) => setAdminCancelReason(e.target.value)}
                    placeholder={lang === 'bn' ? 'অথবা কাস্টম কারণ লিখুন...' : 'Or enter custom reason...'}
                    className="w-full min-h-[40px] bg-black/70 border border-rose-500/40 rounded-xl px-3 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {confirmEndStep ? (
                  <>
                    <button
                      type="button"
                      disabled={isCancellingLive}
                      onClick={handleEndSession}
                      className="flex-1 min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Power className="w-4 h-4" />
                      <span>
                        {isCancellingLive
                          ? 'বন্ধ হচ্ছে...'
                          : isAdminView
                          ? lang === 'bn'
                            ? 'হ্যাঁ, লাইভ ক্যানসেল করুন'
                            : 'Confirm Admin Cancel'
                          : lang === 'bn'
                          ? 'হ্যাঁ, লাইভ বন্ধ করুন'
                          : 'Confirm End Live'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmEndStep(false);
                        setAdminCancelReason('');
                      }}
                      className="min-h-[46px] px-4 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
                    >
                      {lang === 'bn' ? 'না' : 'Cancel'}
                    </button>
                  </>
                ) : isAdminView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmEndStep(true)}
                      className="flex-1 min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'লাইভ ক্যানসেল করুন' : 'Cancel This Live'}</span>
                    </button>
                    {stream?.hostId && onOpenProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenProfile(stream.hostId);
                        }}
                        className="min-h-[46px] px-3.5 rounded-xl bg-black/65 border border-white/15 hover:bg-black/80 text-emerald-300 text-xs font-bold cursor-pointer"
                      >
                        হোস্ট প্রোফাইল
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="min-h-[46px] px-3.5 rounded-xl bg-black/65 border border-white/15 hover:bg-black/80 text-white text-xs font-bold cursor-pointer"
                    >
                      ফিরে যান
                    </button>
                  </>
                ) : !isHost ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowQuickGifts((v) => !v)}
                      className="flex-1 min-h-[46px] rounded-xl bg-gradient-to-r from-[#ff2d55] to-amber-500 hover:brightness-110 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-[0.98]"
                    >
                      <Gift className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'গিফট পাঠান' : 'Send Gift'}</span>
                    </button>

                    {stream && onShare && (
                      <button
                        type="button"
                        onClick={() => onShare(stream)}
                        className="min-h-[46px] px-4 rounded-xl bg-black/60 backdrop-blur-md hover:bg-black/80 border border-white/15 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmEndStep(true)}
                      className="flex-1 min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Power className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'লাইভ বন্ধ করুন' : 'End Live'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="min-h-[46px] px-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 hover:bg-black/80 text-white text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'bn' ? 'মিনিমাইজ' : 'Minimize'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN WARNING DRAWER */}
        {showAdminWarningDrawer && isAdmin && (
          <div
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowAdminWarningDrawer(false)}
          >
            <form
              onSubmit={handleSendAdminWarning}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#131814] border-t border-amber-500/40 rounded-t-3xl p-4 space-y-3 animate-in slide-in-from-bottom-5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>লাইভে জরুরি এডমিন সতর্কবার্তা পাঠান</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAdminWarningDrawer(false)}
                  className="min-w-[36px] min-h-[36px] rounded-xl bg-neutral-900 text-neutral-400 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'অশালীন ভাষা ব্যবহার বন্ধ করুন',
                  'মিথ্যা বা প্রতারণামূলক কথা বলবেন না',
                  'শব্দ বা ভিডিও মান ঠিক করুন',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAdminWarningText(preset)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0a120e] border border-emerald-950 text-[11px] text-neutral-200 hover:border-amber-400 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={adminWarningText}
                onChange={(e) => setAdminWarningText(e.target.value)}
                placeholder="সতর্কবার্তা লিখুন..."
                className="w-full min-h-[44px] bg-black/50 border border-amber-500/40 rounded-xl px-3 text-xs text-white focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs cursor-pointer"
              >
                ⚠️ পিন ও লাইভ চ্যাটে সতর্কবার্তা পাঠান
              </button>
            </form>
          </div>
        )}

        {/* SLIDE-UP STUDIO SETTINGS DRAWER (Host / Admin) */}
        {showManagePanel && canManage && stream && (
          <div
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowManagePanel(false)}
          >
            <div
              className="w-full bg-[#0f1913] border-t border-emerald-900 rounded-t-3xl p-4 space-y-3.5 max-h-[82vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-5 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isAdminView
                      ? '👑 এডমিন লাইভ কন্ট্রোল স্টুডিও'
                      : lang === 'bn'
                      ? 'লাইভ স্টুডিও সেটিংস'
                      : 'Live Studio Settings'}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowManagePanel(false)}
                  className="min-w-[40px] min-h-[40px] rounded-xl hover:bg-neutral-800 text-neutral-400 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode, Chat, Speaker Request Toggles + Clear Chat */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="min-h-[40px] px-3 rounded-xl bg-[#0a120e] border border-emerald-900 text-cyan-300 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isVideoMode ? <Mic className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                  <span>
                    {isVideoMode
                      ? lang === 'bn'
                        ? 'অডিও আড্ডায় নিন'
                        : 'Switch to Audio Adda'
                      : lang === 'bn'
                      ? 'লাইভ ভিডিওতে নিন'
                      : 'Switch to Video'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateStreamField({ chatEnabled: stream.chatEnabled === false })
                  }
                  className="min-h-[40px] px-3 rounded-xl bg-[#0a120e] border border-emerald-900 text-neutral-200 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {stream.chatEnabled === false ? (
                    <MessageSquareOff className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>
                    {stream.chatEnabled === false
                      ? lang === 'bn'
                        ? 'চ্যাট বন্ধ'
                        : 'Chat Off'
                      : lang === 'bn'
                      ? 'চ্যাট চালু'
                      : 'Chat On'}
                  </span>
                </button>

                {!isVideoMode && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStreamField({ allowSpeakerRequests: stream.allowSpeakerRequests === false })
                    }
                    className="min-h-[40px] px-3 rounded-xl bg-[#0a120e] border border-emerald-900 text-neutral-200 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Hand className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {stream.allowSpeakerRequests === false
                        ? lang === 'bn'
                          ? 'স্পিকার রিকোয়েস্ট অফ'
                          : 'Requests Off'
                        : lang === 'bn'
                        ? 'স্পিকার রিকোয়েস্ট অন'
                        : 'Requests On'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearAllChat}
                  className="min-h-[40px] px-3 rounded-xl bg-rose-950/60 border border-rose-700/40 text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>সব চ্যাট মুছুন ({toBengaliNumber(messages.length, lang)})</span>
                </button>
              </div>

              {/* Edit Title & Pin */}
              <div className="space-y-2">
                <label className="text-[11px] text-neutral-400 font-semibold block">
                  {lang === 'bn' ? 'লাইভের শিরোনাম ও পিন নোটিশ:' : 'Live Title & Pinned Notice:'}
                </label>
                <input
                  type="text"
                  value={titleEditInput}
                  onChange={(e) => setTitleEditInput(e.target.value)}
                  placeholder={lang === 'bn' ? 'লাইভের শিরোনাম...' : 'Live title...'}
                  className="w-full min-h-[42px] bg-[#0a120e] border border-emerald-950 rounded-xl px-3 text-xs text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder={lang === 'bn' ? 'পিন নোটিশ লিখুন...' : 'Pinned notice...'}
                    className="flex-1 min-h-[42px] bg-[#0a120e] border border-emerald-950 rounded-xl px-3 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveHostMeta}
                    className="min-h-[42px] px-4 rounded-xl bg-[#00c853] text-black font-extrabold text-xs cursor-pointer"
                  >
                    {lang === 'bn' ? 'সেভ' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Active Speakers Control */}
              {coHosts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-emerald-950">
                  <p className="text-[11px] font-bold text-cyan-300">
                    স্পিকার সিট কন্ট্রোল ({toBengaliNumber(coHosts.length, lang)})
                  </p>
                  {coHosts.map((seat) => (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between bg-[#0a120e] p-2.5 rounded-xl border border-emerald-950"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={seat.avatar} alt={seat.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="truncate font-bold text-white">{seat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCoHostMute(seat.id)}
                          className="min-h-[34px] px-2.5 rounded-xl bg-neutral-800 text-cyan-300 font-bold cursor-pointer"
                        >
                          {seat.isMuted ? 'আনমিউট' : 'মিউট'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoHost(seat.id)}
                          className="min-h-[34px] px-2.5 rounded-xl bg-rose-950 text-rose-300 font-bold cursor-pointer"
                        >
                          রিমুভ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Speaker Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-emerald-950">
                  <p className="text-[11px] font-bold text-amber-300">
                    {lang === 'bn'
                      ? `স্পিকার রিকোয়েস্ট (${toBengaliNumber(pendingRequests.length, lang)})`
                      : `Speaker Requests (${pendingRequests.length})`}
                  </p>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between bg-[#0a120e] p-2.5 rounded-xl border border-emerald-950"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={req.userAvatar} alt={req.userName} className="w-8 h-8 rounded-full object-cover" />
                        <span className="truncate font-bold text-white">{req.userName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApproveSpeaker(req)}
                          className="min-w-[38px] min-h-[38px] rounded-xl bg-emerald-500 text-black flex items-center justify-center cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectSpeaker(req.id)}
                          className="min-w-[38px] min-h-[38px] rounded-xl bg-rose-950 text-rose-300 flex items-center justify-center cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Force End / Cancel inside Studio Drawer */}
              {isAdminView && (
                <div className="pt-2 border-t border-emerald-950">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManagePanel(false);
                      setConfirmEndStep(true);
                    }}
                    className="w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>🛑 এই লাইভ ক্যানসেল / বন্ধ করুন</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEWERS LIST DRAWER */}
        {showViewersDrawer && (
          <div
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowViewersDrawer(false)}
          >
            <div
              className="w-full bg-[#0f1913] border-t border-emerald-900 rounded-t-3xl p-4 space-y-3 max-h-[65vh] flex flex-col animate-in slide-in-from-bottom-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>
                    {lang === 'bn'
                      ? `দর্শক তালিকা (${toBengaliNumber(displayedViewersCount, lang)})`
                      : `Viewers (${displayedViewersCount})`}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowViewersDrawer(false)}
                  className="min-w-[40px] min-h-[40px] rounded-xl hover:bg-neutral-800 text-neutral-400 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                {viewers.length === 0 ? (
                  <p className="text-center py-8 text-xs text-neutral-400">
                    {lang === 'bn' ? 'এখনো দর্শকদের তথ্য লোড হয়নি।' : 'No viewer details available yet.'}
                  </p>
                ) : (
                  viewers.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#0a120e] border border-emerald-950"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenProfile) {
                            setShowViewersDrawer(false);
                            onClose();
                            onOpenProfile(v.id);
                          }
                        }}
                        className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                      >
                        <img src={v.avatar} alt={v.name} className="w-9 h-9 rounded-full object-cover border border-emerald-800" />
                        <span className="text-xs font-bold text-white truncate">{v.name}</span>
                      </button>

                      {canManage &&
                        stream &&
                        v.id !== stream.hostId &&
                        !coHosts.some((c) => c.id === v.id) &&
                        stream.mode === 'audio' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleApproveSpeaker({
                                id: v.id,
                                userId: v.id,
                                userName: v.name,
                                userAvatar: v.avatar,
                                status: 'pending',
                                createdAt: v.joinedAt,
                              })
                            }
                            className="min-h-[34px] px-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'স্পিকার করুন' : 'Invite'}</span>
                          </button>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
