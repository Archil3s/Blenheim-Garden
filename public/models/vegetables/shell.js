import * as THREE from "three";
// Matching surfaces keep curled leaves closed without coarse undersides cutting through the top.
export function addLeafShell(mesh, rows, columns, thickness = .00045) {
    const source = mesh.geometry, p = source.getAttribute("position"), n = source.getAttribute("normal");
    const uv = source.getAttribute("uv"), color = source.getAttribute("color");
    const positions = Array.from(p.array), uvs = Array.from(uv.array), colors = [];
    for (let i = 0; i < color.count; i++)
        colors.push(color.getX(i), color.getY(i), color.getZ(i));
    const indices = Array.from(source.index.array);
    const vertex = (i) => {
        const index = positions.length / 3;
        positions.push(p.getX(i) - n.getX(i) * thickness, p.getY(i) - n.getY(i) * thickness, p.getZ(i) - n.getZ(i) * thickness);
        uvs.push(uv.getX(i), uv.getY(i));
        colors.push(Math.min(1, color.getX(i) * 1.1), Math.min(1, color.getY(i) * 1.06), Math.min(1, color.getZ(i) * 1.17));
        return index;
    };
    const rowIds = Array.from({ length: rows + 1 }, (_, i) => i);
    const columnIds = Array.from({ length: columns + 1 }, (_, i) => i);
    const lower = rowIds.map(row => columnIds.map(col => vertex(row * (columns + 1) + col)));
    for (let r = 0; r < lower.length - 1; r++)
        for (let c = 0; c < columnIds.length - 1; c++) {
            const a = lower[r][c], b = lower[r][c + 1], d = lower[r + 1][c], e = lower[r + 1][c + 1];
            indices.push(a, d, b, b, d, e);
        }
    const perimeter = [
        ...Array.from({ length: columns + 1 }, (_, c) => c),
        ...Array.from({ length: rows }, (_, r) => (r + 1) * (columns + 1) + columns),
        ...Array.from({ length: columns }, (_, c) => rows * (columns + 1) + columns - c - 1),
        ...Array.from({ length: rows - 1 }, (_, r) => (rows - r - 1) * (columns + 1)),
    ];
    const rim = perimeter.map(vertex);
    for (let i = 0; i < perimeter.length; i++) {
        const j = (i + 1) % perimeter.length;
        indices.push(perimeter[i], rim[i], perimeter[j], perimeter[j], rim[i], rim[j]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("color", new THREE.Uint8BufferAttribute(colors.map(channel => Math.round(channel * 255)), 3, true));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    mesh.geometry = geometry;
    source.dispose();
    mesh.userData.leafThickness = thickness;
}
