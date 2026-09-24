import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  Eye,
  FlipHorizontal,
  GraduationCap,
  History,
  Image as ImageIcon,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  User,
  UserCheck,
  Upload,
  X,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';
import { apiJson } from '@/src/lib/api';
import {
  AttendanceRecord,
  AttendanceResponse,
  AttendanceStatus,
  formatAttendanceMinutes,
  getAttendanceProgress,
  getManilaDateKey,
  getOpenSessionMinutes,
} from '@/src/lib/attendance';
import { useUserAvatar } from '@/src/lib/avatarHelper';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';

// ─── Formatters ───────────────────────────────────────────────────────────────

const MANILA_TIME = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const MANILA_DATE = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const SHORT_DATE = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const SHORT_TIME = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

// ─── Dynamic Sparkline Wave Generator (Scales paths and crests with metric data) ─

interface SparklineWaveResult {
  stroke: string;
  fill: string;
  secStroke: string;
  secFill: string;
  ratio: number;
}

function generateVerifiedWave(verifiedMins: number, targetMins: number = 27600): SparklineWaveResult {
  const ratio = targetMins > 0 ? Math.min(1, Math.max(0, verifiedMins / targetMins)) : 0;
  if (ratio === 0) {
    const stroke = "M 0 38 C 50 37, 90 39, 140 37 C 190 35, 230 39, 300 37";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const yStart = Math.round(35 - ratio * 9);
  const cp1y = Math.round(31 - ratio * 15);
  const p1y = Math.round(29 - ratio * 16);
  const cp2y = Math.round(35 - ratio * 12);
  const p2y = Math.round(32 - ratio * 14);
  const cp3y = Math.round(25 - ratio * 17);
  const pEnd = Math.round(22 - ratio * 14);

  const stroke = `M 0 ${yStart} C 45 ${cp1y}, 75 ${cp1y + 2}, 120 ${p1y} C 165 ${cp2y}, 195 ${cp2y - 2}, 240 ${p2y} C 265 ${cp3y}, 285 ${cp3y - 2}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 3} C 40 ${cp1y + 4}, 80 ${cp1y + 5}, 125 ${p1y + 3} C 170 ${cp2y + 4}, 200 ${cp2y + 2}, 245 ${p2y + 3} C 270 ${cp3y + 3}, 290 ${cp3y + 1}, 300 ${pEnd + 3}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

function generatePendingWave(pendingCount: number): SparklineWaveResult {
  const ratio = Math.min(1, Math.max(0, pendingCount / 4));
  if (ratio === 0) {
    const stroke = "M 0 38 C 50 38, 100 39, 150 38 C 200 37, 250 39, 300 38";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const yStart = Math.round(35 - ratio * 6);
  const cp1y = Math.round(28 - ratio * 18);
  const p1y = Math.round(33 - ratio * 10);
  const cp2y = Math.round(24 - ratio * 18);
  const p2y = Math.round(30 - ratio * 12);
  const pEnd = Math.round(20 - ratio * 14);

  const stroke = `M 0 ${yStart} C 40 ${cp1y}, 75 ${cp1y}, 115 ${p1y} C 155 ${p1y + 3}, 180 ${cp2y}, 220 ${cp2y} C 250 ${p2y}, 275 ${p2y - 2}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 2} C 45 ${cp1y + 3}, 80 ${cp1y + 3}, 120 ${p1y + 2} C 160 ${p1y + 4}, 185 ${cp2y + 3}, 225 ${cp2y + 3} C 255 ${p2y + 2}, 280 ${p2y}, 300 ${pEnd + 2}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

function generateRemainingWave(remainingMins: number, targetMins: number = 27600): SparklineWaveResult {
  const ratio = targetMins > 0 ? Math.min(1, Math.max(0, remainingMins / targetMins)) : 0;
  if (ratio === 0) {
    const stroke = "M 0 36 C 60 35, 120 37, 180 36 C 240 35, 270 36, 300 35";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const yStart = Math.round(36 - ratio * 10);
  const cp1y = Math.round(32 - ratio * 14);
  const p1y = Math.round(26 - ratio * 16);
  const cp2y = Math.round(20 - ratio * 16);
  const pEnd = Math.round(18 - ratio * 12);

  const stroke = `M 0 ${yStart} C 45 ${cp1y}, 90 ${cp1y - 2}, 145 ${p1y} C 200 ${cp2y + 2}, 250 ${cp2y}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 2} C 50 ${cp1y + 3}, 95 ${cp1y + 1}, 150 ${p1y + 2} C 205 ${cp2y + 4}, 255 ${cp2y + 2}, 300 ${pEnd + 2}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

const statusLabel: Record<AttendanceStatus, string> = {
  open: 'Shift in progress',
  pending: 'Awaiting review',
  verified: 'Verified & credited',
  rejected: 'Revision required',
};

const statusVariant: Record<AttendanceStatus, 'default' | 'warning' | 'success' | 'error'> = {
  open: 'default',
  pending: 'warning',
  verified: 'success',
  rejected: 'error',
};

// ─── ProgressCircle Component (Animated Circular Metric Indicator) ─────────────

interface ProgressCircleProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackClass?: string;
  title?: string;
  children?: React.ReactNode;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 48,
  strokeWidth = 4.5,
  colorClass = 'text-primary',
  trackClass = 'text-muted/20 dark:text-muted/15',
  title,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const targetOffset = circumference - (clampedValue / 100) * circumference;
  const strokeDashoffset = mounted ? targetOffset : circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      title={title}
    >
      <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={clampedValue > 0 ? 'round' : 'butt'}
          fill="none"
          className={cn(colorClass, 'transition-all duration-700 ease-out', clampedValue === 0 && 'opacity-0')}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Canvas Watermark Helper ───────────────────────────────────────────────────

async function stampAttendancePhoto(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  studentName: string,
  studentId: string,
  actionLabel: string,
  timestampDate: Date = new Date()
): Promise<{ file: File; dataUrl: string; timestampString: string }> {
  const canvas = document.createElement('canvas');
  const width = 1280;
  const height = 960;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas context');

  // Maintain aspect ratio with center cover crop
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const x = (width - sourceWidth * scale) / 2;
  const y = (height - sourceHeight * scale) / 2;
  ctx.drawImage(source, x, y, sourceWidth * scale, sourceHeight * scale);

  // Watermark footer bar
  const barHeight = 110;
  const barY = height - barHeight;

  // Dark gradient backdrop for extreme legibility against any background
  const grad = ctx.createLinearGradient(0, barY - 25, 0, height);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.25, 'rgba(15, 23, 42, 0.88)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, barY - 25, width, barHeight + 25);

  // Accent divider line
  ctx.fillStyle = '#0284c7'; // Sky-blue accent
  ctx.fillRect(0, barY - 2, width, 4);

  // Formatted date and time strings (PST)
  const timeStr = timestampDate.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const dateStr = timestampDate.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timestampFull = `${dateStr} · ${timeStr} PST`;

  // Draw Stamped Text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Action badge pill text
  ctx.fillStyle = '#38bdf8'; // Sky 400
  ctx.font = 'bold 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`• ${actionLabel.toUpperCase()} VERIFIED`, 36, barY + 16);

  // Timestamp string
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(timeStr + ' PST', 36, barY + 48);

  ctx.fillStyle = '#94a3b8'; // Slate 400
  ctx.font = '500 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(dateStr, 340, barY + 60);

  // Right-aligned trainee and institution verification text
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(studentName || 'Student Trainee', width - 36, barY + 22);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '600 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`ID: ${studentId || '05000372499'} · STI Practicum Verified`, width - 36, barY + 58);

  // Output as JPEG Blob and DataURL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Canvas blob generation failed'));
          return;
        }
        const file = new File([blob], `attendance-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({ file, dataUrl, timestampString: timestampFull });
      },
      'image/jpeg',
      0.92
    );
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useUserAvatar(user);
  const [payload, setPayload] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [activity, setActivity] = useState('');
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'all'>('pending');

  // Client-side Table Filter Controls (Matching wireframe sketch)
  const [tableFilter, setTableFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stamped Photo Evidence States
  const [evidencePhoto, setEvidencePhoto] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceTimestamp, setEvidenceTimestamp] = useState<string | null>(null);

  // Camera capture modal states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraTargetAction, setCameraTargetAction] = useState<'time-in' | 'time-out' | null>(null);

  // Lightbox inspect modal state
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);
  const [inspectRecord, setInspectRecord] = useState<AttendanceRecord | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const studentName = user?.name || 'John Dwayne B. Guaniso';
  const studentId = user?.studentId || '05000372499';
  const sectionName = user?.section || 'BSIT 402';
  const companyName = (user as any)?.company_name || user?.companyName || 'InnoTech Labs Inc.';

  // ─── Attendance Fetching ─────────────────────────────────────────────────────

  const loadAttendance = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiJson<AttendanceResponse>('/api/attendance');
      setPayload(response);
      setNow((response as any)?.serverTime || Date.now());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to synchronize server attendance data.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  // Live second ticker
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const records = useMemo(() => payload?.records || [], [payload?.records]);
  const today = getManilaDateKey(now);
  const todayRecord = records.find(record => record.work_date === today);

  const verifiedMinutes = useMemo(() => {
    return records
      .filter(record => record.status === 'verified')
      .reduce((total, record) => total + record.rendered_minutes, 0);
  }, [records]);

  const pendingMinutes = useMemo(() => {
    return records
      .filter(record => record.status === 'pending')
      .reduce((total, record) => total + record.rendered_minutes, 0);
  }, [records]);

  const verifiedShiftsCount = useMemo(() => {
    return records.filter(record => record.status === 'verified').length;
  }, [records]);

  const pendingShiftsCount = useMemo(() => {
    return records.filter(record => record.status === 'pending').length;
  }, [records]);

  const targetMinutes = payload?.targetMinutes || 27600; // 460 hours
  const progress = getAttendanceProgress(verifiedMinutes, targetMinutes);
  const remainingHours = Math.round(Math.max(0, targetMinutes - verifiedMinutes) / 60);
  const isStudent = user?.role === 'student';
  const canReview = user?.role === 'supervisor' || user?.role === 'admin';

  // Live elapsed timer calculation during active shifts
  const elapsedShiftDisplay = useMemo(() => {
    if (!todayRecord || todayRecord.status !== 'open') return null;
    const openMinutes = getOpenSessionMinutes(todayRecord.time_in, now);
    const hours = Math.floor(openMinutes / 60);
    const minutes = openMinutes % 60;
    const seconds = Math.floor((now / 1000) % 60);
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }, [todayRecord, now]);

  // Dynamic Sparkline Waves for Metric Cards (Moves & scales dynamically with counts and hours)
  const verifiedWave = useMemo(
    () => generateVerifiedWave(verifiedMinutes, targetMinutes),
    [verifiedMinutes, targetMinutes]
  );

  const pendingWave = useMemo(
    () => generatePendingWave(pendingShiftsCount),
    [pendingShiftsCount]
  );

  const remainingWave = useMemo(
    () => generateRemainingWave(Math.max(targetMinutes - verifiedMinutes, 0), targetMinutes),
    [verifiedMinutes, targetMinutes]
  );

  useEffect(() => {
    if (todayRecord?.status === 'rejected' && !activity) {
      setActivity(todayRecord.activity_note || '');
    }
  }, [activity, todayRecord]);

  // Client-side Filtered Records for Table
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (tableFilter === 'verified' && record.status !== 'verified') return false;
      if (tableFilter === 'pending' && record.status !== 'pending') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dateMatch = record.work_date?.toLowerCase().includes(q);
        const noteMatch = record.activity_note?.toLowerCase().includes(q);
        if (!dateMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [records, tableFilter, searchQuery]);

  // ─── Camera Management ───────────────────────────────────────────────────────

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch(err => console.warn('Video auto-play note:', err));
    }
  }, []);

  const startCameraStream = useCallback(async (facing: 'user' | 'environment') => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream tracks cleanly
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
    } catch (err) {
      console.warn('Camera access note:', err);
      setCameraError('Camera access unavailable. You can upload a photo from your device instead.');
    } finally {
      setCameraLoading(false);
    }
  }, []);

  const openCamera = useCallback(
    (action: 'time-in' | 'time-out' = 'time-in') => {
      setCameraTargetAction(action);
      setIsCameraOpen(true);
      setCameraError(null);
      void startCameraStream(facingMode);
    },
    [facingMode, startCameraStream]
  );

  const closeCamera = useCallback(() => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
  }, [stopCameraStream]);

  const toggleCameraFacing = useCallback(() => {
    setFacingMode(prev => {
      const next = prev === 'user' ? 'environment' : 'user';
      void startCameraStream(next);
      return next;
    });
  }, [startCameraStream]);

  // Clean up camera stream only when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const captureCameraSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera video stream is not ready. Please wait a moment.');
      return;
    }

    try {
      const actionLabel = cameraTargetAction === 'time-out' ? 'Time Out Proof' : 'Time In Proof';
      const result = await stampAttendancePhoto(
        video,
        video.videoWidth,
        video.videoHeight,
        studentName,
        studentId,
        actionLabel,
        new Date()
      );
      stopCameraStream();
      setIsCameraOpen(false); // Close camera modal so snapped photo sits directly in the box container
      setEvidencePhoto(result.file);
      setEvidencePreview(result.dataUrl);
      setEvidenceTimestamp(result.timestampString);
      toast.success('Attendance photo stamped with verified timestamp.');
    } catch (err) {
      console.error('Camera snapshot stamping error:', err);
      toast.error('Failed to stamp photo watermark.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, or WEBP).');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const actionLabel = cameraTargetAction === 'time-out' ? 'Time Out Proof' : 'Time In Proof';
        const result = await stampAttendancePhoto(
          img,
          img.naturalWidth || 1280,
          img.naturalHeight || 960,
          studentName,
          studentId,
          actionLabel,
          new Date()
        );
        stopCameraStream();
        setIsCameraOpen(false);
        setEvidencePhoto(result.file);
        setEvidencePreview(result.dataUrl);
        setEvidenceTimestamp(result.timestampString);
        toast.success('Photo uploaded and stamped with verified timestamp.');
      } catch (err) {
        console.error('File stamping error:', err);
        toast.error('Failed to process photo.');
      } finally {
        URL.revokeObjectURL(objectUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    img.src = objectUrl;
  };

  const clearSelectedPhoto = () => {
    setEvidencePhoto(null);
    setEvidencePreview(null);
    setEvidenceTimestamp(null);
  };

  const handleTryAgain = () => {
    clearSelectedPhoto();
    openCamera(todayRecord?.status === 'open' ? 'time-out' : 'time-in');
  };

  const handleTimeInClick = () => {
    openCamera('time-in');
  };

  const handleTimeOutClick = () => {
    if (activity.trim().length < 3) {
      toast.error('Please provide a brief shift summary (at least 3 characters) before timing out.');
      return;
    }
    openCamera('time-out');
  };

  // ─── Actions Execution ───────────────────────────────────────────────────────

  const runAction = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await action();
      toast.success(success);
      await loadAttendance(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The attendance action failed.');
    } finally {
      setBusy(null);
    }
  };

  const uploadEvidence = async (record: AttendanceRecord) => {
    if (!evidencePhoto) return;
    const form = new FormData();
    form.append('photo', evidencePhoto, evidencePhoto.name || 'attendance-photo.jpg');
    await apiJson(`/api/attendance/${record.id}/evidence`, { method: 'POST', body: form });
  };

  const timeIn = () =>
    runAction(
      'time-in',
      async () => {
        const result = await apiJson<{ record: AttendanceRecord }>('/api/attendance/time-in', { method: 'POST' });
        if (evidencePhoto && result?.record?.id) {
          try {
            await uploadEvidence(result.record);
          } catch (e) {
            console.warn('Evidence photo attach note:', e);
          }
        }
        clearSelectedPhoto();
      },
      'Time in recorded using the verified server time.'
    );

  const timeOut = () =>
    runAction(
      'time-out',
      async () => {
        if (!todayRecord) throw new Error('No active attendance record was found.');
        if (evidencePhoto) {
          await uploadEvidence(todayRecord);
        }
        await apiJson('/api/attendance/time-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity }),
        });
        clearSelectedPhoto();
      },
      'Time out recorded and sent to your supervisor for verification.'
    );

  const resubmit = (record: AttendanceRecord) =>
    runAction(
      `resubmit-${record.id}`,
      async () => {
        if (evidencePhoto) {
          await uploadEvidence(record);
        }
        await apiJson(`/api/attendance/${record.id}/resubmit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity }),
        });
        clearSelectedPhoto();
      },
      'Attendance was resubmitted for verification.'
    );

  const review = (record: AttendanceRecord, decision: 'verified' | 'rejected') =>
    runAction(
      `${decision}-${record.id}`,
      () =>
        apiJson(`/api/attendance/${record.id}/review`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, remarks: remarks[record.id] || '' }),
        }),
      decision === 'verified'
        ? 'Attendance verified. The hours now count toward the student target.'
        : 'Attendance returned to the student.'
    );

  const visibleReviewerRecords = useMemo(
    () => records.filter(record => reviewFilter === 'all' || record.status === 'pending'),
    [records, reviewFilter]
  );

  const openInspection = (record: AttendanceRecord) => {
    setInspectRecord(record);
    setInspectPhotoUrl(record.evidence_url || null);
  };

  const closeInspection = () => {
    setInspectRecord(null);
    setInspectPhotoUrl(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground animate-in fade-in duration-300">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="font-semibold text-foreground">Synchronizing server attendance records…</p>
        <p className="text-xs text-muted-foreground">Philippine Standard Time &middot; Asia/Manila</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-3.5 sm:space-y-4 pb-8 animate-in fade-in duration-300 ease-out">
      {/* ─── Clean Minimal Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {isStudent ? 'Time In & Out' : 'Attendance Verification Center'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isStudent
              ? 'Daily practicum shift recording, timestamped photo evidence, and supervisor verification'
              : 'Verify intern shift hours, inspect stamped photo evidence, and manage attendance records'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadAttendance()}
          disabled={busy !== null}
          className="h-9 px-3.5 border-zinc-200 dark:border-border/60 font-semibold cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={cn('size-3.5 mr-1.5', busy && 'animate-spin')} />
          <span>Refresh</span>
        </Button>
      </div>

      {isStudent ? (
        /* ════════════════════════════════════════════════════════════════════════
           2-COLUMN ASYMMETRIC MASTER LAYOUT (MATCHING WIREFRAME SKETCH)
           Left: Stat Cards (Row 1) + Filter Pills (Row 2) + Big History Table (Row 3)
           Right: Profile Card (Top) + Shift Clock & Action Station (Bottom)
           ════════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-4 sm:gap-5 items-stretch">
          {/* ──────────────────────────────────────────────────────────────────
              LEFT MAIN COLUMN (~65-70% Width)
              ────────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col min-w-0 h-full gap-4 sm:gap-5">
            {/* ROW 1: 3 METRIC STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              {/* Card 1: Verified Hours */}
              <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-1.5 flex flex-col justify-between select-none">
                {/* Top Header Row with Title & Kebab Menu */}
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-tight">
                    Verified Hours
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="size-5.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical size={13} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setTableFilter('verified')}>
                        <CheckCircle2 className="size-4 mr-2" />
                        <span>Filter Verified</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTableFilter('all')}>
                        <History className="size-4 mr-2" />
                        <span>All Records</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Numbers & Label Row */}
                <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
                    {verifiedMinutes > 0 ? formatAttendanceMinutes(verifiedMinutes) : '0h'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate leading-none">
                    / 460h required
                  </span>
                </div>

                {/* Soft Light Sparkline Wave */}
                <div className="w-full pt-0.5 -mb-0.5 overflow-hidden pointer-events-none">
                  <svg
                    viewBox="0 0 300 45"
                    preserveAspectRatio="none"
                    className={cn(
                      "w-full h-5 overflow-visible transition-colors duration-200",
                      verifiedMinutes > 0
                        ? "text-emerald-500/80 dark:text-emerald-400/85"
                        : "text-muted-foreground/30"
                    )}
                  >
                    <defs>
                      <linearGradient id="attendWaveGrad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={verifiedMinutes > 0 ? "0.22" : "0.08"} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {verifiedMinutes > 0 && (
                      <path
                        d={verifiedWave.secFill}
                        fill="currentColor"
                        className="opacity-15 animate-sparkline-float-secondary"
                      />
                    )}
                    <path
                      d={verifiedWave.fill}
                      fill="url(#attendWaveGrad1)"
                      className="animate-sparkline-fade animate-sparkline-float"
                    />
                    <path
                      d={verifiedWave.stroke}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-sparkline-draw animate-sparkline-float"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 2: Review in Progress */}
              <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xs space-y-1.5 flex flex-col justify-between select-none overflow-hidden">
                {/* Top Header Row with Title & Kebab Menu */}
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-tight">
                    Review in Progress
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="size-5.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical size={13} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setTableFilter('pending')}>
                        <Clock className="size-4 mr-2" />
                        <span>Filter Pending</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTableFilter('all')}>
                        <History className="size-4 mr-2" />
                        <span>All Records</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Numbers & Label Row */}
                <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
                    {pendingShiftsCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate leading-none">
                    awaiting review
                  </span>
                </div>

                {/* Soft Light Sparkline Wave */}
                <div className="w-full pt-0.5 -mb-0.5 overflow-hidden pointer-events-none">
                  <svg
                    viewBox="0 0 300 45"
                    preserveAspectRatio="none"
                    className={cn(
                      "w-full h-5 overflow-visible transition-colors duration-200",
                      pendingShiftsCount > 0
                        ? "text-orange-500/85 dark:text-orange-400/90"
                        : "text-muted-foreground/30"
                    )}
                  >
                    <defs>
                      <linearGradient id="attendWaveGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={pendingShiftsCount > 0 ? "0.22" : "0.08"} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {pendingShiftsCount > 0 && (
                      <path
                        d={pendingWave.secFill}
                        fill="currentColor"
                        className="opacity-15 animate-sparkline-float-secondary"
                      />
                    )}
                    <path
                      d={pendingWave.fill}
                      fill="url(#attendWaveGrad2)"
                      className="animate-sparkline-fade animate-sparkline-float"
                    />
                    <path
                      d={pendingWave.stroke}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-sparkline-draw animate-sparkline-float"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 3: Remaining Hours */}
              <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-1.5 flex flex-col justify-between select-none">
                {/* Top Header Row with Title & Kebab Menu */}
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-tight">
                    Remaining Hours
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="size-5.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical size={13} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setTableFilter('all')}>
                        <Target className="size-4 mr-2" />
                        <span>Target: 460h</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void loadAttendance()}>
                        <RefreshCw className="size-4 mr-2" />
                        <span>Refresh Data</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Numbers & Label Row */}
                <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
                    {verifiedMinutes > 0
                      ? formatAttendanceMinutes(Math.max(targetMinutes - verifiedMinutes, 0))
                      : '0h'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate leading-none">
                    {verifiedMinutes > 0
                      ? `${(((Math.max(targetMinutes - verifiedMinutes, 0)) / 480) % 1 === 0 ? ((Math.max(targetMinutes - verifiedMinutes, 0)) / 480).toFixed(0) : ((Math.max(targetMinutes - verifiedMinutes, 0)) / 480).toFixed(1))} shifts`
                      : '0 shifts'}
                  </span>
                </div>

                {/* Soft Light Sparkline Wave */}
                <div className="w-full pt-0.5 -mb-0.5 overflow-hidden pointer-events-none">
                  <svg
                    viewBox="0 0 300 45"
                    preserveAspectRatio="none"
                    className={cn(
                      "w-full h-5 overflow-visible transition-colors duration-200",
                      verifiedMinutes > 0
                        ? (Math.max(targetMinutes - verifiedMinutes, 0) > 0
                            ? "text-rose-500/80 dark:text-rose-400/85"
                            : "text-emerald-500/80 dark:text-emerald-400/85")
                        : "text-muted-foreground/30"
                    )}
                  >
                    <defs>
                      <linearGradient id="attendWaveGrad3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={verifiedMinutes > 0 ? "0.22" : "0.08"} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {verifiedMinutes > 0 && (
                      <path
                        d={remainingWave.secFill}
                        fill="currentColor"
                        className="opacity-15 animate-sparkline-float-secondary"
                      />
                    )}
                    <path
                      d={remainingWave.fill}
                      fill="url(#attendWaveGrad3)"
                      className="animate-sparkline-fade animate-sparkline-float"
                    />
                    <path
                      d={remainingWave.stroke}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-sparkline-draw animate-sparkline-float"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* ROW 2: 3 FILTER PILLS (LEFT) + SEARCH FILTER (RIGHT) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              {/* 3 Pills: All Records, Verified, Pending */}
              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-zinc-200 dark:border-border/60 self-start">
                <button
                  type="button"
                  onClick={() => setTableFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    tableFilter === 'all'
                      ? 'bg-card text-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  All Records ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('verified')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    tableFilter === 'verified'
                      ? 'bg-card text-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Verified ({verifiedShiftsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('pending')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    tableFilter === 'pending'
                      ? 'bg-card text-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Pending ({pendingShiftsCount})
                </button>
              </div>

              {/* Search / Filter Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by date or summary…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl bg-card border border-zinc-200 dark:border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ROW 3: LARGE FRAMED ATTENDANCE HISTORY CONTAINER */}
            <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-border/60 px-4 py-3 sm:px-5 sm:py-3.5 bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-primary shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Attendance Record History
                  </h2>
                </div>
                <span className="text-xs font-semibold text-muted-foreground bg-card px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-border/40 shadow-2xs">
                  {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {filteredRecords.length === 0 ? (
                  <EmptyState
                    image="/images/Landing Page Icons/undraw_work-time_1ogn.svg"
                    title={searchQuery || tableFilter !== 'all' ? 'No Matching Records' : 'No Attendance Records Yet'}
                    description={
                      searchQuery || tableFilter !== 'all'
                        ? 'No attendance records match your current filter criteria. Clear filters to see all shifts.'
                        : 'Your shift records, rendered hours, timestamped photo evidence, and supervisor decisions will appear here as soon as you record your first Time In.'
                    }
                    action={
                      searchQuery || tableFilter !== 'all' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTableFilter('all');
                            setSearchQuery('');
                          }}
                        >
                          Reset Filters
                        </Button>
                      ) : undefined
                    }
                    className="min-h-0 py-6 sm:py-7 px-4 [&_img]:max-h-24 [&_img]:w-auto [&_img]:mb-2.5 [&_h3]:text-sm [&_p]:text-xs [&_p]:mb-0"
                  />
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-zinc-200 dark:border-border/70 text-muted-foreground uppercase text-[10.5px] tracking-wider font-bold">
                          <th className="py-3.5 px-4 font-bold">Date</th>
                          <th className="py-3.5 px-3.5 font-bold">Time In</th>
                          <th className="py-3.5 px-3.5 font-bold">Time Out</th>
                          <th className="py-3.5 px-3.5 font-bold">Rendered</th>
                          <th className="py-3.5 px-3.5 font-bold text-center">Photo Evidence</th>
                          <th className="py-3.5 px-3.5 font-bold text-center">Status</th>
                          <th className="py-3.5 px-4 font-bold text-center">Target Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-border/40 text-foreground">
                        {filteredRecords.map(record => (
                          <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {SHORT_DATE.format(new Date(`${record.work_date}T12:00:00+08:00`))}
                            </td>
                            <td className="py-3.5 px-3.5 tabular-nums text-foreground">
                              {SHORT_TIME.format(new Date(record.time_in))}
                            </td>
                            <td className="py-3.5 px-3.5 tabular-nums text-foreground">
                              {record.time_out ? SHORT_TIME.format(new Date(record.time_out)) : '—'}
                            </td>
                            <td className="py-3.5 px-3.5 font-semibold text-foreground">
                              {formatAttendanceMinutes(record.rendered_minutes)}
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              {record.evidence_url ? (
                                <button
                                  type="button"
                                  onClick={() => openInspection(record)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 cursor-pointer transition shadow-2xs"
                                >
                                  <ImageIcon size={12} />
                                  <span>View Photo</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/60 italic">No photo attached</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <Badge variant={statusVariant[record.status]}>{statusLabel[record.status]}</Badge>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {record.status === 'verified' ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                  <CheckCircle2 size={13} /> Credited (+{formatAttendanceMinutes(record.rendered_minutes)})
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">Pending verification</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              RIGHT SIDEBAR DOCK (~30-35% Width)
              Unified Shift Clock, Action Station & Profile Information Card (1 Box)
              ────────────────────────────────────────────────────────────────── */}
          <div className="min-w-0 flex flex-col h-full lg:sticky lg:top-6">
            {/* UNIFIED SHIFT CLOCK & ACTION STATION CARD */}
            <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-2xl shadow-xs p-4 sm:p-4.5 flex flex-col justify-between flex-1 select-none">
              {/* Top Station Group (Identity, Clock, Details, Photo Proof, Punch Button) */}
              <div className="space-y-3.5 sm:space-y-4">
                {/* 1. Trainee Identity Header (Clean & Compact) */}
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-200 dark:border-border/50">
                  <div className="size-9 rounded-full overflow-hidden border border-zinc-200 dark:border-border/80 bg-muted shrink-0 shadow-2xs">
                    <img
                      src={avatarUrl}
                      alt={studentName}
                      className="size-full object-cover pointer-events-none"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = '/images/avatars/undraw_indie-hacker-avatar_b3wy.svg';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-foreground tracking-tight truncate leading-tight">
                      {studentName}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                      {studentId} &middot; {sectionName}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {!todayRecord ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-foreground border border-zinc-200 dark:border-border/60">
                        Ready
                      </span>
                    ) : (
                      <Badge variant={statusVariant[todayRecord.status]}>
                        {statusLabel[todayRecord.status]}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 2. Clock Display */}
                <div>
                  <div className="text-3xl sm:text-[32px] font-black tracking-tight text-foreground tabular-nums leading-none">
                    {MANILA_TIME.format(now)}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    {MANILA_DATE.format(now)}
                  </p>
                </div>

                {/* 3. Active Shift Details (When Clocked In) */}
                {todayRecord?.status === 'open' && (
                  <div className="rounded-xl bg-muted/40 border border-zinc-200/80 dark:border-border/50 p-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground font-medium text-[11px]">Clock In</p>
                      <p className="font-bold text-foreground tabular-nums text-xs mt-0.5">
                        {SHORT_TIME.format(new Date(todayRecord.time_in))} PST
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium text-[11px]">Elapsed Time</p>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-xs mt-0.5">
                        {elapsedShiftDisplay}
                      </p>
                    </div>
                  </div>
                )}

                {todayRecord?.reviewer_remarks && todayRecord.status !== 'open' && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    <span className="font-bold">Supervisor note:</span> {todayRecord.reviewer_remarks}
                  </div>
                )}

                {/* Work Summary (When Time Out or Resubmitting) */}
                {(todayRecord?.status === 'open' || todayRecord?.status === 'rejected') && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-foreground">Shift Summary</label>
                      <span className="text-[10px] text-muted-foreground font-normal">{activity.trim().length}/500</span>
                    </div>
                    <textarea
                      value={activity}
                      onChange={e => setActivity(e.target.value)}
                      maxLength={500}
                      rows={2}
                      placeholder="Briefly describe completed tasks…"
                      className="w-full resize-none rounded-xl border border-zinc-200 dark:border-border/60 bg-background px-3 py-2 text-xs text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/60"
                    />
                  </div>
                )}

                {/* 4. Dedicated Attendance Photo Proof Box Container (Between Clock & Punch Action) */}
                {(!todayRecord || todayRecord.status === 'open') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Attendance Photo Proof</span>
                      {evidencePreview ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={11} strokeWidth={3} /> Photo Ready
                        </span>
                      ) : (
                        <span>Verified Timestamp</span>
                      )}
                    </div>

                    {evidencePreview || (todayRecord?.status === 'open' && todayRecord.evidence_url) ? (
                      /* Box Container: Stamped Photo firmly displayed here */
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-border/60 bg-black aspect-16/10 w-full shadow-2xs group">
                        <img
                          src={evidencePreview || todayRecord?.evidence_url!}
                          alt="Stamped Attendance Proof"
                          className="size-full object-cover block"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs inline-flex items-center gap-1">
                            <Check size={10} strokeWidth={3} /> Stamped Proof
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectPhotoUrl(evidencePreview || todayRecord?.evidence_url || null);
                            setInspectRecord(todayRecord || null);
                          }}
                          className="absolute top-2 right-2 size-6.5 rounded-md bg-black/75 hover:bg-black text-white text-xs flex items-center justify-center cursor-pointer transition shadow-xs"
                          title="Inspect photo"
                        >
                          <Eye size={12} />
                        </button>
                        {evidenceTimestamp && (
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-medium text-zinc-200 truncate">
                            {evidenceTimestamp}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Box Container: Action / Trigger Box */
                      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-border/80 bg-muted/20 hover:bg-muted/30 transition-colors p-3.5 flex flex-col items-center justify-center text-center gap-2">
                        <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                          <Camera size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">
                            {todayRecord?.status === 'open' ? 'Time Out Photo Proof' : 'Time In Photo Proof'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Capture or upload attendance photo proof
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 w-full justify-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            onClick={() => openCamera(todayRecord?.status === 'open' ? 'time-out' : 'time-in')}
                            className="cursor-pointer font-bold text-xs gap-1.5 px-3 h-8 shadow-xs"
                          >
                            <Camera size={13} />
                            <span>Take Photo</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCameraTargetAction(todayRecord?.status === 'open' ? 'time-out' : 'time-in');
                              fileInputRef.current?.click();
                            }}
                            className="cursor-pointer font-semibold text-xs gap-1.5 px-3 h-8"
                          >
                            <Upload size={13} />
                            <span>Upload</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Primary Punch Action Button(s) */}
                <div>
                  {!todayRecord ? (
                    evidencePreview ? (
                      /* Photo is ready in box: Try Again & Time In buttons side-by-side */
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={handleTryAgain}
                          className="h-10.5 flex-1 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs hover:bg-muted gap-1.5"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Try Again</span>
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="h-10.5 flex-1 font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-[0.99] transition bg-primary text-primary-foreground hover:opacity-90 gap-1.5"
                          onClick={() => void timeIn()}
                          disabled={busy !== null}
                        >
                          <LogIn className="size-4" />
                          <span>{busy === 'time-in' ? 'Recording…' : 'Time In'}</span>
                        </Button>
                      </div>
                    ) : (
                      /* No photo yet: primary Time In button opens camera */
                      <Button
                        size="lg"
                        className="h-10.5 w-full font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-[0.99] transition bg-primary text-primary-foreground hover:opacity-90 gap-1.5"
                        onClick={() => openCamera('time-in')}
                        disabled={busy !== null}
                      >
                        <LogIn className="size-4" />
                        <span>{busy === 'time-in' ? 'Recording Time In…' : 'Time In'}</span>
                      </Button>
                    )
                  ) : todayRecord.status === 'open' ? (
                    evidencePreview ? (
                      /* Time out photo captured: Try Again & Time Out & Submit */
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={handleTryAgain}
                          className="h-10.5 flex-1 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs hover:bg-muted gap-1.5"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Try Again</span>
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="h-10.5 flex-1 font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-[0.99] transition bg-primary text-primary-foreground hover:opacity-90 gap-1.5"
                          onClick={() => void timeOut()}
                          disabled={busy !== null || activity.trim().length < 3}
                        >
                          <LogOut className="size-4" />
                          <span>{busy === 'time-out' ? 'Submitting…' : 'Time Out'}</span>
                        </Button>
                      </div>
                    ) : (
                      /* Time out button */
                      <Button
                        size="lg"
                        className="h-10.5 w-full font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-[0.99] transition bg-primary text-primary-foreground hover:opacity-90 gap-1.5"
                        onClick={handleTimeOutClick}
                        disabled={busy !== null || activity.trim().length < 3}
                      >
                        <LogOut className="size-4" />
                        <span>{busy === 'time-out' ? 'Submitting Shift…' : 'Time Out & Submit'}</span>
                      </Button>
                    )
                  ) : todayRecord.status === 'rejected' ? (
                    <Button
                      size="lg"
                      className="h-10.5 w-full font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-[0.99] transition bg-primary text-primary-foreground hover:opacity-90 gap-1.5"
                      onClick={() => openCamera('time-in')}
                      disabled={busy !== null || activity.trim().length < 3}
                    >
                      <RotateCcw className="size-4" />
                      <span>Resubmit Shift Summary</span>
                    </Button>
                  ) : (
                    <div className="text-center py-2.5 text-xs text-muted-foreground font-medium bg-muted/40 rounded-xl border border-zinc-200 dark:border-border/40">
                      Shift submitted &middot; Awaiting supervisor verification
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Placement Details Footer (Clean, Real Metadata) */}
              <div className="pt-3 border-t border-zinc-200/80 dark:border-border/50 space-y-1.5 text-xs mt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Building2 size={13} className="text-muted-foreground/70" /> Host Company
                  </span>
                  <span className="font-bold text-foreground truncate max-w-[170px] text-right">
                    {companyName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <UserCheck size={13} className="text-muted-foreground/70" /> Supervisor
                  </span>
                  <span className="font-bold text-foreground truncate max-w-[170px] text-right">
                    {user?.role === 'student' ? 'Engr. Paolo Reyes' : 'Assigned Supervisor'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-muted-foreground/70" /> Adviser
                  </span>
                  <span className="font-bold text-foreground truncate max-w-[170px] text-right">
                    Dr. Sarah Johnson
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════
           SUPERVISOR & ADMIN REVIEWER QUEUE
           ════════════════════════════════════════════════════════════════════════ */
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending Verification</p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                {records.filter(r => r.status === 'pending').length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Completed shifts requiring review</p>
            </div>
            <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Verified Records</p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                {records.filter(r => r.status === 'verified').length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Successfully verified intern shifts</p>
            </div>
            <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Verified Hours Credited</p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                {formatAttendanceMinutes(verifiedMinutes)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Credited across accessible students</p>
            </div>
          </div>

          <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-zinc-200 dark:border-border/60 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">Attendance Verification Queue</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {canReview
                    ? 'Verify completed student shifts, inspect stamped evidence photos, and approve hours towards their target.'
                    : 'Read-only monitoring for assigned intern students.'}
                </p>
              </div>
              <div className="inline-flex self-start rounded-xl border border-zinc-200 dark:border-border/60 bg-muted/50 p-1">
                {(['pending', 'all'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setReviewFilter(filter)}
                    className={cn(
                      'min-h-8 rounded-lg px-3 text-xs font-semibold capitalize transition-colors cursor-pointer',
                      reviewFilter === filter
                        ? 'bg-card text-foreground shadow-2xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {filter === 'pending' ? `Pending (${records.filter(r => r.status === 'pending').length})` : 'All records'}
                  </button>
                ))}
              </div>
            </div>

            {visibleReviewerRecords.length === 0 ? (
              <EmptyState
                image="/images/Landing Page Icons/Clearance Completed.svg"
                title="No Records in this View"
                description="The attendance verification queue is completely clear. All shifts have been verified or no pending requests are currently waiting."
                className="p-8 sm:p-12 min-h-[260px]"
              />
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-border/40">
                {visibleReviewerRecords.map(record => (
                  <article key={record.id} className="p-5 sm:p-6 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm">
                            {record.student?.full_name || 'Student'}
                          </h3>
                          <Badge variant={statusVariant[record.status]}>{statusLabel[record.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {record.student?.student_id || record.student_id} &middot;{' '}
                          {record.student?.section || record.student?.program || 'BSIT'} &middot;{' '}
                          {SHORT_DATE.format(new Date(`${record.work_date}T12:00:00+08:00`))}
                        </p>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                          <div className="rounded-xl border border-zinc-200 dark:border-border/60 bg-muted/30 p-2.5">
                            <p className="text-[10px] text-muted-foreground font-semibold">Time in</p>
                            <p className="mt-0.5 text-xs font-bold text-foreground tabular-nums">
                              {SHORT_TIME.format(new Date(record.time_in))}
                            </p>
                          </div>
                          <div className="rounded-xl border border-zinc-200 dark:border-border/60 bg-muted/30 p-2.5">
                            <p className="text-[10px] text-muted-foreground font-semibold">Time out</p>
                            <p className="mt-0.5 text-xs font-bold text-foreground tabular-nums">
                              {record.time_out ? SHORT_TIME.format(new Date(record.time_out)) : '—'}
                            </p>
                          </div>
                          <div className="rounded-xl border border-zinc-200 dark:border-border/60 bg-muted/30 p-2.5">
                            <p className="text-[10px] text-muted-foreground font-semibold">Break</p>
                            <p className="mt-0.5 text-xs font-bold text-foreground tabular-nums">
                              {formatAttendanceMinutes(record.break_minutes)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-zinc-200 dark:border-border/60 bg-muted/30 p-2.5">
                            <p className="text-[10px] text-muted-foreground font-semibold">Rendered Hours</p>
                            <p className="mt-0.5 text-xs font-bold text-foreground tabular-nums">
                              {formatAttendanceMinutes(record.rendered_minutes)}
                            </p>
                          </div>
                        </div>

                        {/* Work Summary and Photo Inspect Button */}
                        <div className="rounded-xl bg-muted/40 border border-zinc-200 dark:border-border/60 p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground">Work Summary:</span>
                            {record.evidence_url && (
                              <button
                                type="button"
                                onClick={() => openInspection(record)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 cursor-pointer transition shadow-2xs"
                              >
                                <Camera size={12} />
                                <span>Inspect Timestamped Photo</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">
                            {record.activity_note || 'No activity summary provided.'}
                          </p>
                        </div>

                        {record.reviewer_remarks && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Reviewer note:</span> {record.reviewer_remarks}
                          </p>
                        )}
                      </div>

                      {canReview && record.status === 'pending' && (
                        <div className="w-full shrink-0 space-y-3 xl:w-80">
                          <label className="block text-xs font-semibold text-foreground">
                            Verification Remarks <span className="font-normal text-muted-foreground">(required if returning)</span>
                          </label>
                          <textarea
                            value={remarks[record.id] || ''}
                            onChange={e => setRemarks(prev => ({ ...prev, [record.id]: e.target.value }))}
                            maxLength={500}
                            rows={2}
                            placeholder="Optional verification note or return reason…"
                            className="w-full resize-none rounded-xl border border-zinc-200 dark:border-border/60 bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              className="h-10 text-xs font-bold border-zinc-200 dark:border-border/60 cursor-pointer"
                              onClick={() => review(record, 'rejected')}
                              disabled={busy !== null || (remarks[record.id] || '').trim().length < 3}
                            >
                              <X className="size-3.5 mr-1" />
                              <span>Return</span>
                            </Button>
                            <Button
                              className="h-10 text-xs font-bold cursor-pointer"
                              onClick={() => review(record, 'verified')}
                              disabled={busy !== null}
                            >
                              <Check className="size-3.5 mr-1" />
                              <span>Verify</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Hidden File Input for Device Photo Upload Fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ─── In-Page Live Camera & Photo Proof Confirmation Modal ─── */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-zinc-200 dark:border-border/60 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {cameraTargetAction === 'time-out'
                      ? 'Time Out Attendance Proof'
                      : 'Time In Attendance Proof'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Position yourself clearly in the camera frame
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-zinc-200 dark:border-border/60">
                {cameraLoading ? (
                  <div className="flex flex-col items-center gap-2 text-zinc-400 text-xs">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <span>Accessing camera stream…</span>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 text-center text-zinc-300 text-xs space-y-2.5">
                    <p className="font-bold text-rose-400">Camera Unavailable</p>
                    <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">{cameraError}</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer font-bold gap-1.5"
                    >
                      <Upload size={14} />
                      <span>Upload Photo File Instead</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={attachVideoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => {
                        videoRef.current?.play().catch(e => console.warn('Video play note:', e));
                      }}
                      className={cn(
                        "size-full object-cover",
                        facingMode === 'user' && "-scale-x-100"
                      )}
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>LIVE VIEW &middot; PST {MANILA_TIME.format(now)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-muted/30 border-t border-zinc-200 dark:border-border/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                  title="Switch Camera (Front / Back)"
                >
                  <FlipHorizontal size={14} />
                  <span className="hidden sm:inline">Flip</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                  title="Upload photo from device"
                >
                  <Upload size={14} />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeCamera}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => void captureCameraSnapshot()}
                  disabled={cameraLoading || Boolean(cameraError)}
                  className="font-bold cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Camera size={14} />
                  <span>Take Photo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Photo Lightbox & Inspection Modal ─── */}
      {inspectPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-zinc-200 dark:border-border/60 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-3">
            <div className="p-4 border-b border-zinc-200 dark:border-border/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Verified Attendance Proof Photo</h3>
                <p className="text-xs text-muted-foreground">
                  {inspectRecord
                    ? `${inspectRecord.student?.full_name || studentName} · ${SHORT_DATE.format(new Date(`${inspectRecord.work_date}T12:00:00+08:00`))}`
                    : 'Shift Photo Evidence'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInspection}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-4">
              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-border/60 bg-black shadow-inner">
                <img
                  src={inspectPhotoUrl}
                  alt="Verified Stamped Attendance Proof"
                  className="w-full h-auto max-h-[60vh] object-contain block mx-auto"
                />
              </div>
            </div>

            {inspectRecord && (
              <div className="px-4">
                <div className="rounded-xl bg-muted/40 border border-zinc-200 dark:border-border/60 p-3 text-xs space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <p>
                      Time in: <span className="font-bold text-foreground">{SHORT_TIME.format(new Date(inspectRecord.time_in))} PST</span>
                    </p>
                    <p>
                      Time out: <span className="font-bold text-foreground">{inspectRecord.time_out ? `${SHORT_TIME.format(new Date(inspectRecord.time_out))} PST` : '—'}</span>
                    </p>
                  </div>
                  {inspectRecord.activity_note && (
                    <p className="pt-1 border-t border-zinc-200 dark:border-border/40 text-foreground">
                      <span className="font-semibold text-muted-foreground">Work summary:</span> {inspectRecord.activity_note}
                    </p>
                  )}
                  {inspectRecord.reviewer_remarks && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Supervisor remarks:</span> {inspectRecord.reviewer_remarks}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/30 border-t border-zinc-200 dark:border-border/60 flex items-center justify-between">
              <a
                href={inspectPhotoUrl}
                download="attendance-verified-proof.jpg"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline transition"
              >
                <Download size={13} />
                <span>Save / Download Photo</span>
              </a>
              <Button size="sm" variant="outline" onClick={closeInspection} className="cursor-pointer font-bold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

