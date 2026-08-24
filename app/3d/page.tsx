import Garden3DClient from "./garden-3d-client";

export const metadata = {
  title: "3D Garden | Blenheim Garden",
  description: "Interactive WebGL view of the measured Blenheim garden plan.",
};

export default function Garden3DPage() {
  return <Garden3DClient />;
}
