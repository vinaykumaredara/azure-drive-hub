import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  safelist: [
    'has-[[data-variant=inset]]:bg-sidebar',
    'group-data-[collapsible=offcanvas]:w-0',
    'group-data-[side=left]:-right-4',
    'group-data-[side=right]:left-0',
    'group-data-[collapsible=offcanvas]:translate-x-0',
    'group-data-[collapsible=offcanvas]:after:left-full',
    'group-data-[collapsible=offcanvas]:hover:bg-sidebar',
    '[[data-side=left]_&]:cursor-w-resize',
    '[[data-side=right]_&]:cursor-e-resize',
    '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize',
    '[[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
    '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
    '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
    'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))]',
    'md:peer-data-[variant=inset]:m-2',
    'md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2',
    'md:peer-data-[variant=inset]:ml-0',
    'md:peer-data-[variant=inset]:rounded-xl',
    'md:peer-data-[variant=inset]:shadow',
    'group-data-[variant=floating]:rounded-lg',
    'group-data-[variant=floating]:border',
    'group-data-[variant=floating]:border-sidebar-border',
    'group-data-[variant=floating]:shadow',
    'group-data-[collapsible=icon]:overflow-hidden',
    'group-data-[collapsible=icon]:-mt-8',
    'group-data-[collapsible=icon]:opacity-0',
    'group-has-[[data-sidebar=menu-action]]/menu-item:pr-8',
    'aria-disabled:pointer-events-none',
    'aria-disabled:opacity-50',
    'data-[active=true]:bg-sidebar-accent',
    'data-[active=true]:font-medium',
    'data-[active=true]:text-sidebar-accent-foreground',
    'data-[state=open]:hover:bg-sidebar-accent',
    'data-[state=open]:hover:text-sidebar-accent-foreground',
    'group-data-[collapsible=icon]:!size-8',
    'group-data-[collapsible=icon]:!p-2',
    '[&>span:last-child]:truncate',
    '[&>svg]:size-4',
    '[&>svg]:shrink-0',
    'after:absolute',
    'after:-inset-2',
    'after:md:hidden',
    'peer-hover/menu-button:text-sidebar-accent-foreground',
    'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
    'peer-data-[size=sm]/menu-button:top-1',
    'peer-data-[size=default]/menu-button:top-1.5',
    'peer-data-[size=lg]/menu-button:top-2.5',
    'group-data-[collapsible=icon]:hidden',
    'group-focus-within/menu-item:opacity-100',
    'group-hover/menu-item:opacity-100',
    'data-[state=open]:opacity-100',
    'md:opacity-0',
    'peer-data-[size=sm]/menu-button:top-1',
    'peer-data-[size=default]/menu-button:top-1.5',
    'peer-data-[size=lg]/menu-button:top-2.5',
    'group-data-[collapsible=icon]:hidden',
    'peer-hover/menu-button:text-sidebar-accent-foreground',
    'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
    'peer-data-[size=sm]/menu-button:top-1',
    'peer-data-[size=default]/menu-button:top-1.5',
    'peer-data-[size=lg]/menu-button:top-2.5',
    'group-data-[collapsible=icon]:hidden',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          light: 'hsl(var(--primary-light))',
        },
        'accent-purple': {
          DEFAULT: 'hsl(var(--accent-purple))',
          foreground: 'hsl(var(--accent-purple-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'var(--gradient-card)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        card: 'var(--shadow-card)',
        hover: 'var(--shadow-hover)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'bounce-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
