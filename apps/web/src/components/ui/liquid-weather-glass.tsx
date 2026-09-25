import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from "@/lib/utils";

export interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  expandable?: boolean;
  width?: string;
  height?: string;
  expandedWidth?: string;
  expandedHeight?: string;
  blurIntensity?: 'sm' | 'md' | 'lg' | 'xl';
  shadowIntensity?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: string;
  glowIntensity?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  draggable = true,
  expandable = false,
  width,
  height,
  expandedWidth,
  expandedHeight,
  blurIntensity = 'xl',
  borderRadius = '32px',
  glowIntensity = 'sm',
  shadowIntensity = 'md',
  style,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpansion = (e: React.MouseEvent) => {
    if (!expandable) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('a, button, input, select, textarea')) return;
    setIsExpanded(!isExpanded);
  };

  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const shadowStyles = {
    none: 'inset 0 0 0 0 rgba(255, 255, 255, 0)',
    xs: 'inset 1px 1px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.3)',
    sm: 'inset 2px 2px 2px 0 rgba(255, 255, 255, 0.35), inset -2px -2px 2px 0 rgba(255, 255, 255, 0.35)',
    md: 'inset 3px 3px 3px 0 rgba(255, 255, 255, 0.45), inset -3px -3px 3px 0 rgba(255, 255, 255, 0.45)',
    lg: 'inset 4px 4px 4px 0 rgba(255, 255, 255, 0.5), inset -4px -4px 4px 0 rgba(255, 255, 255, 0.5)',
    xl: 'inset 6px 6px 6px 0 rgba(255, 255, 255, 0.55), inset -6px -6px 6px 0 rgba(255, 255, 255, 0.55)',
  };

  const glowStyles = {
    none: '0 4px 4px rgba(0, 0, 0, 0.05), 0 0 12px rgba(0, 0, 0, 0.05)',
    xs: '0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 16px rgba(255, 255, 255, 0.05)',
    sm: '0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 24px rgba(255, 255, 255, 0.1)',
    md: '0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 32px rgba(255, 255, 255, 0.15)',
    lg: '0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 40px rgba(255, 255, 255, 0.2)',
    xl: '0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 48px rgba(255, 255, 255, 0.25)',
  };

  const containerVariants = expandable
    ? {
        collapsed: {
          width: width || 'auto',
          height: height || 'auto',
          transition: {
            duration: 0.4,
            ease: [0.5, 1.5, 0.5, 1] as [number, number, number, number],
          },
        },
        expanded: {
          width: expandedWidth || 'auto',
          height: expandedHeight || 'auto',
          transition: {
            duration: 0.4,
            ease: [0.5, 1.5, 0.5, 1] as [number, number, number, number],
          },
        },
      }
    : undefined;

  return (
    <>
      {/* Hidden SVG Caustic Filter */}
      <svg className="hidden">
        <defs>
          <filter
            id="glass-blur"
            x="0"
            y="0"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.003 0.007"
              numOctaves={1}
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale={200}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <motion.div
        className={cn(
          `relative ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${expandable ? 'cursor-pointer' : ''}`,
          className
        )}
        style={{
          borderRadius,
          ...(width && !expandable && { width }),
          ...(height && !expandable && { height }),
          ...style,
        }}
        variants={containerVariants}
        animate={expandable ? (isExpanded ? 'expanded' : 'collapsed') : undefined}
        onClick={expandable ? handleToggleExpansion : undefined}
        drag={draggable}
        dragConstraints={draggable ? { left: -300, right: 300, top: -200, bottom: 200 } : undefined}
        dragElastic={draggable ? 0.3 : undefined}
        dragTransition={
          draggable
            ? {
                bounceStiffness: 300,
                bounceDamping: 10,
                power: 0.3,
              }
            : undefined
        }
        whileDrag={draggable ? { scale: 1.02 } : undefined}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        {...props}
      >
        {/* Bend Layer (Backdrop blur with distortion) */}
        <div
          className={`absolute inset-0 ${blurClasses[blurIntensity]} z-0`}
          style={{
            borderRadius,
            filter: 'url(#glass-blur)',
          }}
        />

        {/* Face Layer (Main shadow and glow) */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            borderRadius,
            boxShadow: glowStyles[glowIntensity],
          }}
        />

        {/* Edge Layer (Inner highlights) */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            borderRadius,
            boxShadow: shadowStyles[shadowIntensity],
          }}
        />

        {/* Content */}
        <div className="relative z-30">{children}</div>
      </motion.div>
    </>
  );
};
