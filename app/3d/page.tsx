import { GardenWebGLLite } from "@/components/garden-webgl-lite";

export const metadata = {
  title: "3D Garden | Blenheim Garden",
  description: "Interactive low-cost WebGL view of the measured Blenheim garden plan.",
};

export default function Garden3DPage() {
  return <GardenWebGLLite />;
}
