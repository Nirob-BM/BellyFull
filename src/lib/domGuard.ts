// React assumes it owns every DOM node it created. When something outside React
// — a browser extension, a translation widget, or an in-page inspector — moves
// or deletes one of those nodes first, React's cleanup throws
//   NotFoundError: Failed to execute 'removeChild' on 'Node':
//   The node to be removed is not a child of this node.
// and, because the throw happens while React is committing changes, the whole
// page can go blank.
//
// These guards make that cleanup tolerant: if the node React wants to remove is
// already somewhere else (or gone), it is detached from wherever it actually
// lives and the operation reports success, so one stray node can never take the
// site down. Install once, before React mounts.

type RemoveChild = <T extends Node>(this: Node, child: T) => T;
type InsertBefore = <T extends Node>(
  this: Node,
  newNode: T,
  referenceNode: Node | null,
) => T;
type AppendChild = <T extends Node>(this: Node, newChild: T) => T;

const GUARD_FLAG = "__bellyfullDomGuard";

export function installDomGuard(): void {
  if (typeof window === "undefined" || typeof Node === "undefined") return;
  const flagHost = window as unknown as Record<string, unknown>;
  if (flagHost[GUARD_FLAG]) return;
  flagHost[GUARD_FLAG] = true;

  const nativeRemoveChild = Node.prototype.removeChild as unknown as RemoveChild;
  const nativeInsertBefore = Node.prototype.insertBefore as unknown as InsertBefore;
  const nativeAppendChild = Node.prototype.appendChild as unknown as AppendChild;

  const removeChild: RemoveChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      // Already moved or detached elsewhere — honour the intent, don't throw.
      if (child.parentNode) nativeRemoveChild.call(child.parentNode, child);
      return child;
    }
    return nativeRemoveChild.call(this, child);
  };

  const insertBefore: InsertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode !== null && referenceNode.parentNode !== this) {
      // The anchor node moved away; appending keeps the new node in place.
      return nativeAppendChild.call(this, newNode);
    }
    return nativeInsertBefore.call(this, newNode, referenceNode);
  };

  Node.prototype.removeChild = removeChild as unknown as typeof Node.prototype.removeChild;
  Node.prototype.insertBefore = insertBefore as unknown as typeof Node.prototype.insertBefore;
}
