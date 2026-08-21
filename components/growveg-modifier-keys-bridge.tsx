"use client";

import { useEffect } from "react";

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  dragged: boolean;
};

type CropSnapshot = {
  name: string;
  variety: string;
};

const DRAW_THRESHOLD_PX = 12;

function placementArmed() {
  return document.documentElement.classList.contains("gv-click-place-armed");
}

function railButton(label: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
    .find((button) => button.querySelector("small")?.textContent?.trim() === label) ?? null;
}

function activeCropSnapshot(): CropSnapshot | null {
  const button = document.querySelector<HTMLButtonElement>(".gv-plant-list > button.gv-pickup-armed");
  if (!button) return null;

  const name = button.querySelector("strong")?.textContent?.trim();
  if (!name) return null;

  const variety = document.querySelector<HTMLElement>(".gv-ready-strip strong")?.textContent?.trim() || name;
  return { name, variety };
}

function cropButton(name: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-plant-list > button"))
    .find((button) => button.querySelector("strong")?.textContent?.trim() === name) ?? null;
}

function restoreVariety(variety: string) {
  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>(".gv-filters select"));
  const select = selects.at(-1);
  if (!select || !Array.from(select.options).some((option) => option.value === variety)) return;

  select.value = variety;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function straightEndpoint(startX: number, startY: number, endX: number, endY: number) {
  const dx = endX - startX;
  const dy = endY - startY;
  return Math.abs(dx) >= Math.abs(dy)
    ? { x: endX, y: startY, axis: "horizontal" as const }
    : { x: startX, y: endY, axis: "vertical" as const };
}

export function GrowVegModifierKeysBridge() {
  useEffect(() => {
    const syntheticEvents = new WeakSet<Event>();
    let gesture: Gesture | null = null;
    let rearmToken = 0;

    const cancelPendingRearm = () => {
      rearmToken += 1;
    };

    const dispatchStraightEvent = (event: PointerEvent, clientX: number, clientY: number) => {
      const target = event.target instanceof EventTarget
        ? event.target
        : document.elementFromPoint(clientX, clientY) ?? document;

      const replacement = new PointerEvent(event.type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: event.pointerId,
        width: event.width,
        height: event.height,
        pressure: event.pressure,
        tangentialPressure: event.tangentialPressure,
        tiltX: event.tiltX,
        tiltY: event.tiltY,
        twist: event.twist,
        pointerType: event.pointerType,
        isPrimary: event.isPrimary,
        screenX: event.screenX,
        screenY: event.screenY,
        clientX,
        clientY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        button: event.button,
        buttons: event.buttons,
      });

      syntheticEvents.add(replacement);
      event.preventDefault();
      event.stopImmediatePropagation();
      target.dispatchEvent(replacement);
    };

    const rearmCrop = (snapshot: CropSnapshot, delayMs: number) => {
      const token = ++rearmToken;

      window.setTimeout(() => {
        if (token !== rearmToken) return;

        const plants = railButton("Plants");
        if (!plants) return;
        plants.click();

        let attempts = 0;
        const pickAgain = () => {
          if (token !== rearmToken) return;

          const button = cropButton(snapshot.name);
          if (!button) {
            attempts += 1;
            if (attempts < 12) window.requestAnimationFrame(pickAgain);
            return;
          }

          button.click();
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              if (token === rearmToken) restoreVariety(snapshot.variety);
            });
          });
        };

        window.requestAnimationFrame(pickAgain);
      }, delayMs);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (syntheticEvents.has(event) || !placementArmed() || event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".plan-bed.gv-v4-bed")) return;

      gesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragged: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (syntheticEvents.has(event) || !gesture || event.pointerId !== gesture.pointerId) return;

      const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (distance >= DRAW_THRESHOLD_PX) gesture.dragged = true;

      if (!gesture.dragged || !event.shiftKey) {
        document.documentElement.classList.remove("gv-axis-lock-active");
        return;
      }

      const straight = straightEndpoint(gesture.startX, gesture.startY, event.clientX, event.clientY);
      document.documentElement.classList.add("gv-axis-lock-active");
      document.documentElement.dataset.gvAxisLock = straight.axis;

      if (straight.x === event.clientX && straight.y === event.clientY) return;
      dispatchStraightEvent(event, straight.x, straight.y);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (syntheticEvents.has(event) || !gesture || event.pointerId !== gesture.pointerId) return;

      const currentGesture = gesture;
      gesture = null;
      document.documentElement.classList.remove("gv-axis-lock-active");
      delete document.documentElement.dataset.gvAxisLock;

      const crop = event.ctrlKey ? activeCropSnapshot() : null;
      if (crop) rearmCrop(crop, currentGesture.dragged ? 260 : 90);

      if (!currentGesture.dragged || !event.shiftKey) return;

      const straight = straightEndpoint(
        currentGesture.startX,
        currentGesture.startY,
        event.clientX,
        event.clientY,
      );

      if (straight.x === event.clientX && straight.y === event.clientY) return;
      dispatchStraightEvent(event, straight.x, straight.y);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Shift") return;
      document.documentElement.classList.remove("gv-axis-lock-active");
      delete document.documentElement.dataset.gvAxisLock;
    };

    const onCancelIntent = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (event instanceof KeyboardEvent && event.key === "Escape") cancelPendingRearm();
      if (event.type === "contextmenu") cancelPendingRearm();

      if (event.type === "click") {
        const plantButton = target?.closest(".gv-plant-list > button");
        const rail = target?.closest<HTMLButtonElement>(".gv-rail button");
        if (plantButton) cancelPendingRearm();
        if (rail && rail.querySelector("small")?.textContent?.trim() !== "Plants") cancelPendingRearm();
      }
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onPointerUp, { capture: true, passive: false });
    window.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("click", onCancelIntent);
    document.addEventListener("keydown", onCancelIntent);
    document.addEventListener("contextmenu", onCancelIntent);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("click", onCancelIntent);
      document.removeEventListener("keydown", onCancelIntent);
      document.removeEventListener("contextmenu", onCancelIntent);
      document.documentElement.classList.remove("gv-axis-lock-active");
      delete document.documentElement.dataset.gvAxisLock;
      cancelPendingRearm();
    };
  }, []);

  return null;
}
