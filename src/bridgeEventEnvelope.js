export function parseBridgeFrame(data) {
  try {
    const frame = JSON.parse(Buffer.isBuffer(data) ? data.toString("utf8") : String(data));
    if (!frame || typeof frame !== "object") return null;
    return {
      id: frame.id,
      kind: frame.kind,
      payload: frame.payload,
    };
  } catch {
    return null;
  }
}

export function bridgeEvent(payload) {
  return { type: "event", payload };
}

export function bridgeResponse(id, result) {
  return { id, ok: true, result };
}

export function bridgeErrorResponse(id, error) {
  return { id, ok: false, error: String(error?.message ?? error) };
}

export function serializeBridgeMessage(message) {
  return JSON.stringify(message);
}
