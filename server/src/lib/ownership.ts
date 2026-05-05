export type OwnershipKind = "task" | "project" | "label";

// Sole authority for per-resource access checks. All routes/services
// must call this rather than filtering with WHERE user_id = $1 ad-hoc.
export async function requireOwnership(
  _userId: number,
  kind: OwnershipKind,
  _id: number,
): Promise<void> {
  throw new Error(`requireOwnership("${kind}") not implemented yet`);
}
