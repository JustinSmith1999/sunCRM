/** @type {import('tailwindcss').Config} */
//
// sunCRM v3 — design constraints, in plain English:
//   1. ONE typeface (Apple SF stack — native on Mac/iOS, system fallback elsewhere).
//   2. ONE accent (sky blue #00AEEF). Everything else is neutral grey.
//   3. NO gradients. NO drop shadows. 1-pixel borders carry the visual weight.
//   4. Light + dark, both first-class. The `dark` class is set on <html> by a
//      pre-React script in index.html that honors prefers-color-scheme.
//
// Source of truth lives here. Components reference these tokens via Tailwind
// utility classes — no other token files.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Apple SF on Mac/iOS, Segoe on Windows, sensible elsewhere.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro"',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro"',
          'system-ui',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        // Override `blue` to the SUNation brand sky scale. Every existing
        // `bg-blue-*` / `text-blue-*` in the codebase now uses our brand color.
        blue: {
          50:  '#E6F7FE',
          100: '#C2EDFC',
          200: '#7FD9F8',
          300: '#3AC5F2',
          400: '#1AB9EF',
          500: '#00AEEF',  // primary brand
          600: '#0090C8',
          700: '#0072A0',
          800: '#005580',
          900: '#003B66',
          950: '#002847',
        },
        // Match cyan to brand too — same family.
        cyan: {
          50:  '#E6F7FE',
          100: '#C2EDFC',
          200: '#7FD9F8',
          300: '#3AC5F2',
          400: '#1AB9EF',
          500: '#00AEEF',
          600: '#0090C8',
          700: '#0072A0',
          800: '#005580',
          900: '#003B66',
        },
      },
      borderRadius: {
        // Tighter, more Stripe/Linear-style corners. Override the kitchen-sink
        // `rounded-2xl` calls scattered around the codebase to a calmer 12px.
        '2xl': '12px',
      },
    },
  },
  plugins: [],
};
