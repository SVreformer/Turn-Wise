import React from 'react';
import { Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

interface SvgContainerProps {
  size: number;
  viewBox?: string;
  xml: string;
  children: React.ReactNode;
}

const SvgContainer: React.FC<SvgContainerProps> = ({ size, viewBox = '0 0 24 24', xml, children }) => {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        {children}
      </svg>
    );
  }
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const SearchIcon: React.FC<IconProps> = ({ size = 20, color = '#64748B', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="${color}" stroke-width="${strokeWidth}"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} />
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const QrIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="${color}" stroke-width="${strokeWidth}"/><rect x="15" y="3" width="6" height="6" rx="1.5" stroke="${color}" stroke-width="${strokeWidth}"/><rect x="3" y="15" width="6" height="6" rx="1.5" stroke="${color}" stroke-width="${strokeWidth}"/><path d="M15 15H17V17H15V15Z" fill="${color}"/><path d="M19 15H21V19H19V15Z" fill="${color}"/><path d="M15 19H17V21H15V19Z" fill="${color}"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="15" y="3" width="6" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="3" y="15" width="6" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M15 15H17V17H15V15Z" fill={color} />
      <path d="M19 15H21V19H19V15Z" fill={color} />
      <path d="M15 19H17V21H15V19Z" fill={color} />
    </SvgContainer>
  );
};

export const MapPinIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 21C16 16.5 19 13.5 19 9.5C19 5.634 15.866 2.5 12 2.5C8.134 2.5 5 5.634 5 9.5C5 13.5 8 16.5 12 21Z" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" stroke="${color}" stroke-width="${strokeWidth}"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path
        d="M12 21C16 16.5 19 13.5 19 9.5C19 5.634 15.866 2.5 12 2.5C8.134 2.5 5 5.634 5 9.5C5 13.5 8 16.5 12 21Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    </SvgContainer>
  );
};

