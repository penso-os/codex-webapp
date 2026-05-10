export function createProjectionManifest(assetSource) {
  return {
    engine: "codex-app-renderer-static",
    fileCount: assetSource.fileCount,
    sourceAsar: assetSource.sourceAsar,
    root: assetSource.root,
  };
}
