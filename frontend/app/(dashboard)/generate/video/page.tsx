'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useCreditsStore } from '@/store/credits.store';
import { api } from '@/lib/api';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  AlertCircle,
  Clapperboard,
  Download,
  Film,
  FolderPlus,
  Lock,
  RotateCcw,
  Sparkles,
  Timer,
  Server,
  Wand2,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
  Zap,
  Volume2,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGenerationErrorMessage } from '@/lib/generation-errors';

type Duration = '5s' | '15s' | '30s';
type AspectRatio = '16:9' | '9:16' | '1:1';
type Provider = 'kling' | 'heygen';
type GenerationPhase = 'idle' | 'generating' | 'success';

// Custom aspect ratio icon component
const AspectRatioIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M7 10v4" />
    <path d="M17 10v4" />
  </svg>
);

const DURATION_OPTIONS: { id: Duration; label: string; credits: number; icon: React.ReactNode }[] = [
  { id: '5s', label: '5 seconds', credits: 25, icon: <Timer className="h-4 w-4" /> },
  { id: '15s', label: '15 seconds', credits: 50, icon: <Timer className="h-4 w-4" /> },
  { id: '30s', label: '30 seconds', credits: 75, icon: <Timer className="h-4 w-4" /> },
];

const ASPECT_OPTIONS: { id: AspectRatio; label: string; icon: React.ReactNode; description: string }[] = [
  { id: '16:9', label: '16:9', icon: <div className="h-3 w-5 rounded-sm border-2" />, description: 'Widescreen' },
  { id: '9:16', label: '9:16', icon: <div className="h-5 w-3 rounded-sm border-2" />, description: 'Vertical' },
  { id: '1:1', label: '1:1', icon: <div className="h-4 w-4 rounded-sm border-2" />, description: 'Square' },
];

const PROVIDER_OPTIONS: { id: Provider; label: string; badge?: string; description: string }[] = [
  { id: 'kling', label: 'Kling AI', badge: 'Primary', description: 'Best for cinematic videos' },
  { id: 'heygen', label: 'HeyGen', badge: 'Alt', description: 'Great for avatars & talking heads' },
];

const PROGRESS_STAGES: { progress: number; label: string; description: string }[] = [
  { progress: 5, label: 'Submitting', description: 'Preparing your request' },
  { progress: 25, label: 'Processing', description: 'Analyzing your prompt' },
  { progress: 50, label: 'Rendering', description: 'Generating video frames' },
  { progress: 75, label: 'Enhancing', description: 'Adding finishing touches' },
  { progress: 100, label: 'Complete', description: 'Your video is ready!' },
];

