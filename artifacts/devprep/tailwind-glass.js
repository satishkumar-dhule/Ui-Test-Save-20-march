import plugin from 'tailwindcss/plugin'

export default plugin(function ({ addUtilities, matchUtilities, theme }) {
  // Add glass utilities
  addUtilities({
    '.glass': {
      background: 'var(--glass-opacity-light)',
      'backdrop-filter': 'blur(var(--glass-blur-medium))',
      '-webkit-backdrop-filter': 'blur(var(--glass-blur-medium))',
      border: '1px solid var(--glass-border-light)',
      'box-shadow': 'var(--glass-shadow-light)',
      position: 'relative',
      overflow: 'hidden',
      transform: 'translateZ(0)',
      'will-change': 'transform, box-shadow',
      contain: 'layout style paint',
    },
    '.glass-light': {
      background: 'var(--glass-opacity-medium)',
      'backdrop-filter': 'blur(var(--glass-blur-light))',
      '-webkit-backdrop-filter': 'blur(var(--glass-blur-light))',
      border: '1px solid var(--glass-border-medium)',
      'box-shadow': 'var(--glass-shadow-light)',
      position: 'relative',
      overflow: 'hidden',
    },
    '.glass-dark': {
      background: 'var(--glass-opacity-dark)',
      'backdrop-filter': 'blur(var(--glass-blur-heavy))',
      '-webkit-backdrop-filter': 'blur(var(--glass-blur-heavy))',
      border: '1px solid var(--glass-border-subtle)',
      'box-shadow': 'var(--glass-shadow-medium)',
      position: 'relative',
      overflow: 'hidden',
    },
    '.glass-subtle': {
      background: 'var(--glass-opacity-subtle)',
      'backdrop-filter': 'blur(var(--glass-blur-light))',
      '-webkit-backdrop-filter': 'blur(var(--glass-blur-light))',
      border: '1px solid var(--glass-border-subtle)',
      'box-shadow': 'none',
      position: 'relative',
      overflow: 'hidden',
    },
    '.glass-hover': {
      transition: 'all 0.3s ease-out',
      '&:hover': {
        transform: 'scale(1.02)',
        'box-shadow': '0 8px 32px rgba(10, 132, 255, 0.15)',
      },
    },
    '.glass-active': {
      '&:active': {
        background: 'var(--glass-opacity-dark)',
        transform: 'translateY(0)',
        'box-shadow': 'var(--glass-shadow-light)',
      },
    },
    '.glass-focus': {
      '&:focus-visible': {
        outline: '2px solid rgba(124, 120, 232, 0.5)',
        'outline-offset': '2px',
        'box-shadow': 'var(--glass-shadow-medium), 0 0 0 4px rgba(124, 120, 232, 0.1)',
      },
    },
    '.glass-transition': {
      transition: 'all 0.3s ease-out',
    },
  })
})
