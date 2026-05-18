// ============================================================================
// BASE ICON SYSTEM (Reusable)
// ============================================================================

const IconBase = ({ size = 20, viewBox = "0 0 24 24", fill = "none", children }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill}>
    {children}
  </svg>
);

const Stroke = ({ color = "#7C3AED", strokeWidth = 2, children }) => (
  <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </g>
);

// ============================================================================
// NAVIGATION ICONS
// ============================================================================

export const IconDashboard = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
    </Stroke>
  </IconBase>
);

export const IconMenu = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </Stroke>
  </IconBase>
);

export const IconClose = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </Stroke>
  </IconBase>
);

export const IconOrders = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <path d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10" />
      <path d="M9 7h6M9 11h6M9 15h4" />
      <circle cx="18" cy="7" r="3" />
    </Stroke>
  </IconBase>
);

export const IconPlus = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <path d="M12 5v14M5 12h14" />
    </Stroke>
  </IconBase>
);

export const IconCustomers = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <circle cx="9" cy="7" r="3" />
      <circle cx="16" cy="7" r="3" />
      <path d="M6 11a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
      <path d="M14 11a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
      <path d="M6 18h12" />
    </Stroke>
  </IconBase>
);

export const IconUsers = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <circle cx="12" cy="7" r="3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
      <circle cx="19" cy="8" r="2.5" />
      <path d="M23 20.5c0-2-1-3.5-2-5" />
    </Stroke>
  </IconBase>
);

export const IconLogout = ({ color = "#e10618", ...props }) => (
  <IconBase {...props}>
    <Stroke color={color} {...props}>
      <path d="M9 6H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
      <path d="M16 12H9m7 0-2-2m2 2-2 2" />
    </Stroke>
  </IconBase>
);

export const IconProfile = (props) => (
    <IconBase {...props}>
        <Stroke {...props}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </Stroke>
    </IconBase>
);

export const IconProducts = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </Stroke>
  </IconBase>
);

// ============================================================================
// NOTIFICATION ICONS
// ============================================================================

export const IconBell = ({ filled = false, color = "#2D1F6E", ...props }) => (
  <IconBase fill={filled ? color : "none"} {...props}>
    <Stroke color={color} {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z" />
      <path d="M10.27 21a2 2 0 0 0 3.46 0" />
    </Stroke>
  </IconBase>
);

export const IconPackage = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <path d="M12 2L3 7v5c0 5 4 9 9 10 5-1 9-5 9-10V7z" />
      <path d="M10 14.5l2 2 4-4" />
    </Stroke>
  </IconBase>
);

export const IconCheckCircle = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </Stroke>
  </IconBase>
);

export const IconEmpty = (props) => (
  <IconBase {...props}>
    <Stroke {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z" opacity="0.5" />
      <path d="M10.27 21a2 2 0 0 0 3.46 0" opacity="0.5" />
    </Stroke>
  </IconBase>
);

// ============================================================================
// WORKFLOW ICONS
// ============================================================================

export const IconWorkflowPending = ({ size = 16, color = "#F59E0B" }) => (
  <IconBase size={size} fill={color}>
    <circle cx="12" cy="12" r="10" />
  </IconBase>
);

export const IconWorkflowProcessing = ({ size = 16, color = "#6C47FF" }) => (
  <IconBase size={size}>
    <g stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6" />
    </g>
  </IconBase>
);

export const IconWorkflowShipped = ({ size = 16, color = "#9B6DFF" }) => (
  <IconBase size={size}>
    <Stroke color={color}>
      <path d="M3 12l6 6 12-12" />
    </Stroke>
  </IconBase>
);

export const IconWorkflowCompleted = ({ size = 16, color = "#10B981" }) => (
  <IconBase size={size}>
    <Stroke color={color}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </Stroke>
  </IconBase>
);

// ============================================================================
// STAT ICONS (48px)
// ============================================================================

export const IconStatOrders = ({ color = "#F59E0B", size = 48 }) => (
  <IconBase size={size} viewBox="0 0 48 48">
    <g stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="14" cy="40" r="2.5" />
      <circle cx="34" cy="40" r="2.5" />
      <path d="M8 10h32l-2 25a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2z" />
      <path d="M12 10l-2-4M36 10l2-4" />
      <path d="M16 18h16M14 24h20" opacity="0.5" />
    </g>
  </IconBase>
);

export const IconStatRevenue = ({ color = "#10B981", size = 48 }) => (
  <IconBase size={size} viewBox="0 0 48 48">
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="24" cy="24" r="20" />
      <path d="M19 34V14h7a6 6 0 0 1 0 12h-7" />
      <line x1="16" y1="18" x2="35" y2="18" />
      <line x1="16" y1="22" x2="35" y2="22" />
    </g>
  </IconBase>
);

export const IconStatCompleted = ({ color = "#10B981", size = 48 }) => (
  <IconBase size={size} viewBox="0 0 48 48">
    <g stroke={color} strokeWidth="2">
      <circle cx="24" cy="24" r="20" />
      <path d="M16 24l6 6 10-12" />
    </g>
  </IconBase>
);

export const IconStatProgress = ({ color = "#9B6DFF", size = 48 }) => (
  <IconBase size={size} viewBox="0 0 48 48">
    <g stroke={color} strokeWidth="2">
      <path d="M12 8h24v8c0 4-4 6-12 6s-12-2-12-6z" />
      <path d="M12 26c0-4 4-6 12-6s12 2 12 6v14H12z" />
      <line x1="24" y1="22" x2="24" y2="26" />
    </g>
    <g fill={color} opacity="0.6">
      <circle cx="20" cy="28" r="1.5" />
      <circle cx="24" cy="30" r="1.5" />
      <circle cx="28" cy="32" r="1.5" />
    </g>
  </IconBase>
);

// ============================================================================
// BRAND LOGO
// ============================================================================

export const LogoBrand = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C4A8FF" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#g)" opacity="0.1" />
    <g stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round">
      <path d="M8 18l12-8 12 8" />
      <path d="M8 18v12a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V18" />
      <line x1="20" y1="10" x2="20" y2="32" strokeDasharray="2,2" opacity="0.4" />
      <path d="M24 26l2 2 4-4" />
    </g>
  </svg>
);