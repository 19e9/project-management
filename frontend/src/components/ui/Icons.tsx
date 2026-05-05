import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

const base = (p: Props) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const IconGantt = (p: Props) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="10" height="3" rx="1.2" />
    <rect x="7" y="10.5" width="11" height="3" rx="1.2" />
    <rect x="5" y="16" width="14" height="3" rx="1.2" />
    <path d="M3 21h18" opacity=".3" />
  </svg>
);

export const IconRoute = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="5" cy="6" r="2" />
    <circle cx="19" cy="18" r="2" />
    <path d="M7 6h6a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H9a4 4 0 0 0-4 4" />
  </svg>
);

export const IconTree = (p: Props) => (
  <svg {...base(p)}>
    <rect x="9" y="3" width="6" height="3.5" rx="1" />
    <rect x="3" y="14" width="6" height="3.5" rx="1" />
    <rect x="15" y="14" width="6" height="3.5" rx="1" />
    <path d="M12 6.5v3M6 14V11h12v3" />
  </svg>
);

export const IconUsers = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.5 14.5c2.5.4 4.4 2 5 4.5" />
  </svg>
);

export const IconChart = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 15v-4M12 15V9M16 15v-7" />
  </svg>
);

export const IconShield = (p: Props) => (
  <svg {...base(p)}>
    <path d="M12 3l8 3v6c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V6l8-3z" />
    <path d="M9.5 12l2 2 3.5-3.5" />
  </svg>
);

export const IconArrowRight = (p: Props) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconCheck = (p: Props) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4 4L19 7" />
  </svg>
);

export const IconSpark = (p: Props) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);

export const IconEye = (p: Props) => (
  <svg {...base(p)}>
    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconEyeOff = (p: Props) => (
  <svg {...base(p)}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 9.5 7 9.5 7a18 18 0 0 1-3.4 4.3" />
    <path d="M6.4 7.6A18 18 0 0 0 2.5 12s3.5 7 9.5 7c1.5 0 2.8-.3 4-.8" />
    <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" />
  </svg>
);

export const IconGoogle = (p: Props) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...p}>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1S8.7 5.9 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
    />
    <path
      fill="#4285F4"
      d="M21.2 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.2 1.2-.9 2.2-2 3l3.2 2.5c1.9-1.7 2.5-4.3 2.5-7.8z"
    />
    <path
      fill="#FBBC05"
      d="M5.4 14.3a6 6 0 0 1 0-4.6L2.1 7.1a9.6 9.6 0 0 0 0 9.8l3.3-2.6z"
    />
    <path
      fill="#34A853"
      d="M12 21.6c2.6 0 4.7-.9 6.3-2.3l-3.2-2.5c-.9.6-2.1 1-3.1 1-2.6 0-4.8-1.7-5.6-4.1L2.1 16.9C3.8 20.1 7.6 21.6 12 21.6z"
    />
  </svg>
);

export const IconBolt = (p: Props) => (
  <svg {...base(p)}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

export const IconLayers = (p: Props) => (
  <svg {...base(p)}>
    <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
    <path d="M3 12l9 4.5L21 12" />
    <path d="M3 16.5L12 21l9-4.5" />
  </svg>
);

export const IconStar = (p: Props) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...p}>
    <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 16.9 5.8 20.2l1.6-6.7L2.2 8.9l6.9-.6L12 2z" />
  </svg>
);
