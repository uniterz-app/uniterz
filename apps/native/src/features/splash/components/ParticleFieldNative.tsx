/**
 * 放射状パーティクル — 画面奥から手前へ。中心ほど遅く外側ほど速い。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { UNITERZ_LOGO_SPLASH_SPACE } from "../../../../../../lib/units/uniterzLogoSplash";

const PARTICLE_COUNT = 22;
/** パーティクル区間: 0.3s〜0.9s / 2300ms */
const T0 = 0.3 / 2.3;
const T1 = 0.9 / 2.3;

type Particle = {
  angle: number;
  speed: number;
  size: number;
  startDelay: number;
  rotation: number;
  isRect: boolean;
};

type Props = {
  progress: SharedValue<number>;
  width: number;
  height: number;
  staticPose: boolean;
};

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const r0 = seeded(i * 1.7);
    const r1 = seeded(i * 3.3 + 2);
    const r2 = seeded(i * 5.1 + 4);
    const r3 = seeded(i * 7.9 + 6);
    const r4 = seeded(i * 11.3 + 8);
    return {
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + r0 * 0.35,
      // 外側寄りほど速く（speed 大きい）
      speed: 0.45 + r1 * 0.9,
      size: 1 + r2 * 2.2,
      startDelay: r3 * 0.12,
      rotation: (r4 - 0.5) * 80,
      isRect: r2 > 0.4,
    };
  });
}

function ParticleDot({
  particle,
  progress,
  maxDist,
  staticPose,
}: {
  particle: Particle;
  progress: SharedValue<number>;
  maxDist: number;
  staticPose: boolean;
}) {
  const style = useAnimatedStyle(() => {
    if (staticPose) {
      // 微量だけ残す
      const d = maxDist * 0.35 * particle.speed;
      return {
        opacity: 0.12,
        transform: [
          {
            translateX: Math.cos(particle.angle) * d * 0.4,
          },
          {
            translateY: Math.sin(particle.angle) * d * 0.4,
          },
          { scale: 0.7 },
          { rotate: `${particle.rotation}deg` },
        ],
      };
    }
    const t = progress.value;
    const local = interpolate(
      t,
      [T0 + particle.startDelay * 0.15, T1],
      [0, 1],
      "clamp"
    );
    // 外側ほど速く見えるよう ease-in 風
    const eased = local * local * (0.55 + particle.speed * 0.55);
    const dist = maxDist * eased * particle.speed;
    const opacity = interpolate(
      local,
      [0, 0.12, 0.55, 1],
      [0, 0.75, 0.45, 0]
    );
    const scale = interpolate(local, [0, 0.4, 1], [0.35, 1, 1.4]);
    return {
      opacity,
      transform: [
        { translateX: Math.cos(particle.angle) * dist },
        { translateY: Math.sin(particle.angle) * dist },
        { scale },
        { rotate: `${particle.rotation + local * 40}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        particle.isRect
          ? {
              width: particle.size * 2.2,
              height: particle.size * 0.7,
              borderRadius: 1,
            }
          : {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size,
            },
        style,
      ]}
    />
  );
}

export default function ParticleFieldNative({
  progress,
  width,
  height,
  staticPose,
}: Props) {
  const particles = useMemo(() => buildParticles(), []);
  const maxDist = Math.hypot(width, height) * 0.55;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.origin}>
        {particles.map((p, i) => (
          <ParticleDot
            key={i}
            particle={p}
            progress={progress}
            maxDist={maxDist}
            staticPose={staticPose}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.accentBright,
  },
});
