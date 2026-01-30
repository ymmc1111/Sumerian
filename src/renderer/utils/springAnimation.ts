export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  velocity: number;
}

export interface SpringState {
  value: number;
  velocity: number;
}

export interface AnimatedValue {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Default spring config per spec: stiffness 400, damping 28
export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  stiffness: 400,
  damping: 28,
  mass: 1,
  velocity: 0,
};

// Snappy spring for quick snaps
export const SNAP_SPRING_CONFIG: SpringConfig = {
  stiffness: 500,
  damping: 30,
  mass: 1,
  velocity: 0,
};

// Gentle spring for return-to-origin
export const RETURN_SPRING_CONFIG: SpringConfig = {
  stiffness: 300,
  damping: 26,
  mass: 1,
  velocity: 0,
};

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Calculate spring physics for a single step
export function springStep(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  deltaTime: number
): SpringState {
  const { stiffness, damping, mass } = config;
  
  // Spring force: F = -k * x
  const displacement = current - target;
  const springForce = -stiffness * displacement;
  
  // Damping force: F = -c * v
  const dampingForce = -damping * velocity;
  
  // Acceleration: a = F / m
  const acceleration = (springForce + dampingForce) / mass;
  
  // Update velocity and position
  const newVelocity = velocity + acceleration * deltaTime;
  const newValue = current + newVelocity * deltaTime;
  
  return {
    value: newValue,
    velocity: newVelocity,
  };
}

// Check if spring animation is at rest
export function isSpringAtRest(
  current: number,
  target: number,
  velocity: number,
  threshold = 0.01
): boolean {
  return Math.abs(current - target) < threshold && Math.abs(velocity) < threshold;
}

// Animate a value using spring physics
export function animateSpring(
  from: number,
  to: number,
  config: SpringConfig,
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  // If reduced motion, jump directly
  if (prefersReducedMotion()) {
    onUpdate(to);
    onComplete?.();
    return () => {};
  }

  let current = from;
  let velocity = config.velocity;
  let lastTime = performance.now();
  let animationId: number;

  const tick = (now: number) => {
    const deltaTime = Math.min((now - lastTime) / 1000, 0.064); // Cap at ~16fps minimum
    lastTime = now;

    const state = springStep(current, to, velocity, config, deltaTime);
    current = state.value;
    velocity = state.velocity;

    onUpdate(current);

    if (isSpringAtRest(current, to, velocity)) {
      onUpdate(to); // Snap to final value
      onComplete?.();
    } else {
      animationId = requestAnimationFrame(tick);
    }
  };

  animationId = requestAnimationFrame(tick);

  // Return cancel function
  return () => {
    cancelAnimationFrame(animationId);
  };
}

// Animate multiple values simultaneously
export function animateSpringMultiple(
  from: AnimatedValue,
  to: AnimatedValue,
  config: SpringConfig,
  onUpdate: (value: AnimatedValue) => void,
  onComplete?: () => void
): () => void {
  if (prefersReducedMotion()) {
    onUpdate(to);
    onComplete?.();
    return () => {};
  }

  const state = {
    x: { value: from.x, velocity: 0 },
    y: { value: from.y, velocity: 0 },
    width: { value: from.width, velocity: 0 },
    height: { value: from.height, velocity: 0 },
  };

  let lastTime = performance.now();
  let animationId: number;

  const tick = (now: number) => {
    const deltaTime = Math.min((now - lastTime) / 1000, 0.064);
    lastTime = now;

    // Update each property
    const xState = springStep(state.x.value, to.x, state.x.velocity, config, deltaTime);
    const yState = springStep(state.y.value, to.y, state.y.velocity, config, deltaTime);
    const widthState = springStep(state.width.value, to.width, state.width.velocity, config, deltaTime);
    const heightState = springStep(state.height.value, to.height, state.height.velocity, config, deltaTime);

    state.x = { value: xState.value, velocity: xState.velocity };
    state.y = { value: yState.value, velocity: yState.velocity };
    state.width = { value: widthState.value, velocity: widthState.velocity };
    state.height = { value: heightState.value, velocity: heightState.velocity };

    onUpdate({
      x: state.x.value,
      y: state.y.value,
      width: state.width.value,
      height: state.height.value,
    });

    // Check if all at rest
    const allAtRest =
      isSpringAtRest(state.x.value, to.x, state.x.velocity) &&
      isSpringAtRest(state.y.value, to.y, state.y.velocity) &&
      isSpringAtRest(state.width.value, to.width, state.width.velocity) &&
      isSpringAtRest(state.height.value, to.height, state.height.velocity);

    if (allAtRest) {
      onUpdate(to);
      onComplete?.();
    } else {
      animationId = requestAnimationFrame(tick);
    }
  };

  animationId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(animationId);
  };
}

// Hook-friendly spring animation
export function createSpringAnimation(config: SpringConfig = DEFAULT_SPRING_CONFIG) {
  let cancelFn: (() => void) | null = null;

  return {
    animate: (
      from: number,
      to: number,
      onUpdate: (value: number) => void,
      onComplete?: () => void
    ) => {
      cancelFn?.();
      cancelFn = animateSpring(from, to, config, onUpdate, onComplete);
    },
    
    animateMultiple: (
      from: AnimatedValue,
      to: AnimatedValue,
      onUpdate: (value: AnimatedValue) => void,
      onComplete?: () => void
    ) => {
      cancelFn?.();
      cancelFn = animateSpringMultiple(from, to, config, onUpdate, onComplete);
    },
    
    cancel: () => {
      cancelFn?.();
      cancelFn = null;
    },
  };
}
