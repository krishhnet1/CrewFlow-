import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0F1A',
          card: '#141928',
          elevated: '#1C2238',
          overlay: 'rgba(0,0,0,0.64)',
        },
        accent: {
          DEFAULT: '#FF6B2C',
          pressed: '#E75A1F',
          soft: 'rgba(255,107,44,0.12)',
        },
        status: {
          success: '#00D67E',
          warning: '#FFB800',
          danger: '#FF4757',
          info: '#3B82F6',
          'success-soft': 'rgba(0,214,126,0.12)',
          'warning-soft': 'rgba(255,184,0,0.12)',
          'danger-soft': 'rgba(255,71,87,0.12)',
          'info-soft': 'rgba(59,130,246,0.12)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8B92A8',
          muted: '#555D75',
          inverse: '#0B0F1A',
        },
        border: {
          subtle: '#1F2538',
          DEFAULT: '#2A3247',
          strong: '#3A4360',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '48px',
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        pill: '20px',
        modal: '20px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
