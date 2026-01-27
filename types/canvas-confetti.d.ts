declare module "canvas-confetti" {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: ("square" | "circle" | "star")[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface ConfettiFunction {
    (options?: Options): Promise<null>;
    reset: () => void;
    create: (
      canvas: HTMLCanvasElement,
      options?: { resize?: boolean; useWorker?: boolean }
    ) => ConfettiFunction;
    shapeFromPath: (options: { path: string; matrix?: number[] }) => unknown;
    shapeFromText: (options: { text: string; scalar?: number }) => unknown;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}
