import data from "./reference-object-data.json";

export type ReferenceObject = {
  code: string; name: string; group: string | null; layer: string;
  shape: { type: string; initialWidth: number; initialHeight: number;
    sprite: { type: string; name?: string; names?: Record<string, string | null> | string[];
      width?: number; height?: number; marginWidth?: number; marginHeight?: number } };
};
export const referenceObjects = data.objects as ReferenceObject[];
export const referenceObjectGroups = data.groups;

const aliases: Record<string, string> = {
  greenhouse: "GH03", polytunnel: "PT02", shed: "SH03", "cold-frame": "CF01",
  "compost-bin": "CO02", "water-tank": "WB01", "rain-barrel": "WB02",
  "potting-bench": "CT19", pergola: "TR04", "garden-arch": "TR03",
  "chicken-coop": "AO01", beehive: "AO06", "cattle-panel-arch": "TR03",
  "bean-arch": "TR03", "cucumber-arch": "TR03", "hoop-arch": "TR03",
  "a-frame-trellis": "TR06", "low-hoop-frame": "RC02", "insect-net-tunnel": "RC03",
  "bird-net-frame": "FC01", "frost-cloth-tunnel": "RC01", "shade-cloth-frame": "RC03",
  cloche: "CL01", "row-cover-hoops": "RC02", pot: "CT06", "grow-bag": "CT50",
  "planter-box": "CT01", "trough-planter": "CT05", "half-barrel": "CT11",
  "wicking-bed": "CT38", "seed-tray": "CT01", "raised-bed-timber": "RB04",
  "raised-bed-corrugated": "MB01", "raised-bed-round": "MB04",
  "raised-bed-square": "RB04", "keyhole-bed": "CT49", arbour: "TR01",
  basket: "CT41", "hanging-basket": "CT12", "bean-support": "TR06",
  "chicken-feeder": "AO11", "chicken-run": "AO14", "chicken-waterer": "AO10",
  compass: "CR01", "container-reservoir": "CT36", "hex-planter": "CT04",
  "irrigated-container": "CT38", "brick-edging": "PA02", "picket-fence": "FE01",
  "forcing-pot": "CL02", "fruit-cage": "FC01", "heated-greenhouse": "GH23",
  "irrigation-parts": "DR14", "irrigation-tubing": "DR01", "leaf-mould-bin": "CO03",
  obelisk: "TR05", "plant-halo": "CT40", "plant-house": "CT18",
  "planter-pocket": "CT48", "heated-polytunnel": "PT22", pond: "PD01",
  "potato-planter": "CT22", "mini-bed-cover": "CT15", "metal-shed": "SH33",
  "pent-shed": "SH23", "stepped-planter": "CT25", "stepped-shelving": "CT51",
  teepee: "TR07", "tower-planter": "CT39", "wall-tower-planter": "CT46", trug: "CT21",
};

export function referenceObject(kind: string) {
  const code = kind.startsWith("reference-") ? kind.slice(10) : aliases[kind];
  return referenceObjects.find((object) => object.code === code);
}
