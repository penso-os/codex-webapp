export function createAuditEvidenceHook(handler = null) {
  return typeof handler === "function" ? handler : null;
}

export function emitAuditEvidence(hook, event) {
  if (!hook) return;
  const emit = () => {
    try {
      hook(event);
    } catch {
    }
  };
  if (typeof queueMicrotask === "function") {
    queueMicrotask(emit);
  } else {
    setImmediate(emit);
  }
}
