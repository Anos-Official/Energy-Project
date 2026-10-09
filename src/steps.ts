// Transition kinds, set with data-transition on a step:
//   flash   - white screen flash, then swap (only when moving forward off the step)
//   instant - swap immediately, no fade
//   pan     - slide sideways between this step and its neighbour
//   (none)  - fade out, then swap
// Going forward uses the step being left; going back uses the step being returned to.

export function setupSteps() {
  const steps = document.querySelectorAll<HTMLElement>(".step");
  const presentation = document.getElementById("presentation");
  const flash = document.getElementById("flash");
  let current = 0;
  let busy = false;
  let spawned = false;

  steps.forEach((step, i) => {
    step.classList.toggle("hidden", i !== 0);
  });

  // Record the new step and tell the persona + cube about it
  function enter(index: number) {
    steps[index].dataset.dir = index > current ? "fwd" : "back";
    current = index;
    document.dispatchEvent(new CustomEvent("stepchange", { detail: { index } }));
  }

  function swap(index: number) {
    const old = steps[current];
    old.classList.remove("leaving");
    old.classList.add("hidden");
    steps[index].classList.remove("hidden");
    enter(index);
  }

  function pan(index: number) {
    const old = steps[current];
    const next = steps[index];
    const forward = index > current;
    const outClass = forward ? "pan-out-left" : "pan-out-right";
    const inClass = forward ? "pan-in-right" : "pan-in-left";

    next.classList.remove("hidden");
    old.classList.add(outClass);
    next.classList.add(inClass);
    enter(index);

    function onEnd(event: AnimationEvent) {
      if (event.target !== next) return;
      next.removeEventListener("animationend", onEnd);
      old.classList.remove(outClass);
      old.classList.add("hidden");
      next.classList.remove(inClass);
      busy = false;
    }

    next.addEventListener("animationend", onEnd);
  }

  function goTo(index: number) {
    if (busy || index === current) return;
    busy = true;

    const forward = index > current;
    const old = steps[current];
    const kind = forward ? old.dataset.transition : steps[index].dataset.transition;

    // Flash: whole screen goes white, swap while it is fully white
    if (kind === "flash" && forward && flash) {
      flash.classList.remove("go");
      void flash.offsetWidth;
      flash.classList.add("go");
      window.setTimeout(() => swap(index), 250);
      window.setTimeout(() => {
        busy = false;
      }, 700);
      flash.addEventListener(
        "animationend",
        () => {
          flash.classList.remove("go");
        },
        { once: true }
      );
      return;
    }

    if (kind === "instant") {
      swap(index);
      busy = false;
      return;
    }

    if (kind === "pan") {
      pan(index);
      return;
    }

    // Normal transition: fade out, then swap
    old.classList.add("leaving");

    function onEnd(event: AnimationEvent) {
      if (event.target !== old) return;
      old.removeEventListener("animationend", onEnd);
      swap(index);
      busy = false;
    }

    old.addEventListener("animationend", onEnd);
  }

  function next() {
    if (!spawned) {
      spawned = true;
      document.dispatchEvent(new CustomEvent("spawn"));
      return;
    }
    if (current < steps.length - 1) goTo(current + 1);
  }

  function prev() {
    if (current > 0) goTo(current - 1);
  }

  document.addEventListener("keydown", (event) => {
    if (presentation?.classList.contains("hidden")) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") next();
    if (event.key === "ArrowLeft" || event.key === "PageUp") prev();
  });

  let startX = 0;
  document.addEventListener(
    "touchstart",
    (event) => {
      startX = event.touches[0].clientX;
    },
    { passive: true }
  );

  document.addEventListener("touchend", (event) => {
    if (presentation?.classList.contains("hidden")) return;
    const dx = event.changedTouches[0].clientX - startX;
    if (dx < -50) next();
    if (dx > 50) prev();
  });
}
