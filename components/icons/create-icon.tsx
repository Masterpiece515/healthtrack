import type { FC, ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

export type AppIcon = FC<IconProps>;

export function createIcon(
  path: ReactNode,
  options?: { viewBox?: string; stroke?: boolean },
): AppIcon {
  const { viewBox = '0 0 24 24', stroke = false } = options ?? {};

  function Icon({ className, style, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        fill={stroke ? 'none' : 'currentColor'}
        stroke={stroke ? 'currentColor' : undefined}
        strokeWidth={stroke ? 2 : undefined}
        strokeLinecap={stroke ? 'round' : undefined}
        strokeLinejoin={stroke ? 'round' : undefined}
        className={className}
        style={style}
        aria-hidden
        {...props}
      >
        {path}
      </svg>
    );
  }

  Icon.displayName = 'AppIcon';
  return Icon;
}
