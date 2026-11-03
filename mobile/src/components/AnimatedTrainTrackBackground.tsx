import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, useWindowDimensions, Platform } from 'react-native';
import Svg, { Rect, Line, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/tokens';

interface AnimatedTrainTrackBackgroundProps {
  height?: number;
  opacity?: number;
  speedMs?: number;
}

export const AnimatedTrainTrackBackground: React.FC<AnimatedTrainTrackBackgroundProps> = ({
  height = 110,
  opacity = 0.85,
  speedMs = 24000
}) => {
  const { width } = useWindowDimensions();
  const screenWidth = Math.max(width, 1024);
  const trainAnim = useRef(new Animated.Value(0)).current;

  // Train total length
  const TRAIN_LENGTH = 620;

  useEffect(() => {
    trainAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(trainAnim, {
        toValue: 1,
        duration: speedMs,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web'
      })
    );
    loop.start();
    return () => loop.stop();
  }, [screenWidth, speedMs]);

  // Interpolate position from offscreen left (-TRAIN_LENGTH - 100) to offscreen right (screenWidth + 100)
  const translateX = trainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-TRAIN_LENGTH - 80, screenWidth + 80]
  });

  // Number of sleepers needed across screen
  const sleeperCount = Math.ceil(screenWidth / 28) + 4;
  const sleepers = Array.from({ length: sleeperCount }, (_, i) => i * 28);

  const trackY = Math.round(height * 0.65);

  return (
    <View style={[styles.container, { height, opacity }]} pointerEvents="none">
      {/* 1. Stationary Minimalist Railway Track */}
      <Svg width="100%" height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="railGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#495057" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#212529" stopOpacity="0.7" />
          </LinearGradient>
          <LinearGradient id="ballastFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#E9ECEF" stopOpacity="0.0" />
            <Stop offset="15%" stopColor="#CED4DA" stopOpacity="0.25" />
            <Stop offset="85%" stopColor="#CED4DA" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#E9ECEF" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Ballast foundation strip */}
        <Rect x="0" y={trackY - 12} width="100%" height="24" fill="url(#ballastFade)" />

        {/* Sleepers / Cross-ties */}
        {sleepers.map((sx, idx) => (
          <Rect
            key={idx}
            x={sx}
            y={trackY - 11}
            width="4.5"
            height="22"
            rx="1"
            fill="#343A40"
            opacity={0.35}
          />
        ))}

        {/* Top & Bottom Continuous Steel Rails */}
        <Line x1="0" y1={trackY - 6} x2="100%" y2={trackY - 6} stroke="url(#railGrad)" strokeWidth="2.5" />
        <Line x1="0" y1={trackY + 6} x2="100%" y2={trackY + 6} stroke="url(#railGrad)" strokeWidth="2.5" />

        {/* Minimalist Signals along the track */}
        <Circle cx="120" cy={trackY - 26} r="4" fill={Colors.forestEmerald} opacity={0.7} />
        <Line x1="120" y1={trackY - 22} x2="120" y2={trackY - 8} stroke="#6C757D" strokeWidth="1.5" opacity={0.5} />

        <Circle cx={screenWidth * 0.55} cy={trackY - 26} r="4" fill={Colors.forestPrimary} opacity={0.7} />
        <Line x1={screenWidth * 0.55} y1={trackY - 22} x2={screenWidth * 0.55} y2={trackY - 8} stroke="#6C757D" strokeWidth="1.5" opacity={0.5} />

        <Circle cx={screenWidth - 140} cy={trackY - 26} r="4" fill={Colors.crimsonPrimary} opacity={0.8} />
        <Line x1={screenWidth - 140} y1={trackY - 22} x2={screenWidth - 140} y2={trackY - 8} stroke="#6C757D" strokeWidth="1.5" opacity={0.5} />
      </Svg>

      {/* 2. Moving Train Shade / Silhouette */}
      <Animated.View
        style={[
          styles.trainWrapper,
          {
            top: trackY - 32,
            transform: [{ translateX }]
          }
        ]}
      >
        <Svg width={TRAIN_LENGTH + 60} height="42" viewBox={`0 0 ${TRAIN_LENGTH + 60} 42`}>
          <Defs>
            <LinearGradient id="trainShadeBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#111418" stopOpacity="0.85" />
              <Stop offset="80%" stopColor="#181C21" stopOpacity="0.88" />
              <Stop offset="100%" stopColor="#111418" stopOpacity="0.92" />
            </LinearGradient>
            <LinearGradient id="headlightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FEF08A" stopOpacity="0.85" />
              <Stop offset="50%" stopColor="#FEF08A" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#FEF08A" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Headlight beam projection at the front (pointing right) */}
          <Path
            d={`M ${TRAIN_LENGTH - 4} 24 L ${TRAIN_LENGTH + 54} 16 L ${TRAIN_LENGTH + 54} 34 Z`}
            fill="url(#headlightGlow)"
          />

          {/* Coach 1 (Rear Coach) */}
          <Rect x="0" y="10" width="100" height="22" rx="4" fill="url(#trainShadeBody)" />
          <Rect x="0" y="27" width="100" height="3" fill={Colors.forestPrimary} opacity={0.9} />
          {/* Crimson Red Rear Marker Light */}
          <Circle cx="4" cy="18" r="2.5" fill={Colors.crimsonBright} />
          {/* Windows */}
          <Rect x="16" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="36" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="56" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="76" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          {/* Wheels */}
          <Circle cx="20" cy="32" r="3.5" fill="#212529" />
          <Circle cx="80" cy="32" r="3.5" fill="#212529" />

          {/* Coupler */}
          <Line x1="100" y1="21" x2="108" y2="21" stroke="#343A40" strokeWidth="2.5" />

          {/* Coach 2 */}
          <Rect x="108" y="10" width="115" height="22" rx="4" fill="url(#trainShadeBody)" />
          <Rect x="108" y="27" width="115" height="3" fill={Colors.forestPrimary} opacity={0.9} />
          {/* Windows */}
          <Rect x="120" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="140" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="160" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="180" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="200" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          {/* Wheels */}
          <Circle cx="128" cy="32" r="3.5" fill="#212529" />
          <Circle cx="202" cy="32" r="3.5" fill="#212529" />

          {/* Coupler */}
          <Line x1="223" y1="21" x2="231" y2="21" stroke="#343A40" strokeWidth="2.5" />

          {/* Coach 3 (With Pantograph Roof) */}
          <Rect x="231" y="10" width="115" height="22" rx="4" fill="url(#trainShadeBody)" />
          <Rect x="231" y="27" width="115" height="3" fill={Colors.forestPrimary} opacity={0.9} />
          {/* Pantograph */}
          <Path d="M 270 10 L 280 4 L 290 10 M 275 6 L 285 6" stroke="#495057" strokeWidth="1.5" fill="none" />
          {/* Windows */}
          <Rect x="243" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="263" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="283" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="303" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="323" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          {/* Wheels */}
          <Circle cx="251" cy="32" r="3.5" fill="#212529" />
          <Circle cx="325" cy="32" r="3.5" fill="#212529" />

          {/* Coupler */}
          <Line x1="346" y1="21" x2="354" y2="21" stroke="#343A40" strokeWidth="2.5" />

          {/* Coach 4 (Executive Coach) */}
          <Rect x="354" y="10" width="115" height="22" rx="4" fill="url(#trainShadeBody)" />
          <Rect x="354" y="27" width="115" height="3" fill={Colors.forestPrimary} opacity={0.9} />
          {/* Windows */}
          <Rect x="366" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="386" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="406" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="426" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="446" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          {/* Wheels */}
          <Circle cx="374" cy="32" r="3.5" fill="#212529" />
          <Circle cx="448" cy="32" r="3.5" fill="#212529" />

          {/* Coupler */}
          <Line x1="469" y1="21" x2="477" y2="21" stroke="#343A40" strokeWidth="2.5" />

          {/* Coach 5: Aerodynamic Front Locomotive (Vande Bharat Bullet Nose) */}
          <Path
            d={`
              M 477 10
              L 560 10
              Q 595 10, 608 20
              Q 616 26, 616 32
              L 477 32
              Z
            `}
            fill="url(#trainShadeBody)"
          />
          {/* Forest Green Body Stripe */}
          <Path
            d="M 477 27 L 595 27 Q 610 27, 614 30 L 477 30 Z"
            fill={Colors.forestPrimary}
            opacity={0.95}
          />
          {/* Aerodynamic Cockpit Windshield */}
          <Path
            d="M 576 13 L 598 19 L 576 19 Z"
            fill="#E0F2FE"
            opacity={0.7}
          />
          {/* Passenger Windows in Locomotive */}
          <Rect x="490" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="510" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          <Rect x="530" y="14" width="14" height="6" rx="1" fill="#FFFFFF" opacity={0.45} />
          {/* Dual Headlight Bulbs at Nose */}
          <Circle cx="609" cy="24" r="2.5" fill="#FEF08A" />
          <Circle cx="609" cy="27" r="1.5" fill="#FFFFFF" />
          {/* Wheels */}
          <Circle cx="498" cy="32" r="3.5" fill="#212529" />
          <Circle cx="570" cy="32" r="3.5" fill="#212529" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent'
  },
  trainWrapper: {
    position: 'absolute',
    left: 0
  }
});

