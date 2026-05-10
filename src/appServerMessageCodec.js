export function parseAppServerMessage(line) {
  try {
    const message = JSON.parse(line);
    return message && typeof message === "object" ? message : null;
  } catch {
    return null;
  }
}

export function serializeAppServerMessage(message) {
  return `${JSON.stringify(message)}\n`;
}
