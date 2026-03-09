/**
 * Shared section header component — used across all marketing sections
 * Server Component — no 'use client' needed
 */

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className = 'mb-16' }: SectionHeaderProps) {
  return (
    <div className={`text-center ${className}`}>
      <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">{title}</h2>
      <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6" />
      {subtitle && (
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
