import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Discord-inspired palette, kept minimal
        accent: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
          soft: 'rgba(88, 101, 242, 0.15)',
        },
        rail: {
          DEFAULT: '#1E1F22',
        },
        sidebar: {
          DEFAULT: '#2B2D31',
          hover: '#35373C',
          active: '#404249',
        },
        content: {
          DEFAULT: '#313338',
          darker: '#2B2D31',
          input: '#1E1F22',
        },
        surface: {
          DEFAULT: '#2B2D31',
          raised: '#313338',
          overlay: '#1E1F22',
        },
        text: {
          primary: '#DBDEE1',
          secondary: '#B5BAC1',
          muted: '#949BA4',
          link: '#00A8FC',
        },
        upvote: '#F91880',
        downvote: '#5A70FF',
      },
      fontFamily: {
        sans: [
          'gg sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        btn: '3px',
        card: '8px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
