import React, { useMemo } from 'react';
import type { Person } from '../types';

const SEGMENT_COLORS = ['#0D1117', '#121821', '#171E29'];
const GOLD = '#D4AF37';
const GOLD_LIGHT = '#F2D675';
const TEXT_COLOR = '#F5F2EA';

// ─── SVG path helpers ────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  // 0° = 12 o'clock (top), clockwise positive
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

// ─── Text fitting ─────────────────────────────────────────────────────────────
function computeFontSize(name: string, N: number, radius: number): number {
  // Available arc length at ~75% radius is roughly (2π * 0.75r / N)
  // Characters need ~0.6em width. We cap at 18, floor at 9.
  const arcLen = (2 * Math.PI * radius * 0.72) / Math.max(N, 1);
  const charCount = name.length;
  const sizeByArc = (arcLen / charCount) * 1.05;
  return Math.min(18, Math.max(9, sizeByArc));
}

// ─── Component ───────────────────────────────────────────────────────────────
interface WheelProps {
  people: Person[]; // only unselected people
  rotation: number; // in degrees, CSS applied to SVG group
  size: number;     // viewBox size (square)
}

export const Wheel: React.FC<WheelProps> = ({ people, rotation, size }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const hubR = size * 0.065;
  const N = people.length;

  const segments = useMemo(() => {
    if (N === 0) return [];
    if (N === 1) {
      // Full circle for single person
      return [{ person: people[0], color: SEGMENT_COLORS[0], start: 0, end: 360 }];
    }
    const seg = 360 / N;
    return people.map((p, i) => ({
      person: p,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      start: i * seg,
      end: (i + 1) * seg,
    }));
  }, [people, N]);

  if (N === 0) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        {/* Empty ring */}
        <circle
          cx={cx} cy={cy} r={outerR}
          fill="none"
          stroke={GOLD}
          strokeWidth={4}
          opacity={0.35}
        />
        <circle
          cx={cx} cy={cy} r={outerR - 20}
          fill="none"
          stroke={GOLD}
          strokeWidth={1}
          opacity={0.15}
        />
        <circle cx={cx} cy={cy} r={hubR} fill={GOLD} opacity={0.3} />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      style={{ overflow: 'visible', filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.7))' }}
    >
      <defs>
        {/* Gold glow filter */}
        <filter id="gold-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="hub-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rotating group */}
      <g
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Segments */}
        {N === 1 ? (
          <>
            <circle cx={cx} cy={cy} r={outerR} fill={SEGMENT_COLORS[0]} />
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={0.6} />
          </>
        ) : (
          segments.map((seg) => (
            <g key={seg.person.id}>
              <path
                d={segmentPath(cx, cy, outerR, seg.start, seg.end)}
                fill={seg.color}
                stroke={GOLD}
                strokeWidth={1.5}
                strokeOpacity={0.45}
              />
              {/* Name text along arc radius */}
              <SegmentLabel
                cx={cx}
                cy={cy}
                outerR={outerR}
                startAngle={seg.start}
                endAngle={seg.end}
                name={seg.person.name}
                N={N}
              />
            </g>
          ))
        )}

        {/* Single-person center label */}
        {N === 1 && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={TEXT_COLOR}
            fontSize={computeFontSize(people[0].name, 1, outerR)}
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            {people[0].name}
          </text>
        )}

        {/* Gold outer ring */}
        <circle
          cx={cx} cy={cy} r={outerR}
          fill="none"
          stroke={GOLD}
          strokeWidth={4}
          filter="url(#gold-glow)"
        />
        {/* Inner separator ring */}
        <circle
          cx={cx} cy={cy} r={outerR - 28}
          fill="none"
          stroke={GOLD}
          strokeWidth={0.5}
          strokeOpacity={0.2}
        />

        {/* Center hub */}
        <circle
          cx={cx} cy={cy} r={hubR + 4}
          fill="#0D1117"
          stroke={GOLD}
          strokeWidth={2}
        />
        <circle
          cx={cx} cy={cy} r={hubR}
          fill={GOLD}
          filter="url(#hub-glow)"
        />
        <circle
          cx={cx} cy={cy} r={hubR * 0.5}
          fill={GOLD_LIGHT}
        />
      </g>

      {/* Fixed pointer at 12 o'clock — NOT inside the rotating group */}
      <Pointer cx={cx} />
    </svg>
  );
};

// ─── Segment Label ────────────────────────────────────────────────────────────
interface SegmentLabelProps {
  cx: number;
  cy: number;
  outerR: number;
  startAngle: number;
  endAngle: number;
  name: string;
  N: number;
}

const SegmentLabel: React.FC<SegmentLabelProps> = ({
  cx, cy, outerR, startAngle, endAngle, name, N,
}) => {
  const midAngle = (startAngle + endAngle) / 2;
  const fontSize = computeFontSize(name, N, outerR);

  // Text position: 55-75% of radius from center, depending on N
  const textR = outerR * (N <= 3 ? 0.58 : N <= 6 ? 0.62 : 0.68);

  // For radial text: rotate so text reads from center outward
  // SVG angle: 0°=12 o'clock measured clockwise; convert to SVG coord (0°=right)
  const textAngleDeg = midAngle; // clockwise from top

  // For segments on the left half (90°-270°), flip 180° so text doesn't appear upside-down
  const isLeftHalf = textAngleDeg > 90 && textAngleDeg < 270;
  const flipAngle = isLeftHalf ? 180 : 0;

  // Convert to SVG coordinate angle (0° = right for rotate)
  const svgAngle = textAngleDeg - 90 + flipAngle;

  // Position of text center
  const rad = ((textAngleDeg - 90) * Math.PI) / 180;
  const tx = cx + textR * Math.cos(rad);
  const ty = cy + textR * Math.sin(rad);

  // Max width for text (segment arc width at textR)
  const segAngle = endAngle - startAngle;
  const arcWidth = (segAngle / 360) * 2 * Math.PI * textR * 0.88;

  // Split long names for wrapping
  const words = name.split(' ');
  const maxCharsPerLine = Math.max(8, Math.floor(arcWidth / (fontSize * 0.58)));

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const lineHeight = fontSize * 1.25;
  const totalHeight = lines.length * lineHeight;

  return (
    <g transform={`translate(${tx}, ${ty}) rotate(${svgAngle})`}>
      {lines.map((line, li) => (
        <text
          key={li}
          x={0}
          y={-(totalHeight / 2) + li * lineHeight + lineHeight * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={TEXT_COLOR}
          fontSize={fontSize}
          fontFamily="Inter, sans-serif"
          fontWeight="500"
          style={{ userSelect: 'none' }}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// ─── Pointer ────────────────────────────────────────────────────────────────
interface PointerProps {
  cx: number;
}

const Pointer: React.FC<PointerProps> = ({ cx }) => {
  const tipY = 6; // tip of pointer (above wheel)
  const baseY = 38;
  const halfW = 12;

  return (
    <g filter="url(#gold-glow)">
      <polygon
        points={`${cx},${tipY} ${cx - halfW},${baseY} ${cx + halfW},${baseY}`}
        fill={GOLD}
        stroke="#0D1117"
        strokeWidth={1.5}
      />
      <circle cx={cx} cy={baseY} r={5} fill={GOLD} />
    </g>
  );
};
