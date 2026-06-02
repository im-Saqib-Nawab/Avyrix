'use client';

import * as React from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useCreditsStore } from '@/store/credits.store';
import { SUGGESTION_PROMPTS } from '@/lib/dummy-data';
import { api } from '@/lib/api';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Download,
  ImageIcon,
  Loader2,
  Lock,
  Maximize2,
  RotateCcw,
  Sparkles,
  Star,
  Wand2,
  Settings as SettingsIcon,
  Layers,
  Palette,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadMediaUrl } from '@/lib/download';
import { getGenerationErrorMessage } from '@/lib/generation-errors';

type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';
type Quality = 'standard' | 'hd';
type Style = 'vivid' | 'natural';
type GenerationPhase = 'idle' | 'generating' | 'success';

const SIZE_OPTIONS: { id: ImageSize; label: string; icon: React.ReactNode; description: string }[] = [
  { id: '1024x1024', label: 'Square', icon: <div className="h-4 w-4 rounded-sm border-2" />, description: '1:1 Perfect for social' },
  { id: '1792x1024', label: 'Landscape', icon: <div className="h-3 w-5 rounded-sm border-2" />, description: '16:9 Cinematic' },
  { id: '1024x1792', label: 'Portrait', icon: <div className="h-5 w-3 rounded-sm border-2" />, description: '9:16 Mobile' },
];

const QUALITY_OPTIONS: { id: Quality; label: string; credits: string; badge?: string }[] = [
  { id: 'standard', label: 'Standard', credits: '5cr', badge: 'Fast' },
  { id: 'hd', label: 'HD', credits: '10cr', badge: 'Premium' },
];

const STYLE_OPTIONS: { id: Style; label: string; icon: React.ReactNode }[] = [
  { id: 'vivid', label: 'Vivid', icon: <Palette className="h-4 w-4" /> },
  { id: 'natural', label: 'Natural', icon: <Layers className="h-4 w-4" /> },
];

const STAGE_MESSAGES = [
  { text: 'Analyzing your prompt...', icon: '🔍' },
  { text: 'Consulting the AI...', icon: '🧠' },
  { text: 'Rendering your image...', icon: '🎨' },
  { text: 'Adding final touches...', icon: '✨' },
] as const;

function calculateCreditCost(size: ImageSize, quality: Quality): number {
  const isWide = size !== '1024x1024';
  if (quality === 'hd') return 10;
  return isWide ? 8 : 5;
}

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

