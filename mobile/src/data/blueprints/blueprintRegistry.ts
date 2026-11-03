import { Coordinates } from '../../services/localRouter';
import { KSR_STATION_SVG_STRING } from '../station/ksrStationSvg';
import ksrPlatforms from '../station/platforms.json';
import ksrFacilities from '../station/facilities.json';

export interface StationBlueprintData {
  svgString: string;
  stationCode: string;
  stationName: string;
  totalPlatforms: number;
  platforms: Array<{
    id: string;
    number: number;
    name: string;
    level: number;
    center: Coordinates;
    badgeLeft: Coordinates;
    badgeRight: Coordinates;
    lengthMeters?: number;
    stepFree?: boolean;
    hasLift?: boolean;
    hasEscalator?: boolean;
  }>;
  facilities: Array<{
    id: string;
    name: string;
    type: string;
    coordinates: Coordinates;
    level: number;
    nearestNode: string;
  }>;
  viewBox: string;
}

const MAP_WIDTH = 3456;
const MAP_HEIGHT = 1728;

// Bilingual station name mapping across all major Indian cities & zones
export const STATION_BILINGUAL_MAP: Record<
  string,
  { regional: string; english: string; zone: string }
> = {
  SBC: {
    regional: 'ಕ್ರಾಂತಿವೀರ ಸಂಗೊಳ್ಳಿ ರಾಯಣ್ಣ (ಬೆಂಗಳೂರು ರೈಲು ನಿಲ್ದಾಣ)',
    english: 'KRANTIVIRA SANGOLLI RAYANNA (BENGALURU CITY)',
    zone: 'SOUTH WESTERN RAILWAY • BENGALURU DIVISION'
  },
  MYS: {
    regional: 'ಮೈಸೂರು ಜಂಕ್ಷನ್ (ಮೈಸೂರು ನಗರ ರೈಲು ನಿಲ್ದಾಣ)',
    english: 'MYSURU JUNCTION (MYSORE CITY STATION)',
    zone: 'SOUTH WESTERN RAILWAY • MYSURU DIVISION'
  },
  AP: {
    regional: 'ಅಶೋಕಪುರಂ ರೈಲು ನಿಲ್ದಾಣ (ಮೈಸೂರು ಟರ್ಮಿನಲ್)',
    english: 'ASHOKAPURAM RAILWAY STATION (MYSURU)',
    zone: 'SOUTH WESTERN RAILWAY • MYSURU DIVISION'
  },
  YPR: {
    regional: 'ಯಶವಂತಪುರ ಜಂಕ್ಷನ್ (ಬೆಂಗಳೂರು)',
    english: 'YESVANTPUR JUNCTION (BENGALURU)',
    zone: 'SOUTH WESTERN RAILWAY • BENGALURU DIVISION'
  },
  SMVB: {
    regional: 'ಸರ್ ಎಂ. ವಿಶ್ವೇಶ್ವರಯ್ಯ ಟರ್ಮಿನಲ್ (ಬೆಂಗಳೂರು)',
    english: 'SIR M. VISVESVARAYA TERMINAL (SMVT BENGALURU)',
    zone: 'SOUTH WESTERN RAILWAY • BENGALURU DIVISION'
  },
  BNC: {
    regional: 'ಬೆಂಗಳೂರು ಕಂಟೋನ್ಮೆಂಟ್ ರೈಲು ನಿಲ್ದಾಣ',
    english: 'BENGALURU CANTT (CANTONMENT)',
    zone: 'SOUTH WESTERN RAILWAY • BENGALURU DIVISION'
  },
  CSMT: {
    regional: 'छत्रपती शिवाजी महाराज टर्मिनस (मुंबई)',
    english: 'CHHATRAPATI SHIVAJI MAHARAJ TERMINUS (CSMT MUMBAI)',
    zone: 'CENTRAL RAILWAY • MUMBAI DIVISION'
  },
  DR: {
    regional: 'दादर जंक्शन रेल्वे स्थानक (मुंबई)',
    english: 'DADAR JUNCTION (MUMBAI)',
    zone: 'CENTRAL & WESTERN RAILWAY • MUMBAI DIVISION'
  },
  NDLS: {
    regional: 'नई दिल्ली रेलवे स्टेशन (उत्तर रेलवे)',
    english: 'NEW DELHI RAILWAY STATION (NDLS)',
    zone: 'NORTHERN RAILWAY • DELHI DIVISION'
  },
  DLI: {
    regional: 'पुरानी दिल्ली जंक्शन (चांदनी चौक)',
    english: 'OLD DELHI JUNCTION (DLI)',
    zone: 'NORTHERN RAILWAY • DELHI DIVISION'
  },
  MAS: {
    regional: 'புரட்சித் தலைவர் டாக்டர் எம்.ஜி.ஆர் சென்னை சென்ட்ரல்',
    english: 'PURATCHI THALAIVAR DR. MGR CHENNAI CENTRAL (MAS)',
    zone: 'SOUTHERN RAILWAY • CHENNAI DIVISION'
  },
  MS: {
    regional: 'சென்னை எழும்பூர் ரயில் நிலையம்',
    english: 'CHENNAI EGMORE (MS)',
    zone: 'SOUTHERN RAILWAY • CHENNAI DIVISION'
  },
  HWH: {
    regional: 'হাওড়া জংশন রেলওয়ে স্টেশন (কলকাতা)',
    english: 'HOWRAH JUNCTION (HWH KOLKATA)',
    zone: 'EASTERN & SOUTH EASTERN RAILWAY • HOWRAH DIVISION'
  },
  SDAH: {
    regional: 'শিয়ালদহ রেলওয়ে স্টেশন (কলকাতা)',
    english: 'SEALDAH RAILWAY STATION (SDAH KOLKATA)',
    zone: 'EASTERN RAILWAY • SEALDAH DIVISION'
  },
  SC: {
    regional: 'సికింద్రాబాద్ జంక్షన్ రైల్వే స్టేషన్ (హైదరాబాద్)',
    english: 'SECUNDERABAD JUNCTION (SC HYDERABAD)',
    zone: 'SOUTH CENTRAL RAILWAY • SECUNDERABAD DIVISION'
  },
  PUNE: {
    regional: 'पुणे जंक्शन रेल्वे स्थानक',
    english: 'PUNE JUNCTION (PUNE CITY)',
    zone: 'CENTRAL RAILWAY • PUNE DIVISION'
  },
  ADI: {
    regional: 'અમદાવાદ જંકશન રેલવે સ્ટેશન (કાલુપુર)',
    english: 'AHMEDABAD JUNCTION (KALUPUR)',
    zone: 'WESTERN RAILWAY • AHMEDABAD DIVISION'
  },
  JP: {
    regional: 'जयपुर जंक्शन रेलवे स्टेशन (गुलाबी नगरी)',
    english: 'JAIPUR JUNCTION (JP PINK CITY)',
    zone: 'NORTH WESTERN RAILWAY • JAIPUR DIVISION'
  },
  LKO: {
    regional: 'लखनऊ चारबाग़ रेलवे स्टेशन',
    english: 'LUCKNOW CHARBAGH (LKO)',
    zone: 'NORTHERN RAILWAY • LUCKNOW DIVISION'
  },
  ERS: {
    regional: 'എറണാകുളം ജംഗ്ഷൻ റെയിൽവേ സ്റ്റേഷൻ (സൗത്ത്)',
    english: 'ERNAKULAM JUNCTION (SOUTH ERS)',
    zone: 'SOUTHERN RAILWAY • THIRUVANANTHAPURAM DIVISION'
  },
  PNBE: {
    regional: 'पटना जंक्शन रेलवे स्टेशन',
    english: 'PATNA JUNCTION (PNBE BIHAR)',
    zone: 'EAST CENTRAL RAILWAY • DANAPUR DIVISION'
  }
};

