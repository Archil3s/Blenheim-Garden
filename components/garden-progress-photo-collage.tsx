"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import photos from "@/lib/garden/progress-photo-archive.json";

const photoUrl = (file: string) => "/progress/2026-11-15/" + file;

export function GardenProgressPhotoCollage() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = photos[activeIndex];

  function openPhoto(index: number) {
    setActiveIndex(index);
    dialogRef.current?.showModal();
  }

  return (
    <section className="progress-section" aria-labelledby="progress-collage-title">
      <div className="progress-section-title">
        <div>
          <span>02 / GARDEN PHOTO COLLAGE</span>
          <h2 id="progress-collage-title">Every corner, as it grows</h2>
        </div>
        <p>{photos.length} photographs added 15 November 2026. The camera capture dates are not available, so this is an archive date, not the date the photos were taken.</p>
      </div>
      <div className="progress-collage-grid">
        {photos.map((photo, index) => (
          <button
            type="button"
            key={photo.originalFile}
            className="progress-collage-item"
            onClick={() => openPhoto(index)}
            aria-label={"Enlarge " + photo.caption + ", photo " + (index + 1) + " of " + photos.length}
          >
            <span className="progress-collage-photo">
              <Image src={photoUrl(photo.file)} alt="" fill sizes="(max-width: 650px) 45vw, (max-width: 900px) 30vw, 22vw" />
            </span>
            <span className="progress-collage-info">
              <strong>{photo.caption}</strong>
              <small>Added 15 Nov 2026 · {photo.originalFile}</small>
            </span>
          </button>
        ))}
      </div>
      <dialog ref={dialogRef} className="progress-collage-dialog" aria-label="Garden progress photo">
        <div className="progress-lightbox-header">
          <div><strong>{active.caption}</strong><small>Added 15 Nov 2026 · Capture date unknown · {active.originalFile}</small></div>
          <button type="button" aria-label="Close enlarged photo" onClick={() => dialogRef.current?.close()}>Close</button>
        </div>
        <div className="progress-lightbox-image">
          <Image src={photoUrl(active.file)} alt={active.caption} width={640} height={1138} unoptimized priority />
        </div>
        <div className="progress-lightbox-controls">
          <button type="button" onClick={() => setActiveIndex(index => (index + photos.length - 1) % photos.length)}>Previous</button>
          <span>{activeIndex + 1} / {photos.length}</span>
          <button type="button" onClick={() => setActiveIndex(index => (index + 1) % photos.length)}>Next</button>
        </div>
      </dialog>
    </section>
  );
}
