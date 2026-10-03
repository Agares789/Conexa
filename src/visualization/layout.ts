import type { NodeId } from '../domain/graph';

export type Point = Readonly<{ x: number; y: number }>;
export type NodePositions = Readonly<Record<NodeId, Point>>;

export function circlePosition(index: number, count: number): Point {
  const angle = (2 * Math.PI * index) / count - Math.PI / 2;
  return { x: 300 + 215 * Math.cos(angle), y: 220 + 155 * Math.sin(angle) };
}

export function clampPosition(point: Point): Point {
  return { x: Math.max(38, Math.min(562, point.x)), y: Math.max(38, Math.min(402, point.y)) };
}