/**
 * Procedural Architectural Blueprint CAD Engine
 * Produces photorealistic architectural CAD maps visually matching the KSR Bengaluru blueprint:
 * - Warm concrete base (#E1D2CD) with pavement accents
 * - Dark asphalt access roads (#374151) with white center dashes & zebra crosswalks
 * - Railway track beds with real sleeper ties (#57534E), dual continuous steel rails & turnout switches
 * - Deep navy/indigo platforms (#002360) with bright yellow safety tactile borders (#FFEC00)
 * - Numbered platform circle badges on left & right with bold text
 * - Elevated Foot Over Bridges (FOBs) with stairs, bright yellow escalators, and glass lifts
 * - Concourse buildings with labeled rooms (PRS, UTS, Help Desk, VIP Lounge, Food Court, Restrooms, RPF)
 * - Pink pill badges (TERMINAL-1, TERMINAL-2, ENTRY-1, ENTRY-2)
 * - Yellow parking bays (Taxi, Auto, Two-Wheeler)
 * - Bilingual station header signboard in top-right with regional script + English
 */
export function createArchitecturalStationSvg(
  code: string,
  name: string,
  platformCount: number,
  zone?: string,
  division?: string,
  options?: {
    entry1Name?: string;
    entry2Name?: string;
    roadBottom?: string;
    roadTop?: string;
  }
): string {
  const platCount = Math.max(2, Math.min(24, platformCount || 6));
  const isDualSided = platCount >= 6 || Boolean(options?.entry2Name);

  const bilingual = STATION_BILINGUAL_MAP[code] || {
    regional: `${name} ನಿಲ್ದಾಣ / रेलवे स्टेशन`,
    english: `${name.toUpperCase()} (${code})`,
    zone: `${zone || 'INDIAN RAILWAYS'} • ${division || 'DIVISION'}`
  };

  const road1Name =
    options?.roadBottom ||
    (code === 'MYS'
      ? 'JLB ROAD (JHANSI LAKSHMI BAI ROAD)'
      : `${name.split(' ')[0].toUpperCase()} STATION ROAD`);

  const road2Name =
    options?.roadTop ||
    (code === 'MYS' ? 'YADAVAGIRI ROAD / KRS ROAD' : 'SECOND ENTRY STATION ROAD');

  // Platform layout bounds
  const platformXStart = 420;
  const platformXEnd = 2980;
  const platformWidth = platformXEnd - platformXStart;

  // Vertical distribution of platforms
  const platformStartY = isDualSided ? 260 : 200;
  const platformEndY = isDualSided ? 1040 : 1100;
  const totalPlatformHeight = platformEndY - platformStartY;
  const platformPitch = totalPlatformHeight / (platCount - 1 || 1);
  const platformHeight = Math.min(48, Math.max(28, platformPitch * 0.46));

  // Platform Y-positions
  const platformPositions: Array<{ number: number; yCenter: number }> = [];
  for (let i = platCount; i >= 1; i--) {
    const idxFromTop = platCount - i;
    const yCenter = platformStartY + idxFromTop * platformPitch;
    platformPositions.push({ number: i, yCenter });
  }
  platformPositions.sort((a, b) => a.number - b.number);

  // Generate tracks & sleepers
  let tracksSvg = '';
  for (let i = 0; i < platformPositions.length; i++) {
    const currentP = platformPositions[i];
    const trackY = currentP.yCenter + platformHeight / 2 + 16;

    tracksSvg += `
      <g id="TrackBed_PF_${currentP.number}">
        <rect x="360" y="${trackY - 10}" width="2700" height="20" fill="#9CA3AF" opacity="0.65" rx="3" />
        <line x1="360" y1="${trackY - 5}" x2="3060" y2="${trackY - 5}" stroke="#78716C" stroke-width="2.5" />
        <line x1="360" y1="${trackY + 5}" x2="3060" y2="${trackY + 5}" stroke="#78716C" stroke-width="2.5" />
    `;

    for (let sx = 380; sx <= 3040; sx += 16) {
      tracksSvg += `<rect x="${sx}" y="${trackY - 9}" width="3.5" height="18" fill="#57534E" opacity="0.85" />`;
    }

    if (i % 2 === 0 && i < platformPositions.length - 1) {
      const nextTrackY = platformPositions[i + 1].yCenter + platformHeight / 2 + 16;
      tracksSvg += `
        <line x1="420" y1="${trackY}" x2="520" y2="${nextTrackY}" stroke="#78716C" stroke-width="2.5" stroke-dasharray="4,2" />
        <line x1="2880" y1="${trackY}" x2="2980" y2="${nextTrackY}" stroke="#78716C" stroke-width="2.5" stroke-dasharray="4,2" />
      `;
    }

    tracksSvg += `</g>`;
  }

  // Generate platforms
  let platformsSvg = '';
  platformPositions.forEach((p) => {
    const pY = p.yCenter - platformHeight / 2;
    const isBottomPlatform = p.number === 1;

    platformsSvg += `
      <g id="Platform_${p.number}">
        <rect x="${platformXStart}" y="${pY}" width="${platformWidth}" height="${platformHeight}" rx="5" fill="#002360" stroke="#001845" stroke-width="2" />
        <rect x="${platformXStart}" y="${pY}" width="${platformWidth}" height="4.5" fill="#FFEC00" />
        ${!isBottomPlatform ? `<rect x="${platformXStart}" y="${pY + platformHeight - 4.5}" width="${platformWidth}" height="4.5" fill="#FFEC00" />` : ''}

        <!-- Left Circular Platform Badge -->
        <circle cx="${platformXStart + 120}" cy="${p.yCenter}" r="19" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.5" />
        <text x="${platformXStart + 120}" y="${p.yCenter + 7}" fill="#FFFFFF" font-size="19" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">${p.number}</text>
        <text x="${platformXStart + 152}" y="${p.yCenter + 5}" fill="#FFFFFF" font-size="14" font-weight="900" font-family="Arial, sans-serif" letter-spacing="1">PLATFORM</text>

        <!-- Middle Platform Indicator -->
        <rect x="1620" y="${p.yCenter - 13}" width="160" height="26" rx="4" fill="#0284C7" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="1700" y="${p.yCenter + 5}" fill="#FFFFFF" font-size="13" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">PLATFORM ${p.number}</text>

        <!-- Right Circular Platform Badge -->
        <circle cx="${platformXEnd - 120}" cy="${p.yCenter}" r="19" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.5" />
        <text x="${platformXEnd - 120}" y="${p.yCenter + 7}" fill="#FFFFFF" font-size="19" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">${p.number}</text>
        <text x="${platformXEnd - 152}" y="${p.yCenter + 5}" fill="#FFFFFF" font-size="14" font-weight="900" font-family="Arial, sans-serif" text-anchor="end" letter-spacing="1">PLATFORM</text>

        <!-- Waiting Benches -->
        <rect x="${platformXStart + 420}" y="${p.yCenter - 7}" width="40" height="14" rx="2" fill="#DBAC4D" />
        <rect x="${platformXStart + 780}" y="${p.yCenter - 7}" width="40" height="14" rx="2" fill="#DBAC4D" />
        <rect x="${platformXEnd - 460}" y="${p.yCenter - 7}" width="40" height="14" rx="2" fill="#DBAC4D" />
        <rect x="${platformXEnd - 820}" y="${p.yCenter - 7}" width="40" height="14" rx="2" fill="#DBAC4D" />

        <!-- Water Cooler / Tap Markers -->
        <circle cx="${platformXStart + 600}" cy="${p.yCenter}" r="8" fill="#92FAFF" stroke="#0284C7" stroke-width="1.5" />
        <text x="${platformXStart + 600}" y="${p.yCenter + 4}" font-size="10" text-anchor="middle" fill="#002360" font-weight="bold">🚰</text>

        <circle cx="${platformXEnd - 640}" cy="${p.yCenter}" r="8" fill="#92FAFF" stroke="#0284C7" stroke-width="1.5" />
        <text x="${platformXEnd - 640}" y="${p.yCenter + 4}" font-size="10" text-anchor="middle" fill="#002360" font-weight="bold">🚰</text>
      </g>
    `;
  });

  // FOBs Layer
  const fobTopY = platformPositions[platformPositions.length - 1].yCenter - 30;
  const fobBottomY = platformPositions[0].yCenter + 40;
  const fobHeight = fobBottomY - fobTopY;

  const fobsSvg = `
    <g id="FootOverBridges">
      <!-- FOB 1 (North/West FOB) -->
      <g id="FOB_1">
        <rect x="1100" y="${fobTopY}" width="84" height="${fobHeight}" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="3" />
        <rect x="1110" y="${fobTopY + 8}" width="64" height="${fobHeight - 16}" fill="#0F172A" />

        <rect x="1102" y="${fobTopY + 40}" width="80" height="26" rx="4" fill="#FEC60A" stroke="#000000" stroke-width="1" />
        <text x="1142" y="${fobTopY + 58}" fill="#000000" font-size="12" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">⚡ ESCALATOR</text>

        <rect x="1102" y="${fobBottomY - 60}" width="80" height="26" rx="4" fill="#FEC60A" stroke="#000000" stroke-width="1" />
        <text x="1142" y="${fobBottomY - 42}" fill="#000000" font-size="12" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">⚡ ESCALATOR</text>

        <rect x="1050" y="${(fobTopY + fobBottomY) / 2 - 25}" width="46" height="50" rx="6" fill="#0284C7" stroke="#38BDF8" stroke-width="2" />
        <text x="1073" y="${(fobTopY + fobBottomY) / 2 + 6}" font-size="24" text-anchor="middle" fill="#FFFFFF">🛗</text>
        <text x="1073" y="${(fobTopY + fobBottomY) / 2 + 20}" font-size="9" font-weight="900" text-anchor="middle" fill="#FFFFFF">LIFT</text>

        <text x="1142" y="${fobTopY - 12}" fill="#38BDF8" font-size="13" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">
          FOOT OVER BRIDGE 1 (LIFTS &amp; ESCALATORS)
        </text>
      </g>

      <!-- FOB 2 (South/East FOB) -->
      <g id="FOB_2">
        <rect x="2280" y="${fobTopY}" width="84" height="${fobHeight}" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="3" />
        <rect x="2290" y="${fobTopY + 8}" width="64" height="${fobHeight - 16}" fill="#0F172A" />

        <rect x="2282" y="${fobTopY + 40}" width="80" height="26" rx="4" fill="#FEC60A" stroke="#000000" stroke-width="1" />
        <text x="2322" y="${fobTopY + 58}" fill="#000000" font-size="12" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">⚡ ESCALATOR</text>

        <rect x="2282" y="${fobBottomY - 60}" width="80" height="26" rx="4" fill="#FEC60A" stroke="#000000" stroke-width="1" />
        <text x="2322" y="${fobBottomY - 42}" fill="#000000" font-size="12" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">⚡ ESCALATOR</text>

        <rect x="2370" y="${(fobTopY + fobBottomY) / 2 - 25}" width="46" height="50" rx="6" fill="#0284C7" stroke="#38BDF8" stroke-width="2" />
        <text x="2393" y="${(fobTopY + fobBottomY) / 2 + 6}" font-size="24" text-anchor="middle" fill="#FFFFFF">🛗</text>
        <text x="2393" y="${(fobTopY + fobBottomY) / 2 + 20}" font-size="9" font-weight="900" text-anchor="middle" fill="#FFFFFF">LIFT</text>

        <text x="2322" y="${fobTopY - 12}" fill="#38BDF8" font-size="13" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">
          FOOT OVER BRIDGE 2 (MAIN CONCOURSE CONNECTOR)
        </text>
      </g>
    </g>
  `;

  // Concourse & Terminals (Bottom & Top)
  const bottomConcourseY = platformPositions[0].yCenter + 55;
  const bottomConcourseHeight = 1560 - bottomConcourseY;

  const concoursesSvg = `
    <!-- MAIN CONCOURSE & TERMINAL 1 (BOTTOM) -->
    <g id="MainConcourse_Bottom">
      <rect x="420" y="${bottomConcourseY}" width="2560" height="${bottomConcourseHeight - 30}" rx="12" fill="#002360" stroke="#001845" stroke-width="3" />
      <rect x="435" y="${bottomConcourseY + 12}" width="2530" height="${bottomConcourseHeight - 54}" rx="8" fill="#071E4A" />

      <!-- Room Divider Grid Lines -->
      <line x1="820" y1="${bottomConcourseY + 12}" x2="820" y2="${bottomConcourseY + bottomConcourseHeight - 42}" stroke="#1E3A8A" stroke-width="2" stroke-dasharray="4,4" />
      <line x1="1240" y1="${bottomConcourseY + 12}" x2="1240" y2="${bottomConcourseY + bottomConcourseHeight - 42}" stroke="#1E3A8A" stroke-width="2" stroke-dasharray="4,4" />
      <line x1="1720" y1="${bottomConcourseY + 12}" x2="1720" y2="${bottomConcourseY + bottomConcourseHeight - 42}" stroke="#1E3A8A" stroke-width="2" stroke-dasharray="4,4" />
      <line x1="2180" y1="${bottomConcourseY + 12}" x2="2180" y2="${bottomConcourseY + bottomConcourseHeight - 42}" stroke="#1E3A8A" stroke-width="2" stroke-dasharray="4,4" />
      <line x1="2560" y1="${bottomConcourseY + 12}" x2="2560" y2="${bottomConcourseY + bottomConcourseHeight - 42}" stroke="#1E3A8A" stroke-width="2" stroke-dasharray="4,4" />

      <!-- 1. Ticketing / PRS Counter -->
      <g transform="translate(460, ${bottomConcourseY + 28})">
        <rect x="0" y="0" width="330" height="70" rx="8" fill="#0284C7" stroke="#38BDF8" stroke-width="2" />
        <text x="165" y="32" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">🎫 PRS RESERVATION CENTER</text>
        <text x="165" y="55" fill="#E0F2FE" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">&amp; UTS UNRESERVED COUNTERS</text>
      </g>

      <!-- 2. Station Superintendent & Help Desk -->
      <g transform="translate(850, ${bottomConcourseY + 28})">
        <rect x="0" y="0" width="360" height="70" rx="8" fill="#065F46" stroke="#10B981" stroke-width="2" />
        <text x="180" y="32" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">ℹ️ 24x7 MAY I HELP YOU DESK</text>
        <text x="180" y="55" fill="#D1FAE5" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">STATION SUPERINTENDENT OFFICE</text>
      </g>

      <!-- 3. VIP Lounge & Heritage Waiting Hall -->
      <g transform="translate(1270, ${bottomConcourseY + 28})">
        <rect x="0" y="0" width="420" height="70" rx="8" fill="#581C87" stroke="#A855F7" stroke-width="2" />
        <text x="210" y="32" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">🛋️ VIP EXECUTIVE LOUNGE</text>
        <text x="210" y="55" fill="#F3E8FF" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">&amp; AC PASSENGER WAITING HALL</text>
      </g>

      <!-- 4. IRCTC Food Plaza & Refreshments -->
      <g transform="translate(1750, ${bottomConcourseY + 28})">
        <rect x="0" y="0" width="400" height="70" rx="8" fill="#9A3412" stroke="#F97316" stroke-width="2" />
        <text x="200" y="32" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">☕ IRCTC EXECUTIVE FOOD PLAZA</text>
        <text x="200" y="55" fill="#FFEDD5" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">CANTEEN &amp; PACKAGED DRINKING WATER</text>
      </g>

      <!-- 5. Accessible Restrooms & Medical Booth -->
      <g transform="translate(2210, ${bottomConcourseY + 28})">
        <rect x="0" y="0" width="320" height="70" rx="8" fill="#1E3A8A" stroke="#3B82F6" stroke-width="2" />
        <text x="160" y="32" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">♿ ACCESSIBLE RESTROOMS</text>
        <text x="160" y="55" fill="#DBEAFE" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">BABY CARE &amp; EMERGENCY FIRST AID</text>
      </g>

      <!-- 6. RPF Police Thana & Security -->
      <g transform="translate(2590, ${bottomConcourseY + 28})">
        <rect x="0" y="0" width="360" height="70" rx="8" fill="#312E81" stroke="#6366F1" stroke-width="2" />
        <text x="180" y="32" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">👮 RPF POLICE THANA</text>
        <text x="180" y="55" fill="#E0E7FF" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">LUGGAGE SCANNER &amp; CLOAK ROOM</text>
      </g>

      <!-- Prominent Pink Pill Badge: TERMINAL-1 / ENTRY-1 -->
      <g transform="translate(1520, ${bottomConcourseY + bottomConcourseHeight - 110})">
        <rect x="0" y="0" width="360" height="48" rx="24" fill="#FF00A4" stroke="#662D91" stroke-width="2.5" />
        <text x="180" y="32" fill="#FFFFFF" font-size="22" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" letter-spacing="2">
          ${code === 'MYS' ? 'ENTRY-1: JLB ROAD' : 'TERMINAL-1'}
        </text>
      </g>

      <!-- Yellow Parking Bays (Taxi, Auto, Two-Wheeler) -->
      <g id="ParkingBays" transform="translate(435, ${bottomConcourseY + bottomConcourseHeight - 55})">
        <rect x="100" y="0" width="460" height="42" rx="8" fill="#FEF3C7" stroke="#D97706" stroke-width="2" />
        <text x="330" y="27" fill="#92400E" font-size="15" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">🚖 PRE-PAID TAXI STAND</text>

        <rect x="620" y="0" width="460" height="42" rx="8" fill="#FEF3C7" stroke="#D97706" stroke-width="2" />
        <text x="850" y="27" fill="#92400E" font-size="15" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">🛺 AUTO RICKSHAW PICKUP BAY</text>

        <rect x="1140" y="0" width="460" height="42" rx="8" fill="#FEF3C7" stroke="#D97706" stroke-width="2" />
        <text x="1370" y="27" fill="#92400E" font-size="15" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">🛵 TWO WHEELER PARKING ZONE</text>

        <rect x="1660" y="0" width="500" height="42" rx="8" fill="#FEF3C7" stroke="#D97706" stroke-width="2" />
        <text x="1910" y="27" fill="#92400E" font-size="15" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">🚌 CITY TRANSIT BUS TERMINAL</text>
      </g>
    </g>

    ${
      isDualSided
        ? `
    <!-- SECONDARY CONCOURSE: ENTRY 2 (TOP) -->
    <g id="TopConcourse_Entry2">
      <rect x="480" y="90" width="2440" height="135" rx="10" fill="#002360" stroke="#001845" stroke-width="2.5" />
      <rect x="495" y="100" width="2410" height="115" rx="8" fill="#071E4A" />

      <!-- Prominent Pink Pill Badge: TERMINAL-2 / ENTRY-2 -->
      <g transform="translate(1520, 110)">
        <rect x="0" y="0" width="360" height="42" rx="21" fill="#FF00A4" stroke="#662D91" stroke-width="2" />
        <text x="180" y="28" fill="#FFFFFF" font-size="19" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" letter-spacing="2">
          ${code === 'MYS' ? 'ENTRY-2: YADAVAGIRI' : 'TERMINAL-2'}
        </text>
      </g>

      <!-- Second Entry Amenities -->
      <g transform="translate(540, 150)">
        <rect x="0" y="0" width="260" height="50" rx="6" fill="#0284C7" stroke="#38BDF8" stroke-width="1.5" />
        <text x="130" y="32" fill="#FFFFFF" font-size="14" font-weight="bold" text-anchor="middle">🎫 UTS BOOKING COUNTER</text>
      </g>
      <g transform="translate(840, 150)">
        <rect x="0" y="0" width="260" height="50" rx="6" fill="#065F46" stroke="#10B981" stroke-width="1.5" />
        <text x="130" y="32" fill="#FFFFFF" font-size="14" font-weight="bold" text-anchor="middle">ℹ️ ENTRY 2 HELP DESK</text>
      </g>
      <g transform="translate(2000, 150)">
        <rect x="0" y="0" width="280" height="50" rx="6" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5" />
        <text x="140" y="32" fill="#92400E" font-size="14" font-weight="bold" text-anchor="middle">🚖 AUTO &amp; CAB DROP-OFF</text>
      </g>
      <g transform="translate(2320, 150)">
        <rect x="0" y="0" width="260" height="50" rx="6" fill="#1E3A8A" stroke="#3B82F6" stroke-width="1.5" />
        <text x="130" y="32" fill="#FFFFFF" font-size="14" font-weight="bold" text-anchor="middle">♿ STEP-FREE RAMP</text>
      </g>
    </g>
    `
        : ''
    }
  `;

  // Surrounding Roads
  const roadsSvg = `
    <!-- SURROUNDING ROADS WITH LANE MARKINGS & CROSSWALKS -->
    <g id="SurroundingRoads">
      <rect x="0" y="1590" width="${MAP_WIDTH}" height="138" fill="#374151" />
      <line x1="0" y1="1660" x2="${MAP_WIDTH}" y2="1660" stroke="#FFFFFF" stroke-dasharray="24,20" stroke-width="4" opacity="0.9" />

      <!-- Pedestrian Crosswalks (Zebra Stripes) Bottom -->
      <g id="ZebraCrosswalk_Bottom" transform="translate(1620, 1590)">
        <rect x="0" y="6" width="16" height="126" fill="#FFFFFF" opacity="0.85" />
        <rect x="30" y="6" width="16" height="126" fill="#FFFFFF" opacity="0.85" />
        <rect x="60" y="6" width="16" height="126" fill="#FFFFFF" opacity="0.85" />
        <rect x="90" y="6" width="16" height="126" fill="#FFFFFF" opacity="0.85" />
        <rect x="120" y="6" width="16" height="126" fill="#FFFFFF" opacity="0.85" />
        <rect x="150" y="6" width="16" height="126" fill="#FFFFFF" opacity="0.85" />
      </g>

      <g transform="translate(1300, 1680)">
        <rect x="0" y="0" width="800" height="40" rx="8" fill="#111827" stroke="#9CA3AF" stroke-width="2" />
        <text x="400" y="26" fill="#FFFFFF" font-size="16" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" letter-spacing="1.5">
          ${road1Name}
        </text>
      </g>

      ${
        isDualSided
          ? `
      <rect x="0" y="0" width="${MAP_WIDTH}" height="80" fill="#374151" />
      <line x1="0" y1="40" x2="${MAP_WIDTH}" y2="40" stroke="#FFFFFF" stroke-dasharray="24,20" stroke-width="4" opacity="0.9" />

      <g transform="translate(500, 48)">
        <rect x="0" y="0" width="700" height="28" rx="6" fill="#111827" stroke="#9CA3AF" stroke-width="1.5" />
        <text x="350" y="19" fill="#FFFFFF" font-size="13" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" letter-spacing="1">
          ${road2Name}
        </text>
      </g>
      `
          : ''
      }
    </g>
  `;

  // Dedicated Mysuru features (Pit lines, Museum, Clock Tower)
  let mysuruSpecificSvg = '';
  if (code === 'MYS') {
    mysuruSpecificSvg = `
      <g id="MysuruPitLines" transform="translate(2950, 780)">
        <rect x="0" y="0" width="460" height="160" rx="8" fill="#4B5563" opacity="0.3" stroke="#6B7280" stroke-width="1.5" />
        <text x="230" y="24" fill="#9CA3AF" font-size="12" font-weight="bold" text-anchor="middle">SWR COACH MAINTENANCE PIT LINES (1-4)</text>
        <line x1="20" y1="45" x2="440" y2="45" stroke="#78716C" stroke-width="2" />
        <line x1="20" y1="75" x2="440" y2="75" stroke="#78716C" stroke-width="2" />
        <line x1="20" y1="105" x2="440" y2="105" stroke="#78716C" stroke-width="2" />
        <line x1="20" y1="135" x2="440" y2="135" stroke="#78716C" stroke-width="2" />
      </g>

      <g id="MysuruClockTower" transform="translate(1300, 1420)">
        <rect x="0" y="0" width="300" height="36" rx="6" fill="#854D0E" stroke="#EAB308" stroke-width="2" />
        <text x="150" y="24" fill="#FFFFFF" font-size="13" font-weight="900" text-anchor="middle">
          🏛️ 1901 SWR HERITAGE CLOCK TOWER
        </text>
      </g>

      <g id="MysuruMuseumApproach" transform="translate(50, 800)">
        <rect x="0" y="0" width="300" height="80" rx="8" fill="#1E293B" opacity="0.6" stroke="#38BDF8" stroke-width="1.5" />
        <text x="150" y="32" fill="#38BDF8" font-size="13" font-weight="bold" text-anchor="middle">MYSURU RAILWAY MUSEUM</text>
        <text x="150" y="55" fill="#94A3B8" font-size="11" text-anchor="middle">Steam Heritage Locomotive Way</text>
      </g>
    `;
  }

  // Bilingual Station Header Signboard (Top-Right)
  const headerSignboardSvg = `
    <!-- BILINGUAL STATION HEADER SIGNBOARD (TOP-RIGHT) -->
    <g id="StationHeaderSignboard" transform="translate(2040, 20)">
      <rect x="0" y="0" width="1370" height="92" rx="10" fill="#00173D" stroke="#FFFFFF" stroke-width="2.5" />
      <rect x="4" y="4" width="1362" height="84" rx="8" fill="#001F52" stroke="#0284C7" stroke-width="1" />
      <line x1="680" y1="10" x2="680" y2="82" stroke="#0284C7" stroke-width="2" />

      <text x="340" y="44" fill="#FFFFFF" font-size="23" font-weight="900" font-family="'Noto Sans Kannada', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Bengali', Arial, sans-serif" text-anchor="middle">
        ${bilingual.regional}
      </text>
      <text x="340" y="70" fill="#38BDF8" font-size="14" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">
        ${bilingual.zone}
      </text>

      <text x="1025" y="44" fill="#FFFFFF" font-size="22" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" letter-spacing="1">
        ${bilingual.english}
      </text>
      <text x="1025" y="70" fill="#FFEC00" font-size="14" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" letter-spacing="0.5">
        ${platCount} OPERATIONAL PLATFORMS • PASSENGER MAP
      </text>
    </g>
  `;

  // Scale Stamp (Bottom-Left)
  const stampSvg = `
    <g id="ScaleStamp" transform="translate(60, 1470)">
      <rect x="0" y="0" width="340" height="74" rx="8" fill="#1E293B" stroke="#0284C7" stroke-width="2" />
      <text x="170" y="26" fill="#38BDF8" font-size="12" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">INDIAN RAILWAYS ARCHITECTURAL MAP</text>
      <text x="170" y="46" fill="#FFFFFF" font-size="14" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">${code} • ${platCount} PLATFORMS</text>
      <text x="170" y="64" fill="#10B981" font-size="11" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">CAD CERTIFIED 1:500 SPATIAL DATA</text>
    </g>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" width="100%" height="100%">
      <rect x="0" y="0" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" fill="#E1D2CD" />
      <polygon points="0,0 ${MAP_WIDTH},0 ${MAP_WIDTH},180 0,180" fill="#DDD3CD" opacity="0.6" />
      <polygon points="380,210 3080,210 3080,1570 380,1570" fill="#D8CBC5" opacity="0.4" />
      ${roadsSvg}
      ${mysuruSpecificSvg}
      ${tracksSvg}
      ${platformsSvg}
      ${fobsSvg}
      ${concoursesSvg}
      ${headerSignboardSvg}
      ${stampSvg}
    </svg>
  `;
}

