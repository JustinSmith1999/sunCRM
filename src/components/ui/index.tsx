/**
 * sunCRM primitive UI kit.
 *
 * Mirrors the Pickleball Heaven mobile component vocabulary on the web.
 * Each primitive is a thin, opinionated wrapper — no big design framework,
 * just a consistent way to express "card", "button", "list row", etc. so
 * every screen feels like the same product. Compose freely.
 *
 * Naming intentionally avoids leaking Tailwind classes into call sites.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type ButtonNativeProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

// =====================================================================
// Stack — vertical/horizontal spacing primitive (4-pt grid).
// =====================================================================
export interface StackProps extends DivProps {
  direction?: 'col' | 'row';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}
const gapMap = { xs: 'gap-1', sm: 'gap-2', md: 'gap-3', lg: 'gap-4', xl: 'gap-6', '2xl': 'gap-8' };
const alignMap = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' };
const justMap  = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' };

export function Stack({
  direction = 'col', gap = 'md', align, justify, wrap, className = '', children, ...rest
}: StackProps) {
  const cls = [
    'flex',
    direction === 'col' ? 'flex-col' : 'flex-row',
    gapMap[gap],
    align ? alignMap[align] : '',
    justify ? justMap[justify] : '',
    wrap ? 'flex-wrap' : '',
    className,
  ].filter(Boolean).join(' ');
  return <div className={cls} {...rest}>{children}</div>;
}

// =====================================================================
// Text — opinionated typography. Everything else is just <span>/<p>.
// =====================================================================
type TextVariant =
  | 'display1' | 'display2' | 'display3'
  | 'h1' | 'h2' | 'h3'
  | 'body' | 'bodyStrong' | 'small' | 'smallStrong'
  | 'caption' | 'overline' | 'numeric';

const textVariantClass: Record<TextVariant, string> = {
  display1:    'font-display font-bold text-[44px] leading-[48px] tracking-tightest',
  display2:    'font-display font-bold text-[34px] leading-[38px] tracking-tighter',
  display3:    'font-display font-semibold text-[26px] leading-[32px] tracking-tightish',
  h1:          'font-body font-bold text-[24px] leading-[30px] tracking-tightish',
  h2:          'font-body font-semibold text-[20px] leading-[26px]',
  h3:          'font-body font-semibold text-[17px] leading-[24px]',
  body:        'font-body text-[16px] leading-[24px]',
  bodyStrong:  'font-body font-semibold text-[16px] leading-[24px]',
  small:       'font-body text-[14px] leading-[20px]',
  smallStrong: 'font-body font-semibold text-[14px] leading-[20px]',
  caption:     'font-body font-medium text-[12px] leading-[16px] tracking-wide',
  overline:    'font-body font-bold text-[11px] leading-[14px] tracking-eyebrow uppercase',
  numeric:     'font-body font-medium text-[16px] leading-[22px] tabular',
};

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: keyof React.JSX.IntrinsicElements;
  tone?: 'default' | 'muted' | 'subtle' | 'sun' | 'sky' | 'court' | 'danger' | 'inverse';
}
const toneMap = {
  default: 'text-ink',
  muted:   'text-ink-muted',
  subtle:  'text-ink-subtle',
  sun:     'text-sun-deep',
  sky:     'text-sky-dark',
  court:   'text-court',
  danger:  'text-danger',
  inverse: 'text-white',
};

export function Text({
  variant = 'body', as = 'span', tone = 'default', className = '', children, ...rest
}: TextProps) {
  const Cmp = as as any;
  const cls = `${textVariantClass[variant]} ${toneMap[tone]} ${className}`;
  return <Cmp className={cls} {...rest}>{children}</Cmp>;
}

// =====================================================================
// Card — surfaces. The only sanctioned way to make a "box" in the app.
// =====================================================================
export interface CardProps extends DivProps {
  variant?: 'elevated' | 'outlined' | 'flat' | 'warm' | 'sky' | 'court';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}
const cardVariantClass = {
  elevated: 'bg-white border border-line shadow-soft',
  outlined: 'bg-white border border-line',
  flat:     'bg-ink-50',
  warm:     'bg-cream',
  sky:      'bg-sky-pale border border-sky-soft',     // sky moments
  court:    'bg-court-pale border border-court-soft', // RARE — "online"/"delivered"
};
const cardPadClass = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({
  variant = 'elevated', padding = 'md', interactive, className = '', children, ...rest
}: CardProps) {
  const cls = [
    'rounded-lg',
    cardVariantClass[variant],
    cardPadClass[padding],
    interactive ? 'transition-all duration-base ease-smooth hover:shadow-card hover:-translate-y-0.5 cursor-pointer press-scale' : '',
    className,
  ].filter(Boolean).join(' ');
  return <div className={cls} {...rest}>{children}</div>;
}

// =====================================================================
// Button — primary/secondary/ghost/danger. Pill-shaped, tactile.
// =====================================================================
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sun';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonNativeProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[14px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-[16px]',
};
const buttonVariantClass: Record<ButtonVariant, string> = {
  primary:   'bg-sky text-white hover:bg-sky-deep',
  sun:       'bg-sun text-ink hover:bg-sun-deep',
  secondary: 'bg-white text-ink border border-line-strong hover:bg-ink-50',
  ghost:     'bg-transparent text-ink hover:bg-ink-50',
  danger:    'bg-danger text-white hover:opacity-90',
};

export function Button({
  variant = 'primary', size = 'md', loading, fullWidth, leadingIcon, trailingIcon,
  disabled, className = '', children, ...rest
}: ButtonProps) {
  const cls = [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
    'transition-all duration-fast ease-smooth press-scale',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2',
    buttonSizeClass[size],
    buttonVariantClass[variant],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}

// =====================================================================
// Chip — tag / status pill.
// =====================================================================
export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'sun' | 'sky' | 'court' | 'warm' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md';
}
const chipToneClass = {
  default: 'bg-ink-50 text-ink',
  sun:     'bg-sun-pale text-ink',
  sky:     'bg-sky-pale text-sky-dark',
  court:   'bg-court-pale text-court',      // "delivered" / "online"
  warm:    'bg-cream text-ink',
  danger:  'bg-red-50 text-danger',
  success: 'bg-court-pale text-court',
  warning: 'bg-sun-pale text-ink',
};
const chipSizeClass = { sm: 'h-6 px-2 text-[11px]', md: 'h-7 px-3 text-[12px]' };

export function Chip({ tone = 'default', size = 'md', className = '', children, ...rest }: ChipProps) {
  const cls = [
    'inline-flex items-center gap-1 rounded-full font-medium',
    chipSizeClass[size],
    chipToneClass[tone],
    className,
  ].join(' ');
  return <span className={cls} {...rest}>{children}</span>;
}

// =====================================================================
// SectionHeader — the title above a card group.
// =====================================================================
export interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  trailing?: React.ReactNode;
  className?: string;
}
export function SectionHeader({ title, eyebrow, trailing, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between ${className}`}>
      <div>
        {eyebrow && <Text variant="overline" tone="sun" as="div">{eyebrow}</Text>}
        <Text variant="h2" as="h2" className="mt-0.5">{title}</Text>
      </div>
      {trailing}
    </div>
  );
}

// =====================================================================
// ListRow — a clickable row, used for lists everywhere (leads, tasks, etc.)
// =====================================================================
export interface ListRowProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}
export function ListRow({ leading, title, subtitle, trailing, className = '', ...rest }: ListRowProps) {
  return (
    <button
      className={`group w-full flex items-center gap-3 px-4 py-3 bg-white border border-line rounded-lg transition-all duration-base ease-smooth hover:bg-ink-50 press-scale text-left ${className}`}
      {...rest}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink truncate">{title}</div>
        {subtitle && <div className="text-[13px] text-ink-muted truncate mt-0.5">{subtitle}</div>}
      </div>
      {trailing ?? <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-colors" />}
    </button>
  );
}

// =====================================================================
// Stat — a labeled number, the workhorse of dashboards.
// =====================================================================
export interface StatProps {
  label: string;
  value: React.ReactNode;
  delta?: { value: string; tone: 'up' | 'down' | 'flat' };
  tone?: 'default' | 'sun' | 'sky' | 'court';
  hint?: string;
}
export function Stat({ label, value, delta, tone = 'default', hint }: StatProps) {
  const accent = tone === 'sun'   ? 'text-sun-deep'
              : tone === 'sky'   ? 'text-sky-dark'
              : tone === 'court' ? 'text-court'
              : 'text-ink';
  return (
    <Card variant="elevated" padding="md">
      <Text variant="overline" tone="subtle" as="div">{label}</Text>
      <div className={`mt-1.5 font-display font-bold text-[28px] leading-[32px] tabular ${accent}`}>{value}</div>
      <div className="mt-1.5 flex items-center gap-2 min-h-[18px]">
        {delta && (
          <span className={`text-[12px] font-medium ${
            delta.tone === 'up' ? 'text-court' : delta.tone === 'down' ? 'text-danger' : 'text-ink-subtle'
          }`}>
            {delta.tone === 'up' ? '▲' : delta.tone === 'down' ? '▼' : '◆'} {delta.value}
          </span>
        )}
        {hint && <span className="text-[12px] text-ink-subtle">{hint}</span>}
      </div>
    </Card>
  );
}

// =====================================================================
// EmptyState
// =====================================================================
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      {icon && <div className="w-14 h-14 rounded-full bg-ink-50 flex items-center justify-center text-ink-subtle mb-4">{icon}</div>}
      <Text variant="h2" as="h3">{title}</Text>
      {description && <Text variant="body" tone="muted" className="mt-2 max-w-sm">{description}</Text>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// =====================================================================
// Skeleton — loading shimmer.
// =====================================================================
export interface SkeletonProps extends DivProps {
  width?: number | string;
  height?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'pill';
}
export function Skeleton({ width = '100%', height = 16, rounded = 'md', className = '', style, ...rest }: SkeletonProps) {
  const r = rounded === 'pill' ? 'rounded-full' : `rounded-${rounded}`;
  return (
    <div
      className={`bg-ink-50 ${r} relative overflow-hidden ${className}`}
      style={{ width, height, ...style }}
      {...rest}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <style>{'@keyframes shimmer { 100% { transform: translateX(100%); } }'}</style>
    </div>
  );
}

// =====================================================================
// Divider
// =====================================================================
export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`hairline border-line my-4 ${className}`} />;
}
