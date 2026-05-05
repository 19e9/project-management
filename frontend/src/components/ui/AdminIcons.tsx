import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);
export const IconWorkspaces = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="8" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
    <rect x="13" y="13" width="8" height="8" rx="2" />
  </svg>
);
export const IconUserGroup = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.5 14.5c2.5.4 4.4 2 5 4.5" />
  </svg>
);
export const IconClipboard = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4h6v3H9z" />
    <path d="M9 11h6M9 15h4" />
  </svg>
);
export const IconBolt = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 8a6 6 0 0 1 12 0c0 6 3 7 3 7H3s3-1 3-7" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M16 16l5 5" />
  </svg>
);
export const IconLogOut = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H10" />
  </svg>
);
export const IconArrowUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);
export const IconArrowDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14" />
    <path d="M5 12l7 7 7-7" />
  </svg>
);
export const IconWarning = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v5" />
    <path d="M12 18.5h.01" />
  </svg>
);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconFlame = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3c1 4-3 5-3 9a3 3 0 0 0 6 0c0-2 2-3 2-5 0 5 3 6 3 10a8 8 0 0 1-16 0c0-5 4-7 8-14z" />
  </svg>
);
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