/**
 * Builds platform coordinates and structures aligned with the architectural SVG layout
 */
function generateStationPlatforms(code: string, name: string, count: number) {
  const platCount = Math.max(2, Math.min(24, count));
  const isDualSided = platCount >= 6;
  const platformStartY = isDualSided ? 260 : 200;
  const platformEndY = isDualSided ? 1040 : 1100;
  const totalPlatformHeight = platformEndY - platformStartY;
  const platformPitch = totalPlatformHeight / (platCount - 1 || 1);

  const result: any[] = [];
  for (let i = 1; i <= platCount; i++) {
    const idxFromTop = platCount - i;
    const yCenter = platformStartY + idxFromTop * platformPitch;
    result.push({
      id: `platform_${code.toLowerCase()}_${i}`,
      number: i,
      name: `Platform ${i}`,
      stationCode: code,
      level: 0,
      center: { x: 1700, y: Math.round(yCenter) },
      badgeLeft: { x: 540, y: Math.round(yCenter) },
      badgeRight: { x: 2860, y: Math.round(yCenter) },
      lengthMeters: 600,
      stepFree: i <= 2 || i === platCount,
      hasLift: true,
      hasEscalator: i <= 4
    });
  }
  return result;
}

/**
 * Builds facilities list aligned with the architectural SVG layout
 */
