"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { PageAnimation } from "@/lib/themeAnimations";

/**
 * Theme background animation (--page-anim), rendered behind the profile card.
 * Pure CSS keyframes (.tba-* in app/globals.css) that animate only transform/opacity.
 * - ≤30 animated elements; elements after the 12th are hidden at ≤640px (.tba-x).
 * - Paused while the tab is hidden (.anim-paused) and under prefers-reduced-motion (static frame).
 * - `mini` (theme thumbnails) renders a lighter version; `playing={false}` freezes it.
 */
interface Props {
  name: PageAnimation | string;
  mini?: boolean;
  playing?: boolean;
  className?: string;
}

/** Deterministic 0..1 value (stable between server and client renders). */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const MOBILE_LIMIT = 12;
const MINI_LIMIT = 10;

type Piece = { key: string; className: string; style: CSSProperties; children?: ReactNode };

function pieces(name: string): Piece[] {
  const make = (count: number, build: (i: number) => Omit<Piece, "key">) =>
    Array.from({ length: count }, (_, i) => ({ key: `${name}-${i}`, ...build(i) }));

  switch (name) {
    case "diyas":
      return make(12, (i) => {
        const size = 6 + rand(i, 1) * 4;
        return {
          className: "tba-diya",
          style: {
            left: `${4 + rand(i, 2) * 92}%`,
            width: size,
            height: size,
            animation: `tba-rise ${16 + rand(i, 3) * 10}s linear ${-rand(i, 4) * 26}s infinite, tba-flicker ${1.8 + rand(i, 5) * 1.4}s ease-in-out ${-rand(i, 6) * 2}s infinite alternate`,
          },
        };
      });
    case "gulal": {
      const colours = ["#F472B6", "#FACC15", "#22D3EE", "#A3E635", "#C084FC", "#FB923C"];
      return make(6, (i) => ({
        className: "tba-blob",
        style: {
          background: colours[i],
          left: `${[-10, 55, 10, 60, -5, 35][i]}%`,
          top: `${[-10, -5, 40, 45, 75, 70][i]}%`,
          animation: `tba-drift 40s ease-in-out ${-i * 7}s infinite alternate`,
        },
      }));
    }
    case "rain":
      return make(25, (i) => ({
        className: "tba-drop",
        style: {
          left: `${rand(i, 1) * 120}%`,
          animation: `tba-fall ${[0.7, 1, 1.4][i % 3]}s linear ${-rand(i, 2) * 1.4}s infinite`,
        },
      }));
    case "kites": {
      const colours = ["#F43F5E", "#FACC15", "#22C55E", "#3B82F6", "#A855F7", "#F97316"];
      return make(6, (i) => ({
        className: "tba-kite",
        style: {
          color: colours[i],
          background: colours[i],
          left: `${[10, 78, 30, 62, 88, 4][i]}%`,
          top: `${[18, 26, 48, 60, 72, 80][i]}%`,
          animation: `tba-kite ${14 + rand(i, 1) * 8}s ease-in-out ${-rand(i, 2) * 10}s infinite alternate`,
        },
      }));
    }
    case "stars":
      return [
        ...make(29, (i) => ({
          className: "tba-star",
          style: {
            left: `${rand(i, 1) * 100}%`,
            top: `${rand(i, 2) * 100}%`,
            animation: `tba-twinkle ${2 + rand(i, 3) * 3}s ease-in-out ${-rand(i, 4) * 5}s infinite alternate`,
          },
        })),
        { key: "stars-shoot", className: "tba-shoot", style: { animation: "tba-shoot 8s linear infinite" } },
      ];
    case "waves":
      return make(3, (i) => ({
        className: "tba-wave",
        style: {
          bottom: `${i * -3}cqh`,
          height: `${22 - i * 5}cqh`,
          opacity: [0.18, 0.24, 0.32][i],
          animation: `tba-wave ${[18, 12, 8][i]}s linear infinite`,
        },
        children: (
          <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0 50 Q150 5 300 50 T600 50 T900 50 T1200 50 V100 H0 Z" fill="#FFFFFF" />
          </svg>
        ),
      }));
    case "aurora": {
      const colours = ["#7C3AED", "#3B82F6", "#14B8A6", "#EC4899"];
      return make(4, (i) => ({
        className: "tba-blob tba-blob-aurora",
        style: {
          background: colours[i],
          left: `${[-15, 50, 5, 55][i]}%`,
          top: `${[-15, 0, 50, 55][i]}%`,
          animation: `tba-drift ${30 + i * 5}s ease-in-out ${-i * 9}s infinite alternate`,
        },
      }));
    }
    case "confetti": {
      const colours = ["#7A2253", "#F5B8D4", "#FACC15", "#22D3EE", "#A3E635", "#BE185D"];
      return make(25, (i) => ({
        className: "tba-confetti",
        style: {
          background: colours[i % colours.length],
          left: `${rand(i, 1) * 100}%`,
          animation: `tba-confetti ${7 + rand(i, 2) * 6}s linear ${-rand(i, 3) * 13}s infinite`,
        },
      }));
    }
    case "fireflies":
      return make(15, (i) => ({
        className: "tba-fly",
        style: {
          left: `${rand(i, 1) * 96}%`,
          top: `${rand(i, 2) * 96}%`,
          animation: `tba-wander ${16 + rand(i, 3) * 10}s ease-in-out ${-rand(i, 4) * 20}s infinite alternate, tba-pulse ${2.5 + rand(i, 5) * 1.5}s ease-in-out ${-rand(i, 6) * 3}s infinite alternate`,
        },
      }));
    case "rangoli":
      return make(2, (i) => ({
        className: "tba-rangoli",
        style: {
          ...(i === 0 ? { left: "-18cqw", top: "-14cqh" } : { right: "-18cqw", bottom: "-14cqh" }),
          animation: `tba-spin 120s linear infinite${i === 1 ? " reverse" : ""}`,
        },
        children: <Mandala />,
      }));
    default:
      return [];
  }
}

/** Rangoli/mandala outline (stroked, coloured by the parent's currentColor). */
function Mandala() {
  return (
    <svg viewBox="-100 -100 200 200" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle r="96" />
      <circle r="70" />
      <circle r="18" />
      {Array.from({ length: 12 }, (_, k) => (
        <ellipse key={`o${k}`} cx="0" cy="-58" rx="14" ry="34" transform={`rotate(${k * 30})`} />
      ))}
      {Array.from({ length: 8 }, (_, k) => (
        <ellipse key={`i${k}`} cx="0" cy="-32" rx="9" ry="18" transform={`rotate(${k * 45 + 22.5})`} />
      ))}
      {Array.from({ length: 24 }, (_, k) => (
        <circle key={`d${k}`} r="2.4" cx="0" cy="-84" transform={`rotate(${k * 15})`} />
      ))}
    </svg>
  );
}

export function ThemeBackgroundAnim({ name, mini = false, playing = true, className = "" }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const update = () => setHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  if (!name || name === "none") return null;
  const all = pieces(name);
  const list = mini ? all.slice(0, MINI_LIMIT) : all;

  return (
    <div
      aria-hidden="true"
      className={`tba tba-anim-${name} ${mini ? "tba-mini" : ""} ${hidden || !playing ? "anim-paused" : ""} ${className}`}
    >
      {list.map((piece, index) => (
        <span key={piece.key} className={`${piece.className} ${index >= MOBILE_LIMIT ? "tba-x" : ""}`} style={piece.style}>
          {piece.children}
        </span>
      ))}
    </div>
  );
}
