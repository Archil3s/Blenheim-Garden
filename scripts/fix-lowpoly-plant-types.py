from pathlib import Path

path = Path("components/garden-lowpoly-plants.ts")
text = path.read_text()
text = text.replace(
    "  radius = 0.018,\n  color = C.stemDark,",
    "  radius: number = 0.018,\n  color: number = C.stemDark,",
    1,
)
text = text.replace(
    "function flower(root: THREE.Object3D, position: THREE.Vector3, color = C.flowerYellow, size = 0.028) {",
    "function flower(root: THREE.Object3D, position: THREE.Vector3, color: number = C.flowerYellow, size: number = 0.028) {",
    1,
)
path.write_text(text)
