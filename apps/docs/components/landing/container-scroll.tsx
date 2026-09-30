"use client";

// From 21st.dev manuarora700/container-scroll-animation (id 1081, Aceternity UI), via the user's Logos Kit docs:
// the product panel tilts flat as you scroll. Akashi tokens; no tilt with prefers-reduced-motion.
import { type MotionValue, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

const MOBILE_MAX_PX = 768;
const TILT_DEG = 20;
const SCALE_DESKTOP_FROM = 1.04;
const SCALE_MOBILE_FROM = 0.94;
const SCALE_DESKTOP: [number, number] = [SCALE_DESKTOP_FROM, 1];
const SCALE_MOBILE: [number, number] = [SCALE_MOBILE_FROM, 1];
const LIFT_PX = -100;
const PERSPECTIVE = "1000px";

export function ContainerScroll({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const reduce = useReducedMotion();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= MOBILE_MAX_PX);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [TILT_DEG, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], mobile ? SCALE_MOBILE : SCALE_DESKTOP);
  const translate = useTransform(scrollYProgress, [0, 1], reduce || mobile ? [0, 0] : [0, LIFT_PX]);

  return (
    <div ref={ref} className="relative flex items-start justify-center px-2 pt-10 pb-6 md:h-[70rem] md:items-center md:p-16">
      <div className="relative w-full py-6 md:py-20" style={{ perspective: PERSPECTIVE }}>
        <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
          {title}
        </motion.div>
        <Frame rotate={rotate} scale={scale}>
          {children}
        </Frame>
      </div>
    </div>
  );
}

function Frame({ rotate, scale, children }: { rotate: MotionValue<number>; scale: MotionValue<number>; children: React.ReactNode }) {
  return (
    <motion.div
      style={{ rotateX: rotate, scale, boxShadow: "var(--shadow-receipt)" }}
      className="mx-auto mt-10 w-full max-w-5xl rounded-[28px] border border-fd-border bg-fd-secondary p-2 md:mt-14 md:p-3"
    >
      <div className="h-full w-full overflow-hidden rounded-[20px] border border-fd-border bg-fd-card">{children}</div>
    </motion.div>
  );
}
