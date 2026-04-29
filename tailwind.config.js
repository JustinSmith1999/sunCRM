/** @type {import('tailwindcss').Config} */
//
// sunCRM design tokens, exposed as Tailwind utility classes.
// Source colors are sampled directly from the SUNation Energy logo:
//   #00AEEF (sky blue, the brand action)
//   #F8C808 (sun yellow, the accent)
//   #005088 (navy, the dark surface / wordmark)
// Source of truth: src/theme/tokens.ts
//
// THE SCRIPT (rules of usage):
//   bg-sky / text-sky        — primary brand action (CTAs, links, active tabs)
//   bg-sun / text-sun        — accent / highlights / energy moments
//   bg-navy / text-navy      — dark surfaces (sidebar, modals, headers)
//   bg-white / bg-cream      — light surfaces (never bg-slate-100 for surfaces)
//   text-ink, text-ink-muted — body text scale
//   border-line / border-line-strong — hairlines
//   bg-court-* text-court    — RARE — only "online" / "delivered" / "saved"
//
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ink — text only
        ink: {
          DEFAULT: '#0B0F14',
          800: '#11161D',
          700: '#1A2129',
          600: '#2A323C',
          500: '#3A4754',
          400: '#647280',
          300: '#8C99A4',
          200: '#C0C8D0',
          100: '#E5E7EB',
          50:  '#F4F6F8',
          muted:  '#3A4754',
          subtle: '#647280',
        },

        // SKY — the brand. Primary action color, sampled from the SUNation logo.
        sky: {
          DEFAULT: '#00AEEF',
          deep:    '#0090C8',
          dark:    '#005088',   // navy variant — wordmark
          soft:    '#7FD7F7',
          pale:    '#E6F6FD',
          glow:    '#B5E7FA',
        },

        // SUN — the accent (the literal sun in the logo).
        sun: {
          DEFAULT: '#F8C808',
          deep:    '#D9AB00',
          soft:    '#FBE068',
          pale:    '#FEF6CC',
          glow:    '#FFEFA1',
        },

        // NAVY — gravity. Dark surfaces, sidebar, modals.
        navy: {
          DEFAULT: '#005088',
          deep:    '#003B66',
          light:   '#3A7AAD',
          pale:    '#E6F0F7',
        },

        // Court / online green — RARE
        court: {
          DEFAULT: '#2E6E3E',
          soft:    '#DCE8DA',
          pale:    '#F2F8F1',
        },

        cream:   '#FAF6EE',
        sand: {
          pale: '#F7F4ED',
          DEFAULT: '#EDE7D7',
          mid:  '#D6CBAF',
        },
        line:    '#E5E7EB',
        'line-strong': '#C0C8D0',

        success: '#34C77B',
        warning: '#F2A93B',
        danger:  '#E5484D',

        // ── PALETTE OVERRIDES ───────────────────────────────────────────
        // Re-map Tailwind defaults so existing screens auto-inherit the
        // SUNation palette without us having to touch 60 files.
        slate: {
          50:  '#F4F6F8',
          100: '#E5E7EB',
          200: '#C0C8D0',
          300: '#8C99A4',
          400: '#647280',
          500: '#3A4754',
          600: '#2A323C',
          700: '#1A2129',
          800: '#11161D',
          900: '#0B0F14',
          950: '#000000',
        },
        gray: {
          50:  '#F4F6F8',
          100: '#E5E7EB',
          200: '#C0C8D0',
          300: '#8C99A4',
          400: '#647280',
          500: '#3A4754',
          600: '#2A323C',
          700: '#1A2129',
          800: '#11161D',
          900: '#0B0F14',
          950: '#000000',
        },
        zinc: {
          50:  '#F4F6F8',
          100: '#E5E7EB',
          200: '#C0C8D0',
          300: '#8C99A4',
          400: '#647280',
          500: '#3A4754',
          600: '#2A323C',
          700: '#1A2129',
          800: '#11161D',
          900: '#0B0F14',
          950: '#000000',
        },
        neutral: {
          50:  '#F4F6F8',
          100: '#E5E7EB',
          200: '#C0C8D0',
          300: '#8C99A4',
          400: '#647280',
          500: '#3A4754',
          600: '#2A323C',
          700: '#1A2129',
          800: '#11161D',
          900: '#0B0F14',
          950: '#000000',
        },
        // Existing "primary blue" CTAs become SUNation sky.
        blue: {
          50:  '#E6F6FD',
          100: '#C2EAFA',
          200: '#7FD7F7',
          300: '#3AC5F2',
          400: '#0FBAEE',
          500: '#00AEEF',
          600: '#0090C8',
          700: '#0072A0',
          800: '#005580',
          900: '#003B66',
          950: '#002847',
        },
        cyan: {
          50:  '#E6F6FD',
          100: '#C2EAFA',
          200: '#7FD7F7',
          300: '#3AC5F2',
          400: '#0FBAEE',
          500: '#00AEEF',
          600: '#0090C8',
          700: '#0072A0',
          800: '#005580',
          900: '#003B66',
        },
        // Indigo (sometimes used for "primary" CTAs in third-party kits) → sky-dark/navy
        indigo: {
          50:  '#E6F0F7',
          100: '#C7DCEC',
          200: '#9BBED9',
          300: '#6E9FC4',
          400: '#3A7AAD',
          500: '#005088',
          600: '#004373',
          700: '#003B66',
          800: '#002F52',
          900: '#001F38',
        },
        // amber + orange were used as the brand-yellow ish — point at SUN.
        amber: {
          50:  '#FEF6CC',
          100: '#FDEBA0',
          200: '#FBE068',
          300: '#FAD438',
          400: '#F8C808',
          500: '#F8C808',
          600: '#D9AB00',
          700: '#A88500',
          800: '#7A6000',
          900: '#5A4700',
        },
        orange: {
          50:  '#FEF6CC',
          100: '#FDEBA0',
          200: '#FBE068',
          300: '#FAD438',
          400: '#F8C808',
          500: '#F8C808',
          600: '#D9AB00',
          700: '#A88500',
          800: '#7A6000',
          900: '#5A4700',
        },
        yellow: {
          50:  '#FEF6CC',
          100: '#FDEBA0',
          200: '#FBE068',
          300: '#FAD438',
          400: '#F8C808',
          500: '#F8C808',
          600: '#D9AB00',
          700: '#A88500',
          800: '#7A6000',
          900: '#5A4700',
        },
        // ── END PALETTE OVERRIDES ───────────────────────────────────────
      },
      fontFamily: {
        display: ['Fraunces', 'Iowan Old Style', 'Apple Garamond', 'Georgia', 'serif'],
        body:    ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono:    ['"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '16px',
        xl:   '22px',
        '2xl':'28px',
      },
      boxShadow: {
        // Navy-tinted shadows for that "professional solar" feel.
        soft: '0 2px 8px rgba(0,80,136,0.06)',
        card: '0 6px 16px rgba(0,80,136,0.10)',
        pop:  '0 12px 28px rgba(0,80,136,0.14)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        fast: '160ms',
        base: '240ms',
        slow: '380ms',
      },
      letterSpacing: {
        tightish: '-0.2px',
        tighter:  '-0.4px',
        tightest: '-0.6px',
        eyebrow:  '1.6px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
};