export const SwapIcon: React.FC<IconProps> = ({ size = 18, color = '#64748B', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M7 4V20M7 4L3 8M7 4L11 8" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 20V4M17 20L21 16M17 20L13 16" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M7 4V20M7 4L3 8M7 4L11 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 20V4M17 20L21 16M17 20L13 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const WalkIcon: React.FC<IconProps> = ({ size = 20, color = '#0F172A', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="13" cy="4" r="2" fill="${color}"/><path d="M8 21L11 15L9 11L13 8L15 12L17 10" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 15L14 21" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="13" cy="4" r="2" fill={color} />
      <path
        d="M8 21L11 15L9 11L13 8L15 12L17 10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11 15L14 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const WheelchairIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2" fill="${color}"/><path d="M7 11.5A5.5 5.5 0 1 0 12.5 17" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><path d="M12 6V13H17L19 18" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="12" cy="4" r="2" fill={color} />
      <path
        d="M7 11.5A5.5 5.5 0 1 0 12.5 17"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M12 6V13H17L19 18"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgContainer>
  );
};

export const SeniorIcon: React.FC<IconProps> = ({ size = 20, color = '#0F172A', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2" fill="${color}"/><path d="M10 8H13L15 15L12 21" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 11V21" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="12" cy="4" r="2" fill={color} />
      <path d="M10 8H13L15 15L12 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 11V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const FamilyIcon: React.FC<IconProps> = ({ size = 20, color = '#0F172A', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="5" r="2" fill="${color}"/><path d="M6 19V12C6 10.34 7.34 9 9 9C10.66 9 12 10.34 12 12V19" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><circle cx="16" cy="9" r="1.5" fill="${color}"/><path d="M14 20V15C14 13.9 14.9 13 16 13C17.1 13 18 13.9 18 15V20" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="9" cy="5" r="2" fill={color} />
      <path d="M6 19V12C6 10.34 7.34 9 9 9C10.66 9 12 10.34 12 12V19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="16" cy="9" r="1.5" fill={color} />
      <path d="M14 20V15C14 13.9 14.9 13 16 13C17.1 13 18 13.9 18 15V20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const AudioTactileIcon: React.FC<IconProps> = ({ size = 20, color = '#0F172A', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><path d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><path d="M18.5 5.5C20.5 7.5 21.5 9.5 21.5 12C21.5 14.5 20.5 16.5 18.5 18.5" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M18.5 5.5C20.5 7.5 21.5 9.5 21.5 12C21.5 14.5 20.5 16.5 18.5 18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const TrainIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="15" rx="3" stroke="${color}" stroke-width="${strokeWidth}"/><line x1="4" y1="10" x2="20" y2="10" stroke="${color}" stroke-width="${strokeWidth}"/><circle cx="8" cy="14" r="1.2" fill="${color}"/><circle cx="16" cy="14" r="1.2" fill="${color}"/><path d="M7 18L5 22M17 18L19 22" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <rect x="4" y="3" width="16" height="15" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="8" cy="14" r="1.2" fill={color} />
      <circle cx="16" cy="14" r="1.2" fill={color} />
      <path d="M7 18L5 22M17 18L19 22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const ElevatorIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="${color}" stroke-width="${strokeWidth}"/><polyline points="8 10 10 7 12 10" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="12 14 14 17 16 14" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <polyline points="8 10 10 7 12 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="12 14 14 17 16 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const RestroomIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="4" r="1.5" fill="${color}"/><path d="M6 8H10V14H6V8Z" stroke="${color}" stroke-width="${strokeWidth}"/><line x1="7" y1="14" x2="7" y2="20" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><line x1="9" y1="14" x2="9" y2="20" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><circle cx="16" cy="4" r="1.5" fill="${color}"/><path d="M14 8L16 13L18 8H14Z" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><line x1="16" y1="13" x2="16" y2="20" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="8" cy="4" r="1.5" fill={color} />
      <path d="M6 8H10V14H6V8Z" stroke={color} strokeWidth={strokeWidth} />
      <line x1="7" y1="14" x2="7" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="9" y1="14" x2="9" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="16" cy="4" r="1.5" fill={color} />
      <path d="M14 8L16 13L18 8H14Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <line x1="16" y1="13" x2="16" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const RampIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M3 19H21L21 9L3 19Z" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><path d="M7 11L12 6M12 6H8M12 6V10" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M3 19H21L21 9L3 19Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M7 11L12 6M12 6H8M12 6V10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const TicketIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="${color}" stroke-width="${strokeWidth}"/><path d="M3 12C4.5 12 5.5 11 5.5 10" stroke="${color}" stroke-width="${strokeWidth}"/><path d="M21 12C19.5 12 18.5 11 18.5 10" stroke="${color}" stroke-width="${strokeWidth}"/><line x1="9" y1="9" x2="15" y2="9" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><line x1="9" y1="15" x2="13" y2="15" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3 12C4.5 12 5.5 11 5.5 10" stroke={color} strokeWidth={strokeWidth} />
      <path d="M21 12C19.5 12 18.5 11 18.5 10" stroke={color} strokeWidth={strokeWidth} />
      <line x1="9" y1="9" x2="15" y2="9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="9" y1="15" x2="13" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const MetroIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="${strokeWidth}"/><path d="M8 8L12 16L16 8" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><line x1="6" y1="12" x2="18" y2="12" stroke="${color}" stroke-width="${strokeWidth}"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8 8L12 16L16 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth={strokeWidth} />
    </SvgContainer>
  );
};

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 18, color = '#FFFFFF', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><line x1="5" y1="12" x2="19" y2="12" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><polyline points="12 5 19 12 12 19" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const CheckIcon: React.FC<IconProps> = ({ size = 16, color = '#10B981', strokeWidth = 2.5 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const CloseIcon: React.FC<IconProps> = ({ size = 18, color = '#64748B', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const AlertIcon: React.FC<IconProps> = ({ size = 18, color = '#F59E0B', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="${color}"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={color} />
    </SvgContainer>
  );
};

export const CompassIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="${strokeWidth}"/><polyline points="14.83 9.17 13.41 14.59 8 16 9.41 10.59 14.83 9.17" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <polyline points="14.83 9.17 13.41 14.59 8 16 9.41 10.59 14.83 9.17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const LayersIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><polygon points="12 2 2 7 12 12 22 7 12 2" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><polyline points="2 17 12 22 22 17" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="2 12 12 17 22 12" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <polyline points="2 17 12 22 22 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="2 12 12 17 22 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const FullscreenIcon: React.FC<IconProps> = ({ size = 18, color = '#0F172A', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const VolumeIcon: React.FC<IconProps> = ({ size = 18, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><path d="M15.54 8.46a5 5 0 010 7.07" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M15.54 8.46a5 5 0 010 7.07" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </SvgContainer>
  );
};

export const ClockIcon: React.FC<IconProps> = ({ size = 16, color = '#64748B', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="${strokeWidth}"/><polyline points="12 6 12 12 16 14" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const DistanceIcon: React.FC<IconProps> = ({ size = 16, color = '#64748B', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M4 19L20 5M20 5H14M20 5V11" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M4 19L20 5M20 5H14M20 5V11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </SvgContainer>
  );
};

export const SparkleIcon: React.FC<IconProps> = ({ size = 18, color = '#2563EB', strokeWidth = 2 }) => {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/></svg>`;
  return (
    <SvgContainer size={size} xml={xml}>
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </SvgContainer>
  );
};
