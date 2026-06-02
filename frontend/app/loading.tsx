export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0D12]">
      <div className="relative h-24 w-24">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-accent-indigo animate-spin" />
        {/* Middle Ring */}
        <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin-reverse opacity-70" />
        {/* Inner Core */}
        <div className="absolute inset-8 rounded-full bg-gradient-primary blur-sm animate-pulse" />
        
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-black uppercase tracking-[0.3em] text-accent-indigo animate-pulse">
          Initializing
        </div>
      </div>
    </div>
  );
}
