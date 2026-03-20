export const IconDashboard = ({ color = '#7C3AED', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="8" height="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13" y="3" width="8" height="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="13" width="8" height="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13" y="13" width="8" height="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconOrders = ({ color = '#7C3AED', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 7H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 11H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 15H13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} />
  </svg>
)

export const IconPlus = ({ color = '#7C3AED', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12H19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconCustomers = ({ color = '#7C3AED', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 11C6 9.89543 6.89543 9 8 9H10C11.1046 9 12 9.89543 12 11V15C12 15.5523 11.5523 16 11 16H7C6.44772 16 6 15.5523 6 15V11Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11C14 9.89543 14.8954 9 16 9H18C19.1046 9 20 9.89543 20 11V15C20 15.5523 19.5523 16 19 16H15C14.4477 16 14 15.5523 14 15V11Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 18H18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconUsers = ({ color = '#7C3AED', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="19" cy="8" r="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 20.5C23 18.567 22.224 16.823 20.99 15.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconLogout = ({ color = '#e10618', size = 18, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6H7C5.89543 6 5 6.89543 5 8V18C5 19.1046 5.89543 20 7 20H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 12H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 12L14 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 12L14 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconBell = ({ color = '#2D1F6E', size = 20, strokeWidth = 2, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9989 12 21.9989C11.6496 21.9989 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Workflow status dots with icons
export const IconWorkflowPending = ({ color = '#F59E0B', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill={color} />
  </svg>
)

export const IconWorkflowProcessing = ({ color = '#6C47FF', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
  </svg>
)

export const IconWorkflowShipped = ({ color = '#9B6DFF', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12L9 18L21 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconWorkflowCompleted = ({ color = '#10B981', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Notification-specific icons
export const IconPackage = ({ color = '#7C3AED', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 14.5L12 16.5L16 12.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconCheckCircle = ({ color = '#10B981', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <path d="M9 12L11 14L15 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconEmpty = ({ color = '#C4B8E8', size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9989 12 21.9989C11.6496 21.9989 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
  </svg>
)

// ============================================================================
// ENHANCED STAT CARD ICONS - Professional sizing and consistent design
// ============================================================================

export const IconStatOrders = ({ color = '#F59E0B', size = 48, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cart wheel - left */}
    <circle cx="14" cy="40" r="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Cart wheel - right */}
    <circle cx="34" cy="40" r="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Cart body */}
    <path 
      d="M8 10L10 35C10 36.1046 10.8954 37 12 37H36C37.1046 37 38 36.1046 38 35L40 10Z" 
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" 
    />
    
    {/* Cart top rim */}
    <line x1="8" y1="10" x2="40" y2="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Left handle */}
    <path 
      d="M12 10L10 6C9.44772 6 9 6.44772 9 7" 
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" 
    />
    
    {/* Right handle */}
    <path 
      d="M36 10L38 6C38.5523 6 39 6.44772 39 7" 
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" 
    />
    
    {/* Items inside cart indicator */}
    <line x1="16" y1="18" x2="32" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.5" />
    <line x1="14" y1="24" x2="34" y2="24" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.5" />
  </svg>
)

export const IconStatRevenue = ({ color = '#10B981', size = 48, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Circular border */}
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Peso symbol - vertical line */}
    <line x1="24" y1="12" x2="24" y2="36" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Top horizontal bar */}
    <line x1="16" y1="16" x2="32" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Middle horizontal bar */}
    <line x1="16" y1="24" x2="32" y2="24" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Decorative curved top */}
    <path 
      d="M16 14C16 14 18 10 22 10C25 10 27 12 27 15" 
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" 
      opacity="0.7" 
    />
  </svg>
)

export const IconStatCompleted = ({ color = '#10B981', size = 48, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Circle background */}
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Checkmark */}
    <path 
      d="M16 24L22 30L32 18" 
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" 
    />
  </svg>
)

export const IconStatProgress = ({ color = '#9B6DFF', size = 48, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hourglass top section */}
    <path 
      d="M12 8H36V16C36 20 32 22 24 22C16 22 12 20 12 16V8Z" 
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" 
    />
    
    {/* Hourglass bottom section */}
    <path 
      d="M12 26C12 22 16 20 24 20C32 20 36 22 36 26V40H12V26Z" 
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" 
    />
    
    {/* Sand falling indicator */}
    <line x1="24" y1="22" x2="24" y2="26" stroke={color} strokeWidth={strokeWidth * 1.25} strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Sand dots */}
    <circle cx="20" cy="28" r="1.5" fill={color} opacity="0.6" />
    <circle cx="24" cy="30" r="1.5" fill={color} opacity="0.6" />
    <circle cx="28" cy="32" r="1.5" fill={color} opacity="0.6" />
  </svg>
)

// Brand Logo - Enhanced SVG version
export const LogoBrand = ({ size = 36, gradient = true }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {gradient && (
        <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#C4A8FF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
        </linearGradient>
      )}
    </defs>
    
    {/* Outer circle */}
    <circle cx="20" cy="20" r="18" fill={gradient ? 'url(#brandGradient)' : '#7C3AED'} opacity="0.1" />
    
    {/* Main shape - stylized box/order */}
    <g>
      {/* Top package fold */}
      <path 
        d="M8 18L20 10L32 18" 
        stroke={gradient ? 'url(#brandGradient)' : '#7C3AED'} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Left side */}
      <path 
        d="M8 18V30C8 31.1046 8.89543 32 10 32H30C31.1046 32 32 31.1046 32 30V18" 
        stroke={gradient ? 'url(#brandGradient)' : '#7C3AED'} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Center divider */}
      <line 
        x1="20" 
        y1="10" 
        x2="20" 
        y2="32" 
        stroke={gradient ? 'url(#brandGradient)' : '#7C3AED'} 
        strokeWidth="2.5" 
        strokeOpacity="0.4"
        strokeDasharray="2,2"
      />
      
      {/* Checkmark on right half */}
      <path 
        d="M24 26L26 28L30 24" 
        stroke={gradient ? 'url(#brandGradient)' : '#7C3AED'} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </g>
  </svg>
)