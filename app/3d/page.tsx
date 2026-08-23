import { GardenWebGLLoader } from "@/components/garden-webgl-loader";

export const metadata = {
  title: "3D Garden | Blenheim Garden",
  description: "Interactive WebGL view of the measured Blenheim garden plan.",
};

export default function Garden3DPage() {
  return <GardenWebGLLoader />;
}
