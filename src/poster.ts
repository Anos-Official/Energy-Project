// Steps where the poster is zoomed in (everything else shows the whole poster)
const ZOOM_STEPS = [3, 4];

// Steps where the highlight is on and the rest of the poster is dark
const HIGHLIGHT_STEPS = [4];

// Where to zoom, as a percentage of the poster picture (0% 0% = top-left)
const ZOOM_SPOT = { x: "24%", y: "33%" };
const ZOOM_LEVEL = 2.2;

// The highlighted text, as a percentage of the poster picture
const HIGHLIGHT = { x: 6, y: 18.8, w: 20, h: 3.6 };

export function setupPoster() {
  const poster = document.getElementById("poster");
  const img = poster?.querySelector("img");
  const dim = poster?.querySelector<HTMLElement>(".poster-dim");
  if (!poster || !img || !dim) return;

  poster.style.setProperty("--zx", ZOOM_SPOT.x);
  poster.style.setProperty("--zy", ZOOM_SPOT.y);
  poster.style.setProperty("--zoom", String(ZOOM_LEVEL));

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

  document.addEventListener("stepchange", (event) => {
    const frame = poster.querySelector<HTMLElement>(".poster-frame");
    let token = 0;
  
    document.addEventListener("stepchange", (event) => {
      const index = (event as CustomEvent<{ index: number }>).detail.index;
      poster.classList.toggle("zoomed", ZOOM_STEPS.includes(index));
  
      const mine = ++token;
  
      // Leaving the highlight: turn it off right away
      if (!HIGHLIGHT_STEPS.includes(index)) {
        poster.classList.remove("highlight");
        return;
      }
  
      // Entering it: wait for any zoom that is still running (including its delay)
      if (frame) void frame.offsetWidth;
      const zooming = frame
        ? frame.getAnimations().filter((a) => a instanceof CSSTransition)
        : [];
  
      Promise.allSettled(zooming.map((a) => a.finished)).then(() => {
        // Ignore if the person already moved on to another step
        if (mine === token) poster.classList.add("highlight");
      });
    });
  });
}