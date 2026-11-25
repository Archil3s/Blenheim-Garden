import { DEFAULT_GARDEN_ID } from "./active-garden";

export function requestGardenId(request: Request) {
  const id = new URL(request.url).searchParams.get("gardenId")?.trim() || DEFAULT_GARDEN_ID;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(id)) throw new Error("Garden id is invalid.");
  return id;
}
