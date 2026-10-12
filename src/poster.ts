type Zoom = {
  x: string;      // where to zoom, as a % of the poster picture (0% 0% = top-left)
  y: string;
  level: number;  // how far to zoom in
  delay: number;  // seconds to wait before the zoom starts
};

// Steps where the poster is zoomed in (everything else shows the whole poster)
const SCIENCE: Zoom = { x: "24%", y: "33%", level: 2.2, delay: 1.4 };
const GRAPH: Zoom = { x: "20%", y: "62%", level: 3, delay: 0.8 };

const ZOOMS: Record<number, Zoom> = {
  3: SCIENCE,
  4: SCIENCE,
  6: GRAPH,
};

// Steps where the highlight is on and the rest of the poster is dark
const HIGHLIGHT_STEPS = [4];

// Delay + duration of the science zoom in presentation.css (1.4s + 1.2s)
const ZOOM_TOTAL_MS = 2600;

// The highlighted text, as a percentage of the poster picture
const HIGHLIGHT = { x: 6, y: 18.8, w: 18.5, h: 3.6 };

export function setupPoster() {
  const poster = document.getElementById("poster");
  const img = poster?.querySelector("img");
  const dim = poster?.querySelector<HTMLElement>(".poster-dim");
  if (!poster || !img || !dim) return;

  dim.style.left = `${HIGHLIGHT.x}%`;
  dim.style.top = `${HIGHLIGHT.y}%`;
  dim.style.width = `${HIGHLIGHT.w}%`;
  dim.style.height = `${HIGHLIGHT.h}%`;

  // The frame takes the picture's shape, so percentages match the poster itself
  function setRatio() {
    poster!.style.setProperty("--ar", String(img!.naturalWidth / img!.naturalHeight));
  }
  if (img.complete && img.naturalWidth) setRatio();
  else img.addEventListener("load", setRatio, { once: true });

  let timer: number | undefined;
  let zoomStart = 0;

  document.addEventListener("stepchange", (event) => {
    const index = (event as CustomEvent<{ index: number }>).detail.index;
    const zoom = ZOOMS[index];
    const wasZoomed = poster.classList.contains("zoomed");

    clearTimeout(timer);

    if (zoom) {
      // Set the spot before zooming. When leaving, the old spot stays so zooming out is smooth.
      poster.style.setProperty("--zx", zoom.x);
      poster.style.setProperty("--zy", zoom.y);
      poster.style.setProperty("--zoom", String(zoom.level));
      poster.style.setProperty("--zdelay", `${zoom.delay}s`);
      if (!wasZoomed) zoomStart = performance.now();
    }
    poster.classList.toggle("zoomed", !!zoom);

    // Leaving the highlight: turn it off right away
    if (!HIGHLIGHT_STEPS.includes(index)) {
      poster.classList.remove("highlight");
      return;
    }

    // Entering it: wait until the zoom has finished (0 if it already has)
    const wait = Math.max(0, zoomStart + ZOOM_TOTAL_MS - performance.now());
    timer = window.setTimeout(() => poster.classList.add("highlight"), wait + 100);
  });
}