function generateStationFacilities(code: string, numPlatforms: number) {
  const platCount = Math.max(2, Math.min(24, numPlatforms));
  const isDualSided = platCount >= 6;
  const platformStartY = isDualSided ? 260 : 200;
  const platformEndY = isDualSided ? 1040 : 1100;
  const totalPlatformHeight = platformEndY - platformStartY;
  const platformPitch = totalPlatformHeight / (platCount - 1 || 1);
  const bottomConcourseY = platformStartY + (platCount - 1) * platformPitch + 55;
  const bottomConcourseHeight = 1560 - bottomConcourseY;

  const facilities: any[] = [
    {
      id: `fac_${code.toLowerCase()}_prs`,
      name: 'PRS Reservation Center & UTS Ticketing',
      type: 'TICKET_COUNTER',
      coordinates: { x: 625, y: Math.round(bottomConcourseY + 63) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_tickets`
    },
    {
      id: `fac_${code.toLowerCase()}_helpdesk`,
      name: 'Station Superintendent & 24x7 May I Help You Desk',
      type: 'HELP_DESK',
      coordinates: { x: 1030, y: Math.round(bottomConcourseY + 63) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_helpdesk`
    },
    {
      id: `fac_${code.toLowerCase()}_vip`,
      name: 'VIP Executive Lounge & AC Waiting Hall',
      type: 'LOUNGE',
      coordinates: { x: 1480, y: Math.round(bottomConcourseY + 63) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_lounge`
    },
    {
      id: `fac_${code.toLowerCase()}_food`,
      name: 'IRCTC Executive Food Plaza & Canteen',
      type: 'FOOD',
      coordinates: { x: 1950, y: Math.round(bottomConcourseY + 63) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_food`
    },
    {
      id: `fac_${code.toLowerCase()}_restrooms`,
      name: 'Divisional Accessible Restrooms & Baby Care',
      type: 'TOILET',
      coordinates: { x: 2370, y: Math.round(bottomConcourseY + 63) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_toilets`
    },
    {
      id: `fac_${code.toLowerCase()}_rpf`,
      name: 'RPF Police Thana & Station Security',
      type: 'INFO',
      coordinates: { x: 2770, y: Math.round(bottomConcourseY + 63) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_rpf`
    },
    {
      id: `fac_${code.toLowerCase()}_lift1`,
      name: 'North FOB Glass Lift (Platforms 1 to ' + platCount + ')',
      type: 'LIFT',
      coordinates: { x: 1073, y: Math.round((platformStartY + platformEndY) / 2) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_lift1`
    },
    {
      id: `fac_${code.toLowerCase()}_lift2`,
      name: 'South FOB Glass Lift (Platforms 1 to ' + platCount + ')',
      type: 'LIFT',
      coordinates: { x: 2393, y: Math.round((platformStartY + platformEndY) / 2) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_lift2`
    },
    {
      id: `fac_${code.toLowerCase()}_esc1`,
      name: 'North FOB High-Speed Escalator',
      type: 'ESCALATOR',
      coordinates: { x: 1142, y: Math.round(platformEndY + 20) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_esc1`
    },
    {
      id: `fac_${code.toLowerCase()}_esc2`,
      name: 'South FOB High-Speed Escalator',
      type: 'ESCALATOR',
      coordinates: { x: 2322, y: Math.round(platformEndY + 20) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_esc2`
    },
    {
      id: `fac_${code.toLowerCase()}_taxi`,
      name: 'Pre-Paid Taxi Stand & Pickup Portico',
      type: 'ENTRY',
      coordinates: { x: 765, y: Math.round(bottomConcourseY + bottomConcourseHeight - 34) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_taxi`
    },
    {
      id: `fac_${code.toLowerCase()}_auto`,
      name: 'Auto Rickshaw Pickup Bay',
      type: 'ENTRY',
      coordinates: { x: 1285, y: Math.round(bottomConcourseY + bottomConcourseHeight - 34) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_auto`
    },
    {
      id: `fac_${code.toLowerCase()}_bus`,
      name: 'City Bus & Transit Interchange',
      type: 'EXIT',
      coordinates: { x: 2345, y: Math.round(bottomConcourseY + bottomConcourseHeight - 34) },
      level: 0,
      nearestNode: `node_${code.toLowerCase()}_bus`
    }
  ];

  if (isDualSided) {
    facilities.push(
      {
        id: `fac_${code.toLowerCase()}_entry2_gate`,
        name: 'Second Concourse Entrance Gate',
        type: 'ENTRY',
        coordinates: { x: 1700, y: 131 },
        level: 0,
        nearestNode: `node_${code.toLowerCase()}_entry2_gate`
      },
      {
        id: `fac_${code.toLowerCase()}_entry2_uts`,
        name: 'Second Entry UTS Booking Counter',
        type: 'TICKET_COUNTER',
        coordinates: { x: 670, y: 175 },
        level: 0,
        nearestNode: `node_${code.toLowerCase()}_entry2_uts`
      },
      {
        id: `fac_${code.toLowerCase()}_entry2_taxi`,
        name: 'Second Entry Auto & Cab Drop-Off',
        type: 'ENTRY',
        coordinates: { x: 2140, y: 175 },
        level: 0,
        nearestNode: `node_${code.toLowerCase()}_entry2_taxi`
      }
    );
  }

  // Mysuru Junction Specific Heritage Landmarks
  if (code === 'MYS') {
    facilities.push(
      {
        id: 'fac_mys_clocktower',
        name: '1901 SWR Heritage Clock Tower & Portico (JLB Road Entry 1)',
        type: 'INFO',
        coordinates: { x: 1450, y: 1438 },
        level: 0,
        nearestNode: 'node_mys_clocktower'
      },
      {
        id: 'fac_mys_museum',
        name: 'Mysuru Railway Museum Approach Way',
        type: 'EXIT',
        coordinates: { x: 200, y: 840 },
        level: 0,
        nearestNode: 'node_mys_museum'
      },
      {
        id: 'fac_mys_pitlines',
        name: 'SWR Coach Maintenance Pit Lines (Lines 1-4)',
        type: 'INFO',
        coordinates: { x: 3180, y: 860 },
        level: 0,
        nearestNode: 'node_mys_pitlines'
      }
    );
  }

  return facilities;
}

/**
 * Blueprint Registry holding specialized blueprints for major stations
 * and procedural blueprints for all stations across India.
 */
class BlueprintRegistry {
  private cache: Map<string, StationBlueprintData> = new Map();

  constructor() {
    this.registerKSRBengaluru();
  }

  private registerKSRBengaluru() {
    // KSR BENGALURU (SBC) - High-resolution architectural base SVG
    this.cache.set('SBC', {
      svgString: KSR_STATION_SVG_STRING,
      stationCode: 'SBC',
      stationName: 'KSR Bengaluru (City Station)',
      totalPlatforms: 10,
      platforms: ksrPlatforms as any[],
      facilities: ksrFacilities as any[],
      viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`
    });
  }

  /**
   * Returns the architectural CAD blueprint data for any station
   */
  public getBlueprint(
    stationCode: string,
    stationName?: string,
    platformCount?: number
  ): StationBlueprintData {
    const code = (stationCode || 'SBC').trim().toUpperCase();

    // Check memory cache
    if (this.cache.has(code)) {
      return this.cache.get(code)!;
    }

    // Curated station specific data across all major Indian cities
    const CURATED_CONFIGS: Record<
      string,
      {
        name: string;
        platforms: number;
        zone: string;
        division: string;
        entry1Name?: string;
        entry2Name?: string;
        roadBottom?: string;
        roadTop?: string;
      }
    > = {
      // Mysuru
      MYS: {
        name: 'Mysuru Junction (Mysore City)',
        platforms: 6,
        zone: 'SWR',
        division: 'MYSURU',
        entry1Name: 'ENTRY 1: JLB ROAD HERITAGE PORTICO',
        entry2Name: 'ENTRY 2: YADAVAGIRI / KRS ROAD',
        roadBottom: 'JLB ROAD (JHANSI LAKSHMI BAI ROAD)',
        roadTop: 'YADAVAGIRI ROAD / KRS ROAD'
      },
      AP: {
        name: 'Ashokapuram (Mysuru Terminal)',
        platforms: 5,
        zone: 'SWR',
        division: 'MYSURU',
        entry1Name: 'ASHOKAPURAM MAIN CONCOURSE',
        entry2Name: 'WORKSHOP ROAD SECOND ENTRY',
        roadBottom: 'ASHOKAPURAM MAIN ROAD',
        roadTop: 'RAILWAY WORKSHOP ROAD'
      },

      // Bengaluru
      YPR: {
        name: 'Yesvantpur Junction',
        platforms: 6,
        zone: 'SWR',
        division: 'BENGALURU',
        entry1Name: 'TUMKUR ROAD MAIN ENTRANCE',
        entry2Name: 'YESVANTPUR METRO SKYWALK SECOND ENTRY',
        roadBottom: 'TUMKUR ROAD / NATIONAL HIGHWAY 4',
        roadTop: 'YESVANTPUR INDUSTRIAL SUBURB ROAD'
      },
      SMVB: {
        name: 'Sir M. Visvesvaraya Terminal Bengaluru',
        platforms: 8,
        zone: 'SWR',
        division: 'BENGALURU',
        entry1Name: 'CENTRALLY AIR-CONDITIONED AIRPORT STYLE TERMINAL',
        entry2Name: 'VIP PORCH & MULTI-TIER PARKING CONNECTOR',
        roadBottom: 'BAIYYAPPANAHALLI MAIN ACCESS ROAD',
        roadTop: 'SMVT OVERPASS FLYOVER'
      },
      BNC: {
        name: 'Bengaluru Cantt',
        platforms: 4,
        zone: 'SWR',
        division: 'BENGALURU',
        entry1Name: 'CANTONMENT MAIN ENTRANCE',
        entry2Name: 'MILLERS ROAD PEDESTRIAN OVERPASS',
        roadBottom: 'CANTONMENT STATION ROAD',
        roadTop: 'MILLERS ROAD'
      },
      KJM: { name: 'Krishnarajapuram', platforms: 4, zone: 'SWR', division: 'BENGALURU' },
      KGI: { name: 'Kengeri', platforms: 4, zone: 'SWR', division: 'BENGALURU' },
      YNK: { name: 'Yelahanka Junction', platforms: 4, zone: 'SWR', division: 'BENGALURU' },
      WFD: { name: 'Whitefield', platforms: 4, zone: 'SWR', division: 'BENGALURU' },

      // Mumbai
      CSMT: {
        name: 'Chhatrapati Shivaji Maharaj Terminus (Mumbai)',
        platforms: 18,
        zone: 'CR',
        division: 'MUMBAI',
        entry1Name: 'UNESCO GOTHIC HERITAGE MAINLINE CONCOURSE (PF 8-18)',
        entry2Name: 'SUBURBAN TERMINUS & P. D\'MELLO ROAD CONCOURSE (PF 1-7)',
        roadBottom: 'DADABHAI NAOROJI (D.N.) ROAD',
        roadTop: 'P. D\'MELLO ROAD'
      },
      DR: {
        name: 'Dadar Junction',
        platforms: 15,
        zone: 'CR/WR',
        division: 'MUMBAI',
        entry1Name: 'WESTERN LINE MAIN CONCOURSE',
        entry2Name: 'CENTRAL LINE ENTRY',
        roadBottom: 'SENAPATI BAPAT MARG',
        roadTop: 'SWAMI GYAN JIVANDAS MARG'
      },
      LTT: {
        name: 'Lokmanya Tilak Terminus (Kurla)',
        platforms: 5,
        zone: 'CR',
        division: 'MUMBAI',
        entry1Name: 'LTT MAIN PASSENGER TERMINAL',
        roadBottom: 'SANTACRUZ-CHEMBUR LINK ROAD (SCLR)'
      },
      BDTS: {
        name: 'Bandra Terminus',
        platforms: 9,
        zone: 'WR',
        division: 'MUMBAI',
        entry1Name: 'BANDRA EAST EXPRESS TERMINAL CONCOURSE',
        roadBottom: 'NAUPADA ROAD / BANDRA TERMINUS ROAD'
      },
      MMCT: {
        name: 'Mumbai Central',
        platforms: 9,
        zone: 'WR',
        division: 'MUMBAI',
        entry1Name: 'MAINLINE RAJDHANI CONCOURSE (PF 5-9)',
        entry2Name: 'SUBURBAN LOCAL CONCOURSE (PF 1-4)',
        roadBottom: 'DR. ANANDRAO NAIR MARG',
        roadTop: 'BELLASIS ROAD'
      },

      // Delhi
      NDLS: {
        name: 'New Delhi Railway Station',
        platforms: 16,
        zone: 'NR',
        division: 'DELHI',
        entry1Name: 'PAHARGANJ MAIN CONCOURSE (PF 1-8)',
        entry2Name: 'AJMERI GATE & AIRPORT METRO SKYWALK (PF 9-16)',
        roadBottom: 'BHAVBHUTI MARG (AJMERI GATE)',
        roadTop: 'CHELMSFORD ROAD (PAHARGANJ)'
      },
      DLI: {
        name: 'Old Delhi Junction',
        platforms: 16,
        zone: 'NR',
        division: 'DELHI',
        entry1Name: 'CHANDNI CHOWK MAIN HERITAGE CONCOURSE',
        entry2Name: 'KASHMERE GATE SECOND ENTRANCE',
        roadBottom: 'CHANDNI CHOWK MAIN ROAD',
        roadTop: 'ZORAWOR SINGH MARG'
      },
      NZM: {
        name: 'Hazrat Nizamuddin',
        platforms: 9,
        zone: 'NR',
        division: 'DELHI',
        entry1Name: 'SARAI KALE KHAN MAIN CONCOURSE & RRTS LINK',
        entry2Name: 'JANGPURA SECOND ENTRANCE',
        roadBottom: 'SARAI KALE KHAN ROAD / RING ROAD',
        roadTop: 'MATHURA ROAD LINK'
      },
      ANVT: {
        name: 'Anand Vihar Terminal',
        platforms: 7,
        zone: 'NR',
        division: 'DELHI',
        entry1Name: 'ANAND VIHAR MULTI-MODAL METRO & BUS INTERCHANGE',
        roadBottom: 'SWAMI VIVEKANAND MARG'
      },

      // Chennai
      MAS: {
        name: 'Chennai Central (Puratchi Thalaivar Dr. MGR)',
        platforms: 17,
        zone: 'SR',
        division: 'CHENNAI',
        entry1Name: 'VICTORIAN RED-BRICK MAINLINE CONCOURSE (PF 1-12)',
        entry2Name: 'MOORE MARKET COMPLEX: SUBURBAN TERMINAL (PF 13-17)',
        roadBottom: 'EVR PERIYAR SALAI (POONAMALLEE HIGH ROAD)',
        roadTop: 'WALL TAX ROAD (VOC ROAD)'
      },
      MS: {
        name: 'Chennai Egmore',
        platforms: 11,
        zone: 'SR',
        division: 'CHENNAI',
        entry1Name: 'GANDHI IRWIN ROAD MAIN ENTRANCE',
        entry2Name: 'POONAMALLEE HIGH ROAD SECOND ENTRANCE',
        roadBottom: 'GANDHI IRWIN ROAD',
        roadTop: 'POONAMALLEE HIGH ROAD'
      },
      TBM: { name: 'Tambaram', platforms: 8, zone: 'SR', division: 'CHENNAI' },

      // Kolkata
      HWH: {
        name: 'Howrah Junction (Kolkata)',
        platforms: 23,
        zone: 'ER/SER',
        division: 'HOWRAH',
        entry1Name: 'TERMINAL 1: EASTERN RAILWAY MAINLINE & FERRY LINK (PF 1-15)',
        entry2Name: 'TERMINAL 2: SOUTH EASTERN RAILWAY NEW COMPLEX (PF 17-23)',
        roadBottom: 'HOWRAH STATION ROAD / RIVERFRONT ROAD',
        roadTop: 'HOWRAH BRIDGE APPROACH ROAD'
      },
      SDAH: {
        name: 'Sealdah',
        platforms: 21,
        zone: 'ER',
        division: 'SEALDAH',
        entry1Name: 'SEALDAH MAIN & SOUTH COMMUTER CONCOURSE',
        entry2Name: 'SEALDAH NORTH & METRO SKYWALK',
        roadBottom: 'ACHARYA PRAFULLA CHANDRA ROAD',
        roadTop: 'BEPIN BEHARI GANGULY STREET'
      },
      KOAA: { name: 'Kolkata Terminus (Chitpur)', platforms: 5, zone: 'ER', division: 'SEALDAH' },

      // Hyderabad / Secunderabad
      SC: {
        name: 'Secunderabad Junction',
        platforms: 10,
        zone: 'SCR',
        division: 'SECUNDERABAD',
        entry1Name: 'STATION ROAD MAIN ENTRANCE (PF 1)',
        entry2Name: 'BHOIGUDA SECOND ENTRANCE (PF 10)',
        roadBottom: 'SECUNDERABAD STATION ROAD',
        roadTop: 'BHOIGUDA ROAD'
      },
      HYB: {
        name: 'Hyderabad Deccan (Nampally)',
        platforms: 6,
        zone: 'SCR',
        division: 'SECUNDERABAD',
        entry1Name: 'NAMPALLY MAIN HERITAGE CONCOURSE',
        roadBottom: 'NAMPALLY STATION ROAD'
      },
      KCG: { name: 'Kacheguda', platforms: 5, zone: 'SCR', division: 'HYDERABAD' },

      // Pune
      PUNE: {
        name: 'Pune Junction',
        platforms: 6,
        zone: 'CR',
        division: 'PUNE',
        entry1Name: 'PUNE MAIN STATION ROAD PORTICO & VIP LOUNGE (PF 1)',
        entry2Name: 'TADIWALA ROAD SECOND ENTRANCE (PF 6)',
        roadBottom: 'PUNE STATION ROAD / DR. AMBEDKAR ROAD',
        roadTop: 'TADIWALA ROAD'
      },

      // Ahmedabad
      ADI: {
        name: 'Ahmedabad Junction (Kalupur)',
        platforms: 12,
        zone: 'WR',
        division: 'AHMEDABAD',
        entry1Name: 'KALUPUR MAIN CONCOURSE & METRO INTERCHANGE (PF 1)',
        entry2Name: 'SARASPUR SECOND ENTRY & BULLET TRAIN TERMINUS (PF 12)',
        roadBottom: 'KALUPUR STATION ROAD',
        roadTop: 'SARASPUR RAILWAY OVERBRIDGE ROAD'
      },

      // Jaipur
      JP: {
        name: 'Jaipur Junction',
        platforms: 8,
        zone: 'NWR',
        division: 'JAIPUR',
        entry1Name: 'PINK CITY MAIN ARCHITECTURAL PORTICO (PF 1)',
        entry2Name: 'HASANPURA SECOND ENTRANCE & POWER HOUSE ROAD (PF 8)',
        roadBottom: 'STATION ROAD / POLO VICTORY',
        roadTop: 'POWER HOUSE ROAD / HASANPURA'
      },

      // Lucknow
      LKO: {
        name: 'Lucknow Charbagh (NR)',
        platforms: 9,
        zone: 'NR',
        division: 'LUCKNOW',
        entry1Name: 'CHARBAGH MUGHAL DOME GRAND CONCOURSE & CLOCK TOWER (PF 1)',
        entry2Name: 'CABWAY PEDESTRIAN BRIDGE SECOND ENTRANCE (PF 9)',
        roadBottom: 'CHARBAGH STATION CIRCLE ROAD',
        roadTop: 'CABWAY BRIDGE ROAD'
      },
      LJN: { name: 'Lucknow Junction (NER)', platforms: 6, zone: 'NER', division: 'LUCKNOW' },

      // Kochi
      ERS: {
        name: 'Ernakulam Junction (South)',
        platforms: 6,
        zone: 'SR',
        division: 'THIRUVANANTHAPURAM',
        entry1Name: 'SOUTH PORTICO & CHIEF PASSENGER CONCOURSE (PF 1)',
        entry2Name: 'KSRTC BUS STAND ROAD LINK OVERPASS (PF 6)',
        roadBottom: 'SOUTH RAILWAY STATION ROAD',
        roadTop: 'KARSHAKA ROAD / BUS STAND LINK'
      },

      // Patna
      PNBE: {
        name: 'Patna Junction',
        platforms: 10,
        zone: 'ECR',
        division: 'DANAPUR',
        entry1Name: 'MAHAVIR MANDIR NORTH ENTRY & FRONTIER CONCOURSE (PF 1)',
        entry2Name: 'KARBIGAHIYA SOUTH ENTRANCE & BUS TERMINUS (PF 10)',
        roadBottom: 'FRAZER ROAD / DAK BUNGLOW ROAD',
        roadTop: 'KARBIGAHIYA ROAD'
      }
    };

    const config = CURATED_CONFIGS[code] || {
      name: stationName || `Station ${code}`,
      platforms: platformCount || 6,
      zone: 'IR',
      division: 'DIV',
      entry1Name: `${stationName || code} MAIN PASSENGER TERMINAL`,
      entry2Name: `${stationName || code} SECONDARY ENTRANCE`,
      roadBottom: `${stationName || code} ACCESS ROAD`,
      roadTop: `${stationName || code} SECOND ENTRY ROAD`
    };

    const finalName = stationName || config.name;
    const finalPlatCount = platformCount || config.platforms;

    // Generate Architectural Blueprint SVG with photorealistic KSR visual style
    const svgString = createArchitecturalStationSvg(
      code,
      finalName,
      finalPlatCount,
      config.zone,
      config.division,
      {
        entry1Name: config.entry1Name,
        entry2Name: config.entry2Name,
        roadBottom: config.roadBottom,
        roadTop: config.roadTop
      }
    );

    const platforms = generateStationPlatforms(code, finalName, finalPlatCount);
    const facilities = generateStationFacilities(code, finalPlatCount);

    const bpData: StationBlueprintData = {
      svgString,
      stationCode: code,
      stationName: finalName,
      totalPlatforms: finalPlatCount,
      platforms,
      facilities,
      viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`
    };

    this.cache.set(code, bpData);
    return bpData;
  }
}

export const blueprintRegistry = new BlueprintRegistry();
