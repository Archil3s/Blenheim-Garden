export const GARDEN_3D_RENDERING = {
  detailedPlantCap: 14,
  compactPlantCap: 7,
  detailedPixelRatioCap: 1.35,
  detailedCamera: { fov: 36, x: 7.7, y: 7.5, z: 10.7 },
  compactCamera: { fov: 43, x: 7.2, y: 8.1, z: 10.6 },
  orbit: { minDistance: 3.6, maxDistance: 25, targetY: 0.3 },
  soilSurfaceY: 0.205,
  contactShadows: true,
  trellisNetting: true,
  naturalPlantVariation: true,
} as const;