function ImageGeneratePageContent() {
  const searchParams = useSearchParams();
  const reuseId = searchParams.get('reuse');
  const { addToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setBalance = useCreditsStore((s) => s.setBalance);

  const [prompt, setPrompt] = React.useState('');
  const [size, setSize] = React.useState<ImageSize>('1024x1024');
  const [quality, setQuality] = React.useState<Quality>('hd');
  const [style, setStyle] = React.useState<Style>('vivid');
  const [settingsOpen, setSettingsOpen] = React.useState(true);
  const [phase, setPhase] = React.useState<GenerationPhase>('idle');
  const [generationStage, setGenerationStage] = React.useState<string>(STAGE_MESSAGES[0].text);
  const [resultImage, setResultImage] = React.useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [fullscreenOpen, setFullscreenOpen] = React.useState(false);
  const [reuseBanner, setReuseBanner] = React.useState(false);
  const [currentGenerationId, setCurrentGenerationId] = React.useState<string | null>(null);

  const creditCost = calculateCreditCost(size, quality);
  const availableCredits = user?.credit_balance ?? 0;
  const hasInsufficientCredits = availableCredits < creditCost;

  React.useEffect(() => {
    if (!reuseId) return;
    const loadReuse = async () => {
      try {
        const res = await api.post(`/api/generations/${reuseId}/reuse`);
        const { prompt: reusePrompt, parameters } = res.data.data;
        setPrompt(reusePrompt);
        if (parameters?.size === '1024x1024' || parameters?.size === '1792x1024' || parameters?.size === '1024x1792') {
          setSize(parameters.size);
        }
        if (parameters?.quality === 'standard' || parameters?.quality === 'hd') {
          setQuality(parameters.quality);
        }
        if (parameters?.style === 'vivid' || parameters?.style === 'natural') {
          setStyle(parameters.style);
        }
        setReuseBanner(true);
      } catch {
        // ignore
      }
    };
    void loadReuse();
  }, [reuseId]);

  const handleWsMessage = React.useCallback(
    (msg: { type: string; generationId?: string; [key: string]: unknown }) => {
      if (!currentGenerationId || msg.generationId !== currentGenerationId) return;

      switch (msg.type) {
        case 'GENERATION_STATUS':
          if (typeof msg.stage === 'string') setGenerationStage(msg.stage);
          break;
        case 'GENERATION_COMPLETE':
          setResultImage(msg.media_url as string);
          setPhase('success');
          setCurrentGenerationId(null);
          void api.get('/api/credits/balance').then((res) => {
            const balance = res.data.data.balance as number;
            setBalance(balance);
            if (user) setUser({ ...user, credit_balance: balance });
          });
          addToast({
            title: 'Image generated successfully!',
            description: `${String(msg.credits_used ?? creditCost)} credits used.`,
            type: 'success',
          });
          break;
        case 'GENERATION_FAILED':
          setPhase('idle');
          setCurrentGenerationId(null);
          void api.get('/api/credits/balance').then((res) => {
            const balance = res.data.data.balance as number;
            setBalance(balance);
            if (user) setUser({ ...user, credit_balance: balance });
          });
          addToast({
            title: 'Generation failed',
            description: (msg.userMessage as string) || 'Please try again.',
            type: 'error',
          });
          break;
        default:
          break;
      }
    },
    [addToast, creditCost, currentGenerationId, setBalance, setUser, user],
  );

  useWebSocket(handleWsMessage, phase === 'generating' || !!currentGenerationId);

  const runGeneration = React.useCallback(async () => {
    if (!prompt.trim()) {
      addToast({
        title: 'Prompt required',
        description: 'Please enter a description for your image.',
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
    setGenerationStage('Submitting your request...');
    setResultImage(null);

    try {
      const res = await api.post('/api/generations/image', {
        prompt,
        size,
        quality,
        style,
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
            : getApiErrorMessage(error, 'Generation failed. Please try again.'),
        type: 'error',
      });
      setPhase('idle');
    }
  }, [addToast, availableCredits, creditCost, prompt, quality, size, style]);

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
    setResultImage(null);
    runGeneration();
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      {/* Left: controls */}
      <div className="w-full shrink-0 space-y-6 lg:w-[460px]">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Generate Image
          </h1>
          <p className="text-sm text-secondary">
            Create stunning visuals with AI-powered generation
          </p>
        </div>
        <div
          className={cn(
            'relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#111827] to-[#0f1117] transition-all duration-200',
            'focus-within:scale-[1.01] focus-within:border-accent-indigo focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.15)]'
          )}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            maxLength={1000}
            disabled={phase === 'generating'}
            className="min-h-[180px] w-full resize-none rounded-2xl bg-transparent px-5 pb-16 pt-5 text-base text-primary placeholder:text-muted focus:outline-none disabled:opacity-60"
            style={{ minHeight: '180px' }}
          />
          
          <div className="absolute bottom-4 left-5 flex items-center gap-4">
            <span className="text-xs text-muted">
              {prompt.length} / 1000
            </span>
            {prompt.length > 800 && (
              <span className="text-[10px] text-warning">Getting long</span>
            )}
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
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-card to-card/80">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-primary hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-muted" />
              <span>Generation Settings</span>
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
                  {/* Image Size */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                      <Maximize2 className="h-3 w-3" />
                      Image Size
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {SIZE_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={size === opt.id}
                          onClick={() => setSize(opt.id)}
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

                  {/* Quality */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                      <Star className="h-3 w-3" />
                      Quality
                    </p>
                    <div className="flex gap-3">
                      {QUALITY_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={quality === opt.id}
                          onClick={() => setQuality(opt.id)}
                          className="flex-1 flex items-center justify-between"
                        >
                          <span>{opt.label}</span>
                          <div className="flex items-center gap-1">
                            {opt.badge && (
                              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">
                                {opt.badge}
                              </span>
                            )}
                            <span className="text-xs">{opt.credits}</span>
                          </div>
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  {/* Style */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                      <Palette className="h-3 w-3" />
                      Style
                    </p>
                    <div className="flex gap-3">
                      {STYLE_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={style === opt.id}
                          onClick={() => setStyle(opt.id)}
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          {opt.icon}
                          {opt.label}
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  {/* Cost indicator */}
                  <div className="rounded-xl bg-accent-indigo/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary">Estimated cost</span>
                      <span className="text-lg font-bold text-accent-indigo">{creditCost} credits</span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Higher quality and larger sizes consume more credits
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
          leftIcon={!hasInsufficientCredits && phase !== 'generating' ? <Zap className="h-4 w-4" /> : undefined}
        >
          {hasInsufficientCredits ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Need {creditCost - availableCredits} More Credits
            </>
          ) : phase === 'generating' ? (
            'Generating...'
          ) : (
            `Generate Image · ${creditCost} credits`
          )}
        </Button>
      </div>

      {/* Right: output */}
      <div className="relative min-h-[500px] flex-1">
        <div className="relative flex h-full min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-card/50 to-card/30 p-8">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-80 w-80 rounded-full bg-accent-indigo/5 blur-[100px]" />
            <div className="absolute h-60 w-60 rounded-full bg-accent-violet/5 blur-[80px]" />
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
                  <ImageIcon className="h-10 w-10 text-muted" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary">Your image will appear here</p>
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
                className="relative z-10 flex flex-col items-center gap-6"
              >
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-accent-indigo" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-accent-indigo/20 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-primary">
                    {generationStage}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    This may take a few moments...
                  </p>
                </div>
              </motion.div>
            )}

            {phase === 'success' && resultImage && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-2xl"
              >
                <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <Image
                    src={resultImage}
                    alt="Generated"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-11 w-11 rounded-xl border-white/20 bg-white/10 backdrop-blur-md hover:scale-110 transition-transform"
                      onClick={() => setFullscreenOpen(true)}
                      aria-label="Fullscreen"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-11 w-11 rounded-xl border-white/20 bg-white/10 backdrop-blur-md hover:scale-110 transition-transform"
                      onClick={() => {
                        if (resultImage) {
                          void downloadMediaUrl(resultImage, 'avyrix-image.png');
                        }
                        addToast({ title: 'Download started', type: 'success' });
                      }}
                      aria-label="Download"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-11 w-11 rounded-xl border-white/20 bg-white/10 backdrop-blur-md hover:scale-110 transition-transform"
                      onClick={() => addToast({ title: 'Saved to library', type: 'success' })}
                      aria-label="View in library"
                    >
                      <Bookmark className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="icon"
                      className="h-11 w-11 rounded-xl hover:scale-110 transition-transform"
                      onClick={handleRegenerate}
                      aria-label="Regenerate"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Modal
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        title="Preview"
        className="max-w-5xl"
      >
        {resultImage && (
          <div className="relative -mx-2 aspect-square w-full max-h-[80vh] overflow-hidden rounded-xl">
            <Image 
              src={resultImage} 
              alt="Fullscreen preview" 
              fill 
              className="object-contain" 
              sizes="90vw" 
              priority
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function ImageGeneratePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-accent-indigo" />
            <p className="text-sm text-muted">Loading generator...</p>
          </div>
        </div>
      }
    >
      <ImageGeneratePageKeyed />
    </React.Suspense>
  );
}

function ImageGeneratePageKeyed() {
  const searchParams = useSearchParams();
  const reuseKey = searchParams.get('reuse') ?? 'new';
  return <ImageGeneratePageContent key={reuseKey} />;
}