export function setupSteps() {
  const steps = document.querySelectorAll<HTMLElement>(".step");
  const presentation = document.getElementById("presentation");
  let current = 0;
  let busy = false;

  steps.forEach((step, i) => {
    step.classList.toggle("hidden", i !== 0);
  });

  function goTo(index: number) {
    if (busy || index === current) return;
    busy = true;
  
    const old = steps[current];
    old.classList.add("leaving");
  
    function onEnd(event: AnimationEvent) {
      if (event.target !== old) return;
      old.removeEventListener("animationend", onEnd);
      old.classList.remove("leaving");
      old.classList.add("hidden");
      steps[index].classList.remove("hidden");
      current = index;
      busy = false;
    }
  
    old.addEventListener("animationend", onEnd);
  }

  document.addEventListener("keydown", (event) => {
    if (presentation?.classList.contains("hidden")) return;

    if (event.key === "ArrowRight" && current < steps.length - 1) {
      goTo(current + 1);
    }
    if (event.key === "ArrowLeft" && current > 0) {
      goTo(current - 1);
    }
  });
}