function PillButton({
  selected,
  onClick,
  children,
  className,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
        selected
          ? 'border-accent-indigo bg-gradient-to-r from-accent-indigo to-accent-violet text-white shadow-glow-indigo'
          : 'border-white/10 bg-input text-secondary hover:border-accent-indigo/40 hover:bg-white/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

function VideoGeneratePageContent() {
  const searchParams = useSearchParams();
  const reuseId = searchParams.get('reuse');
  const { addToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setBalance = useCreditsStore((s) => s.setBalance);

  const [prompt, setPrompt] = React.useState('');
  const [duration, setDuration] = React.useState<Duration>('5s');
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>('16:9');
  const [provider, setProvider] = React.useState<Provider>('kling');
  const [phase, setPhase] = React.useState<GenerationPhase>('idle');
  const [progress, setProgress] = React.useState(0);
  const [stageLabel, setStageLabel] = React.useState('Submitting');
  const [stageDescription, setStageDescription] = React.useState('Preparing your request');
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(true);
  const [currentGenerationId, setCurrentGenerationId] = React.useState<string | null>(null);
  const [reuseBanner, setReuseBanner] = React.useState(false);

  React.useEffect(() => {
    if (!reuseId) return;
    const loadReuse = async () => {
      try {
        const res = await api.post(`/api/generations/${reuseId}/reuse`);
        const { prompt: reusePrompt, parameters } = res.data.data;
        setPrompt(reusePrompt);
        const durationParam = parameters?.duration as string | undefined;
        if (durationParam === '5s' || durationParam === '15s' || durationParam === '30s') {
          setDuration(durationParam);
        } else if (typeof parameters?.duration === 'string') {
          const normalized = `${parameters.duration.replace(/s$/, '')}s` as Duration;
          if (['5s', '15s', '30s'].includes(normalized)) {
            setDuration(normalized);
          }
        }
        if (
          parameters?.aspect_ratio === '16:9' ||
          parameters?.aspect_ratio === '9:16' ||
          parameters?.aspect_ratio === '1:1'
        ) {
          setAspectRatio(parameters.aspect_ratio);
        }
        if (parameters?.provider === 'kling' || parameters?.provider === 'heygen') {
          setProvider(parameters.provider);
        }
        setReuseBanner(true);
      } catch {
        // ignore
      }
    };
    void loadReuse();
  }, [reuseId]);

  const creditCost = DURATION_OPTIONS.find((d) => d.id === duration)?.credits ?? 25;
  const availableCredits = user?.credit_balance ?? 0;
  const hasInsufficientCredits = availableCredits < creditCost;

  const durationSeconds = Number.parseInt(duration, 10) as 5 | 15 | 30;

  const handleWsMessage = React.useCallback(
    (msg: { type: string; generationId?: string; [key: string]: unknown }) => {
      if (!currentGenerationId || msg.generationId !== currentGenerationId) return;

      switch (msg.type) {
        case 'GENERATION_STATUS':
          if (typeof msg.progress === 'number') setProgress(msg.progress);
          if (typeof msg.stage === 'string') {
            setStageLabel(msg.stage);
            setStageDescription(msg.stage);
          }
          break;
        case 'PROVIDER_FALLBACK':
          addToast({
            title: 'Provider switched',
            description: (msg.message as string) || 'Using alternate video provider.',
            type: 'info',
          });
          break;
        case 'GENERATION_COMPLETE':
          setVideoUrl(msg.media_url as string);
          setProgress(100);
          setPhase('success');
          setCurrentGenerationId(null);
          void api.get('/api/credits/balance').then((res) => {
            const balance = res.data.data.balance as number;
            setBalance(balance);
            if (user) setUser({ ...user, credit_balance: balance });
          });
          addToast({ title: 'Video generated successfully!', type: 'success' });
          break;
        case 'GENERATION_FAILED':
          setPhase('idle');
          setProgress(0);
          setCurrentGenerationId(null);
          void api.get('/api/credits/balance').then((res) => {
            const balance = res.data.data.balance as number;
            setBalance(balance);
            if (user) setUser({ ...user, credit_balance: balance });
          });
          addToast({
            title: 'Video generation failed',
            description: (msg.userMessage as string) || 'Please try again.',
            type: 'error',
          });
          break;
        default:
          break;
      }
    },
    [addToast, currentGenerationId, setBalance, setUser, user],
  );

  useWebSocket(handleWsMessage, phase === 'generating' || !!currentGenerationId);

  const runGeneration = React.useCallback(async () => {
    if (!prompt.trim()) {
      addToast({
        title: 'Prompt required',
        description: 'Describe the video you want to create.',
        type: 'error',
      });
      return;
    }

    if (availableCredits < creditCost) {
      addToast({
        title: 'Insufficient credits',
        description: getGenerationErrorMessage('insufficient_credits'),
        type: 'error',
      });
      return;
    }

    setPhase('generating');
    setProgress(5);
    setVideoUrl(null);
    setStageLabel('Submitting');
    setStageDescription('Preparing your request');

    try {
      const res = await api.post('/api/generations/video', {
        prompt,
        duration: durationSeconds,
        aspect_ratio: aspectRatio,
        provider,
      });
      const generation = res.data.data.generation as { id: string };
      setCurrentGenerationId(generation.id);
    } catch (error) {
      const code = getApiErrorCode(error);
      addToast({
        title: 'Generation failed',
        description:
          code === 'INSUFFICIENT_CREDITS'
            ? getGenerationErrorMessage('insufficient_credits')
            : getApiErrorMessage(error),
        type: 'error',
      });
      setPhase('idle');
      setProgress(0);
    }
  }, [
    addToast,
    aspectRatio,
    availableCredits,
    creditCost,
    durationSeconds,
    prompt,
    provider,
  ]);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await api.post('/api/generations/enhance-prompt', { prompt });
      setPrompt(res.data.data.enhanced_prompt as string);
      addToast({ title: 'Prompt enhanced!', type: 'success' });
    } catch {
      addToast({
        title: 'Enhancement failed',
        description: 'Could not enhance prompt. Please try again.',
        type: 'error',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRegenerate = () => {
    setPhase('idle');
    setProgress(0);
    setVideoUrl(null);
    window.setTimeout(() => void runGeneration(), 100);
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      {/* Left: controls */}
      <div className="w-full shrink-0 space-y-6 lg:w-[460px]">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gradient-hero">
            Generate Video
          </h1>
          <p className="text-sm text-secondary">
            Create cinematic videos with AI-powered generation
          </p>
        </div>

        {/* Prompt box */}
        <div
          className={cn(
            'relative rounded-2xl glass-input transition-all duration-200',
            'focus-within:scale-[1.01] focus-within:border-accent-cyan focus-within:shadow-[0_0_0_4px_rgba(6,182,212,0.15)]'
          )}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to create... (e.g., 'A serene beach sunset with crashing waves')"
            maxLength={1000}
            disabled={phase === 'generating'}
            className="min-h-[160px] w-full resize-none rounded-2xl bg-transparent px-5 pb-16 pt-5 text-base text-primary placeholder:text-muted focus:outline-none disabled:opacity-60"
            style={{ minHeight: '160px' }}
          />
          
          <div className="absolute bottom-4 left-5 flex items-center gap-4">
            <span className="text-xs text-muted">
              {prompt.length} / 1000
            </span>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isEnhancing || !prompt.trim() || phase === 'generating'}
            onClick={handleEnhance}
            className="absolute bottom-3 right-3 text-secondary hover:text-accent-cyan"
            leftIcon={<Wand2 className={cn('h-4 w-4', isEnhancing && 'animate-spin')} />}
          >
            {isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}
          </Button>
        </div>

        {reuseBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-accent-indigo/30 bg-accent-indigo/10 px-4 py-2.5 text-sm text-accent-indigo flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reusing prompt settings from previous generation
          </motion.div>
        )}

        {/* Generation settings */}
        <div className="glass-card rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-primary hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-muted" />
              <span>Video Settings</span>
            </div>
            {settingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          <AnimatePresence initial={false}>
            {settingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-6 border-t border-white/10 px-6 pb-6 pt-5">
                  {/* Duration */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                      <Timer className="h-3 w-3" />
                      Duration
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {DURATION_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={duration === opt.id}
                          onClick={() => setDuration(opt.id)}
                          className="flex flex-col items-center gap-1"
                        >
                          {opt.icon}
                          <span className="text-xs">{opt.label}</span>
                          <span className="text-[10px] text-muted">{opt.credits}cr</span>
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                      <AspectRatioIcon className="h-3 w-3" />
                      Aspect Ratio
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {ASPECT_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={aspectRatio === opt.id}
                          onClick={() => setAspectRatio(opt.id)}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="flex items-center justify-center">
                            {opt.icon}
                          </div>
                          <span className="text-xs">{opt.label}</span>
                          <span className="text-[10px] text-muted">{opt.description}</span>
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                      <Server className="h-3 w-3" />
                      AI Provider
                    </p>
                    <div className="flex flex-col gap-2">
                      {PROVIDER_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setProvider(opt.id)}
                          className={cn(
                            'flex items-center justify-between rounded-xl border p-3 transition-all duration-200',
                            provider === opt.id
                              ? 'border-accent-indigo bg-gradient-to-r from-accent-indigo/20 to-accent-violet/20'
                              : 'border-white/10 bg-input hover:border-accent-indigo/40'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-2 w-2 rounded-full',
                              provider === opt.id ? 'bg-accent-indigo' : 'bg-muted'
                            )} />
                            <div className="text-left">
                              <p className="text-sm font-medium text-primary">{opt.label}</p>
                              <p className="text-xs text-muted">{opt.description}</p>
                            </div>
                          </div>
                          {opt.badge && (
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                              provider === opt.id ? 'bg-accent-indigo text-white' : 'bg-white/10 text-muted'
                            )}>
                              {opt.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost indicator */}
                  <div className="flex items-center justify-between rounded-xl border border-accent-cyan/30 bg-gradient-to-r from-accent-indigo/10 to-accent-cyan/10 p-3">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-secondary">Estimated cost</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-indigo/20 px-3 py-1 text-sm font-bold text-accent-cyan shadow-glow-cyan">
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        {creditCost} credits
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Video generation takes 2-4 minutes and runs in the background
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Generate Button */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={hasInsufficientCredits || phase === 'generating' || !prompt.trim()}
          isLoading={phase === 'generating'}
          onClick={runGeneration}
          leftIcon={!hasInsufficientCredits && phase !== 'generating' ? <Film className="h-4 w-4" /> : undefined}
        >
          {hasInsufficientCredits ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Need {creditCost - availableCredits} More Credits
            </>
          ) : phase === 'generating' ? (
            'Generating...'
          ) : (
            `Generate Video · ${creditCost} credits`
          )}
        </Button>

        {/* Info notice */}
        <div className="flex gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning">Processing time</p>
            <p className="text-xs text-warning/80">
              Video generation typically takes 2-4 minutes. You can keep working while your video renders in the background.
            </p>
          </div>
        </div>
      </div>

      {/* Right: output */}
      <div className="relative min-h-[500px] flex-1">
        <div className="drop-zone relative flex h-full min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-2xl glass-card p-8">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-80 w-80 rounded-full bg-accent-violet/5 blur-[100px]" />
            <div className="absolute h-60 w-60 rounded-full bg-accent-indigo/5 blur-[80px]" />
          </div>

          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 flex flex-col items-center gap-5 text-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-input shadow-lg">
                  <Clapperboard className="h-10 w-10 text-muted" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary">Your video will appear here</p>
                  <p className="text-sm text-muted mt-1">Configure settings and click generate</p>
                </div>
              </motion.div>
            )}

            {phase === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 w-full max-w-md space-y-6 px-4"
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <Film className="h-16 w-16 text-accent-violet animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-accent-violet/20 animate-ping" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-primary">{stageLabel}</p>
                    <p className="text-sm text-muted">{stageDescription}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-medium">{progress}%</span>
                    <span className="text-muted">Estimated: ~{Math.ceil((100 - progress) * 4.8)}s</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2 bg-white/10"
                  />
                </div>
              </motion.div>
            )}

            {phase === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-2xl space-y-5"
              >
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                  <video
                    src={videoUrl ?? ''}
                    controls
                    playsInline
                    className="aspect-video w-full object-cover"
                    poster="https://via.placeholder.com/1920x1080/1a1a2e/ffffff?text=Video+Preview"
                  >
                    <track kind="captions" />
                  </video>
                  
                  {/* Play button overlay for better UX */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => addToast({ title: 'Download started', type: 'success' })}
                  >
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11"
                    leftIcon={<FolderPlus className="h-4 w-4" />}
                    onClick={() => addToast({ title: 'Added to library', type: 'success' })}
                  >
                    Save to Library
                  </Button>
                  <Button 
                    type="button" 
                    variant="primary" 
                    className="h-11"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    onClick={handleRegenerate}
                  >
                    Regenerate
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function VideoGeneratePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Film className="h-10 w-10 animate-pulse text-accent-violet" />
            <p className="text-sm text-muted">Loading video generator...</p>
          </div>
        </div>
      }
    >
      <VideoGeneratePageContent />
    </React.Suspense>
  );
}