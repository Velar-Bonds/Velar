/**
 * Layout primitives — Stack (vertical), Cluster (horizontal wrap), Grid.
 * Espaciados en múltiplos de 4px vía la escala de Tailwind (gap-*).
 */
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 8;
const GAP: Record<Gap, string> = {
  1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5', 6: 'gap-6', 8: 'gap-8',
};

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Gap;
  align?: 'start' | 'center' | 'end' | 'stretch';
}
export function Stack({ gap = 4, align = 'stretch', className, ...rest }: StackProps) {
  const alignCls = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }[align];
  return <div className={cn('flex flex-col', GAP[gap], alignCls, className)} {...rest} />;
}

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Gap;
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
}
export function Cluster({ gap = 2, align = 'center', justify = 'start', className, ...rest }: ClusterProps) {
  const alignCls = { start: 'items-start', center: 'items-center', end: 'items-end', baseline: 'items-baseline' }[align];
  const justCls = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' }[justify];
  return <div className={cn('flex flex-wrap', GAP[gap], alignCls, justCls, className)} {...rest} />;
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Ancho mínimo de columna para auto-fit responsivo (px). */
  min?: number;
  gap?: Gap;
}
export function Grid({ min = 240, gap = 4, className, style, ...rest }: GridProps) {
  return (
    <div
      className={cn('grid', GAP[gap], className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, ...style }}
      {...rest}
    />
  );
}
