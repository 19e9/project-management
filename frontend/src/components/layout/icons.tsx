import type { SVGProps } from 'react';

const make = (paths: React.ReactNode) =>
  function Icon(p: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...p}
      >
        {paths}
      </svg>
    );
  };

export const IDashboard = make(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
);
export const IFolder = make(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />);
export const ICheck = make(<path d="M5 12.5l4 4L19 7" />);
export const IUsers = make(
  <>
    <circle cx="9" cy="7" r="3.5" />
    <path d="M2.5 19c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16 14c2.7.4 4.6 2.1 5 5" />
  </>,
);
export const IActivity = make(<path d="M3 12h4l3-7 4 14 3-7h4" />);
export const IBox = make(
  <>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
  </>,
);
export const ICreditCard = make(
  <>
    <rect x="2" y="6" width="20" height="13" rx="2" />
    <path d="M2 11h20M6 16h4" />
  </>,
);
export const ICog = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c0 .7.4 1.3 1 1.5h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>,
);
export const IBell = make(
  <>
    <path d="M6 8a6 6 0 1 1 12 0v5l1.5 3h-15L6 13V8z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </>,
);
export const ISearch = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M16 16l4 4" />
  </>,
);
export const ISun = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
  </>,
);
export const IMoon = make(<path d="M21 12.8A9 9 0 0 1 11.2 3a7.5 7.5 0 1 0 9.8 9.8z" />);
export const IGlobe = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </>,
);
export const ILayers = make(
  <>
    <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
    <path d="M3 12l9 4.5L21 12" />
    <path d="M3 16.5L12 21l9-4.5" />
  </>,
);
export const IInsights = make(<path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />);
export const IPlus = make(<path d="M12 5v14M5 12h14" />);
export const IChevronDown = make(<path d="M6 9l6 6 6-6" />);
export const IChevronRight = make(<path d="M9 6l6 6-6 6" />);
export const ILogOut = make(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </>,
);
export const IMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IClose = make(<path d="M6 6l12 12M18 6L6 18" />);
export const IInbox = make(
  <>
    <path d="M3 12l3-7h12l3 7" />
    <path d="M3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-6l-2 2h-4l-2-2H3z" />
  </>,
);
