import React from 'react';

export interface StubModuleCardProps {
  title: string;
  body: string;
  variant?: 'disabled' | 'stub';
}

export const StubModuleCard: React.FC<StubModuleCardProps> = ({
  title,
  body,
  variant = 'stub',
}) => {
  const tone =
    variant === 'disabled'
      ? 'opacity-70 border-white/5 bg-slate-900/30'
      : 'border-dashed border-white/10 bg-slate-900/20';
  return (
    <section className={`rounded-xl border px-3 py-2 ${tone}`}>
      <h2 className="text-[11px] font-semibold text-slate-300">{title}</h2>
      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{body}</p>
    </section>
  );
};
