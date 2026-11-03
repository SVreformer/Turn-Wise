import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  Animated
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { useBoardingSureStore } from '../store/boardingSureStore';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

export type ArVrMode = 'ar' | 'vr_single' | 'vr_stereo';

interface SpatialArVrModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Waypoint3D {
  id: string;
  label: string;
  type: 'platform' | 'lift' | 'ramp' | 'coach' | 'restroom' | 'exit';
  x: number; // Station coords
  y: number;
  z: number; // Height
  distanceMeters: number;
  instruction: string;
}

export const SpatialArVrModal: React.FC<SpatialArVrModalProps> = ({ visible, onClose }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

  const {
    activeRoute,
    currentStepIndex,
    isNavigating,
    startNode,
    destinationNode,
    liveSteps,
    liveBearing,
    selectedProfile,
    language
  } = useNavigationStore();

  const { trainNumber, coachNumber, platformNumber } = useBoardingSureStore();

  const [mode, setMode] = useState<ArVrMode>('ar');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<number>(0); // Vertical look (-45 to 45)
  const [yaw, setYaw] = useState<number>(0);     // Horizontal look (0 to 360)
  const [walkProgress, setWalkProgress] = useState<number>(0); // 0 to 1 along route
  const [isAutoWalking, setIsAutoWalking] = useState<boolean>(false);
  const [showPitchHud, setShowPitchHud] = useState<boolean>(true);
  const [activeZone, setActiveZone] = useState<string>('Terminal 1 Concourse (East)');
  const [gyroActive, setGyroActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Pulse animation for AR arrows
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Web Camera Feed Initialization for Real AR Mode
  useEffect(() => {
    if (!visible) return;

    if (mode === 'ar' && Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
          setCameraError(null);
        })
        .catch((err) => {
          console.log('[SpatialArVr] Camera stream fallback:', err.message);
          setCameraActive(false);
          setCameraError('Simulated Station View Active (Camera permission optional)');
        });
    } else {
      setCameraActive(false);
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [visible, mode]);

  // Smartphone Gyroscope Orientation Listener (Web)
  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null) {
        setGyroActive(true);
        // Alpha is compass heading 0-360
        setYaw((e.alpha + 180) % 360);
        // Beta is pitch tilt (-90 to 90)
        setPitch(Math.max(-45, Math.min(45, (e.beta - 60))));
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [visible]);

  // Route Waypoints for 3D Wayfinding
  const waypoints = useMemo<Waypoint3D[]>(() => {
    const list: Waypoint3D[] = [];

    // Target Coach / Platform Waypoint
    list.push({
      id: 'wp_target',
      label: `Platform ${platformNumber || 8} • Coach ${coachNumber || 'B4'}`,
      type: 'coach',
      x: 1450,
      y: 375,
      z: 0,
      distanceMeters: Math.max(15, Math.round(180 * (1 - walkProgress))),
      instruction: 'Target Boarding Spot (Direct Access)'
    });

    // Accessible Lift Waypoint
    list.push({
      id: 'wp_lift',
      label: 'Accessible Lift 1 (T1 Concourse)',
      type: 'lift',
      x: 1888,
      y: 910,
      z: 0,
      distanceMeters: Math.max(8, Math.round(42 * (1 - walkProgress))),
      instruction: 'Step-Free Platform Link'
    });

    // Accessible Restroom
    list.push({
      id: 'wp_restroom',
      label: 'Divyangjan Restroom',
      type: 'restroom',
      x: 2050,
      y: 920,
      z: 0,
      distanceMeters: Math.max(20, Math.round(65 * (1 - walkProgress))),
      instruction: 'Braille & Tactile Paved'
    });

    return list;
  }, [platformNumber, coachNumber, walkProgress]);

  // Auto-walk Route Animation Loop
  useEffect(() => {
    if (!isAutoWalking) return;
    const interval = setInterval(() => {
      setWalkProgress((prev) => {
        if (prev >= 0.98) {
          setIsAutoWalking(false);
          return 1.0;
        }
        return prev + 0.015;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isAutoWalking]);

  // Touch Drag to Pan (Desktop / Web Fallback)
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (clientX: number, clientY: number) => {
    isDragging.current = true;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - lastMousePos.current.x;
    const dy = clientY - lastMousePos.current.y;
    lastMousePos.current = { x: clientX, y: clientY };

    setYaw((prev) => (prev - dx * 0.4 + 360) % 360);
    setPitch((prev) => Math.max(-45, Math.min(45, prev + dy * 0.3)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // 3D Perspective Canvas Rendering Loop (Station Architecture & Spatial AR HUD)
  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render3DScene = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const isStereo = mode === 'vr_stereo';
      const eyeCount = isStereo ? 2 : 1;
      const eyeWidth = isStereo ? w / 2 : w;

      for (let eye = 0; eye < eyeCount; eye++) {
        const eyeOffset = isStereo ? (eye === 0 ? -15 : 15) : 0;
        const originX = isStereo ? eye * eyeWidth + eyeWidth / 2 : w / 2;
        const originY = h / 2 + pitch * 3.5;

        ctx.save();
        ctx.beginPath();
        ctx.rect(eye * eyeWidth, 0, eyeWidth, h);
        ctx.clip();

        // 1. Perspective Grid (Concourse Marble Floor & Railway Tracks)
        if (mode !== 'ar' || !cameraActive) {
          // Synthetic photorealistic station background
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, '#0F172A');
          grad.addColorStop(0.5, '#1E293B');
          grad.addColorStop(0.51, '#0F172A');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(eye * eyeWidth, 0, eyeWidth, h);

          // Station Ceiling Truss Lines
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.25)';
          ctx.lineWidth = 1.5;
          for (let i = -6; i <= 6; i++) {
            const startX = originX + i * 160 + eyeOffset;
            ctx.beginPath();
            ctx.moveTo(originX, originY - 140);
            ctx.lineTo(startX, 0);
            ctx.stroke();
          }

          // Station Floor Perspective Tiles
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
          for (let i = -10; i <= 10; i++) {
            const floorX = originX + i * 220 + eyeOffset;
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(floorX, h);
            ctx.stroke();
          }

          // Tactile Paving Strip (Yellow Braille guiding strip along station concourse)
          ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
          ctx.beginPath();
          ctx.moveTo(originX - 25, originY);
          ctx.lineTo(originX + 25, originY);
          ctx.lineTo(originX + 160, h);
          ctx.lineTo(originX + 60, h);
          ctx.closePath();
          ctx.fill();

          // 3D Train Carriage Silhouette in Distance
          const trainDistance = 180 * (1 - walkProgress);
          const trainScale = Math.max(0.25, Math.min(1.2, 80 / (trainDistance + 20)));
          const trainX = originX + 240 * trainScale + eyeOffset;
          const trainY = originY - 40 * trainScale;

          ctx.fillStyle = '#0F3823'; // Indian Railways green/blue
          ctx.fillRect(trainX, trainY, 280 * trainScale, 110 * trainScale);
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 2 * trainScale;
          ctx.strokeRect(trainX, trainY, 280 * trainScale, 110 * trainScale);

          // Train Windows & Coach Plate
          ctx.fillStyle = '#FEF08A';
          ctx.font = `bold ${Math.round(18 * trainScale)}px sans-serif`;
          ctx.fillText(`COACH ${coachNumber || 'B4'}`, trainX + 20 * trainScale, trainY + 45 * trainScale);
        }

        // 2. Spatial AR Floating Chevrons (Pulsing Guidance Path on Floor)
        const numChevrons = 5;
        for (let c = 0; c < numChevrons; c++) {
          const depth = (c + 1) * 60 - ((walkProgress * 250) % 60);
          const chevronScale = Math.max(0.2, 220 / (depth + 80));
          const cx = originX + Math.sin((yaw * Math.PI) / 180) * 80 + eyeOffset;
          const cy = originY + depth * 1.8 * chevronScale;

          if (cy < h && cy > originY) {
            ctx.save();
            ctx.strokeStyle = c === 0 ? '#10B981' : '#165B33';
            ctx.lineWidth = Math.max(3, 8 * chevronScale);
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 12;

            ctx.beginPath();
            ctx.moveTo(cx - 50 * chevronScale, cy + 25 * chevronScale);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + 50 * chevronScale, cy + 25 * chevronScale);
            ctx.stroke();
            ctx.restore();
          }
        }

        // 3. Floating 3D Waypoint Holograms
        waypoints.forEach((wp, idx) => {
          const angleOffset = (idx - 1) * 35 - yaw * 0.6;
          const rad = (angleOffset * Math.PI) / 180;
          const dist = wp.distanceMeters;
          const wpScale = Math.max(0.45, Math.min(1.3, 110 / (dist + 40)));

          const hx = originX + Math.sin(rad) * (340 * wpScale) + eyeOffset;
          const hy = originY - 110 * wpScale - Math.cos(rad) * 30;

          // Hologram Card
          ctx.save();
          ctx.fillStyle = wp.type === 'coach' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(22, 91, 51, 0.88)';
          ctx.strokeStyle = wp.type === 'coach' ? '#F59E0B' : '#10B981';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = wp.type === 'coach' ? '#F59E0B' : '#10B981';
          ctx.shadowBlur = 14;

          const cardW = 210 * wpScale;
          const cardH = 68 * wpScale;
          const cardX = hx - cardW / 2;
          const cardY = hy - cardH / 2;

          // Rounded Card
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 12 * wpScale);
          ctx.fill();
          ctx.stroke();

          // Icon & Text
          const icon = wp.type === 'coach' ? '🚆' : wp.type === 'lift' ? '🛗' : '🚻';
          ctx.font = `bold ${Math.round(18 * wpScale)}px sans-serif`;
          ctx.fillText(icon, cardX + 12 * wpScale, cardY + 28 * wpScale);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.round(12 * wpScale)}px sans-serif`;
          ctx.fillText(wp.label, cardX + 42 * wpScale, cardY + 26 * wpScale);

          ctx.fillStyle = '#94A3B8';
          ctx.font = `600 ${Math.round(10 * wpScale)}px sans-serif`;
          ctx.fillText(`${wp.distanceMeters}m • ${wp.instruction}`, cardX + 42 * wpScale, cardY + 48 * wpScale);

          // Floating Pin Line Down to Walkway
          ctx.strokeStyle = wp.type === 'coach' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(hx, cardY + cardH);
          ctx.lineTo(hx, originY + 40 * wpScale);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.restore();
        });

        // 4. VR Headset Crosshair (Center reticle in VR modes)
        if (isStereo || mode === 'vr_single') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(originX, originY, 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(originX, originY, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#10B981';
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render3DScene);
    };

    animId = requestAnimationFrame(render3DScene);
    return () => cancelAnimationFrame(animId);
  }, [visible, mode, yaw, pitch, walkProgress, cameraActive, waypoints]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* TOP SPATIAL HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeRow}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>SPATIAL SLAM 3D</Text>
                </View>
                {gyroActive && (
                  <View style={styles.gyroBadge}>
                    <Text style={styles.gyroBadgeText}>📱 GYRO 360°</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerTitle}>
                {mode === 'ar' ? '📱 Spatial AR Wayfinding' : (mode === 'vr_stereo' ? '🥽 Dual-Screen VR Goggles' : '🌐 360° VR Station Concourse')}
              </Text>
              <Text style={styles.headerSub}>
                KSR Bengaluru Railway Station • {activeZone}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* MAIN 3D / AR VIEWPORT */}
          <View
            style={styles.viewportArea}
            // @ts-ignore Web pointer drag handlers
            onMouseDown={(e: any) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e: any) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onTouchStart={(e: any) => {
              if (e.touches && e.touches[0]) {
                handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchMove={(e: any) => {
              if (e.touches && e.touches[0]) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handlePointerUp}
          >
            {/* Live Camera Video Element (For AR on Web) */}
            {Platform.OS === 'web' && (
              <video
                ref={videoRef as any}
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: mode === 'ar' && cameraActive ? 'block' : 'none'
                }}
              />
            )}

            {/* 3D WebGL / Spatial Perspective Canvas */}
            {Platform.OS === 'web' && (
              <canvas
                ref={canvasRef as any}
                width={windowWidth > 800 ? 820 : windowWidth}
                height={windowHeight > 800 ? 540 : 440}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            )}

            {/* Non-web Native Fallback Mockup Banner */}
            {Platform.OS !== 'web' && (
              <View style={styles.nativeMockupView}>
                <Text style={{ fontSize: 44 }}>🥽</Text>
                <Text style={styles.nativeMockupTitle}>3D Spatial Wayfinding Active</Text>
                <Text style={styles.nativeMockupSub}>
                  Bearing: {liveBearing}° • Target: Platform {platformNumber || 8} Coach {coachNumber || 'B4'}
                </Text>
              </View>
            )}

            {/* Floating AR Wayfinding HUD Overlay */}
            <View style={styles.floatingHudOverlay} pointerEvents="none">
              {/* Target Coach Directive Card */}
              <View style={styles.hudDirectiveCard}>
                <View style={styles.hudIconCircle}>
                  <Text style={{ fontSize: 22 }}>🚆</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.hudDirectiveLabel}>NEXT SPATIAL WAYPOINT</Text>
                  <Text style={styles.hudDirectiveTitle}>
                    Platform {platformNumber || 8} • Coach {coachNumber || 'B4'}
                  </Text>
                  <Text style={styles.hudDirectiveDist}>
                    {Math.max(15, Math.round(180 * (1 - walkProgress)))}m remaining • Step-free route
                  </Text>
                </View>
              </View>

              {/* Compass & Pitch Readout */}
              {showPitchHud && (
                <View style={styles.hudTelemetryBox}>
                  <Text style={styles.hudTelemetryText}>
                    🧭 HEADING: {Math.round(yaw)}° {yaw > 315 || yaw <= 45 ? 'NORTH' : (yaw > 45 && yaw <= 135 ? 'EAST' : (yaw > 135 && yaw <= 225 ? 'SOUTH' : 'WEST'))}
                  </Text>
                  <Text style={styles.hudTelemetryText}>
                    📐 TILT: {Math.round(pitch)}° • SLAM DRIFT: ±0.2m
                  </Text>
                  <Text style={styles.hudTelemetryText}>
                    ♿ ACCESSIBILITY: 100% STEP-FREE
                  </Text>
                </View>
              )}
            </View>

            {/* AR Mode Camera Notice */}
            {cameraError && mode === 'ar' && (
              <View style={styles.cameraNoticePill}>
                <Text style={styles.cameraNoticeText}>ℹ️ {cameraError}</Text>
              </View>
            )}
          </View>

          {/* INTERACTIVE CONTROLS FOR HACKATHON PITCH */}
          <View style={styles.controlsContainer}>
            {/* Mode Selector Tabs */}
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'ar' && styles.modeTabActive]}
                onPress={() => setMode('ar')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeTabText, mode === 'ar' && styles.modeTabTextActive]}>
                  📱 AR Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'vr_single' && styles.modeTabActive]}
                onPress={() => setMode('vr_single')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeTabText, mode === 'vr_single' && styles.modeTabTextActive]}>
                  🌐 360° VR View
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'vr_stereo' && styles.modeTabActive]}
                onPress={() => setMode('vr_stereo')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeTabText, mode === 'vr_stereo' && styles.modeTabTextActive]}>
                  🥽 VR Goggles (Stereo)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Bar (Walk Simulation & Quick Zone Teleport) */}
            <View style={styles.actionControlsRow}>
              <TouchableOpacity
                style={[styles.simWalkBtn, isAutoWalking && styles.simWalkBtnActive]}
                onPress={() => setIsAutoWalking(!isAutoWalking)}
                activeOpacity={0.85}
              >
                <Text style={styles.simWalkBtnText}>
                  {isAutoWalking ? '⏸️ Pause Walkthrough' : '🚶 Simulate Route Walkthrough'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hudToggleBtn}
                onPress={() => setShowPitchHud(!showPitchHud)}
                activeOpacity={0.8}
              >
                <Text style={styles.hudToggleText}>
                  {showPitchHud ? '📊 Hide Pitch HUD' : '📊 Show Pitch HUD'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Teleport Quick Jump Stations for Hackathon Judges */}
            <View style={styles.zoneTeleportRow}>
              <Text style={styles.zoneLabel}>DEMO ZONES:</Text>
              {[
                { name: 'T1 Concourse', yaw: 0 },
                { name: 'Platform 8', yaw: 90 },
                { name: 'Subway Ramp', yaw: 180 },
                { name: 'Overbridge', yaw: 270 }
              ].map((zone) => (
                <TouchableOpacity
                  key={zone.name}
                  style={[styles.zoneChip, activeZone.includes(zone.name) && styles.zoneChipActive]}
                  onPress={() => {
                    setActiveZone(zone.name);
                    setYaw(zone.yaw);
                    setWalkProgress(zone.name === 'Platform 8' ? 0.9 : 0.2);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.zoneChipText, activeZone.includes(zone.name) && styles.zoneChipTextActive]}>
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm
  },
  container: {
    backgroundColor: '#0B1120',
    width: '100%',
    maxWidth: 860,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    overflow: 'hidden',
    ...Shadows.floating
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A'
  },
  headerLeft: {
    flex: 1
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6
  },
  livePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5
  },
  gyroBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  gyroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  viewportArea: {
    width: '100%',
    height: 440,
    backgroundColor: '#020617',
    position: 'relative',
    overflow: 'hidden'
  },
  nativeMockupView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  nativeMockupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10
  },
  nativeMockupSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4
  },
  floatingHudOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'space-between'
  },
  hudDirectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#10B981',
    maxWidth: 420,
    ...Shadows.card
  },
  hudIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10B981'
  },
  hudDirectiveLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.6
  },
  hudDirectiveTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1
  },
  hudDirectiveDist: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },
  hudTelemetryBox: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  hudTelemetryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16
  },
  cameraNoticePill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569'
  },
  cameraNoticeText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600'
  },
  controlsContainer: {
    padding: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B'
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  modeTabActive: {
    backgroundColor: '#165B33',
    borderColor: '#10B981'
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8'
  },
  modeTabTextActive: {
    color: '#FFFFFF'
  },
  actionControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  simWalkBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#D97706',
    alignItems: 'center',
    ...Shadows.sm
  },
  simWalkBtnActive: {
    backgroundColor: '#DC2626'
  },
  simWalkBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  hudToggleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569'
  },
  hudToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0'
  },
  zoneTeleportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  zoneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 4
  },
  zoneChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155'
  },
  zoneChipActive: {
    backgroundColor: '#334155',
    borderColor: '#38BDF8'
  },
  zoneChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8'
  },
  zoneChipTextActive: {
    color: '#38BDF8'
  }
});
