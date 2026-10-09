type Pos = "corner" | "center" | "left" | "off" | "pushL" | "pushout" | "pullin";

type Scene = {
  pos: Pos;
  mood?: "hop" | "shake" | "lean";
  face?: string;
  // Extra moves after the scene starts (ms from the step change)
  moves?: { at: number; pos: Pos }[];
};

const scenes: Record<number, Scene> = {
  0: { pos: "corner" },
  1: { pos: "corner", mood: "hop" },
  2: { pos: "left", mood: "shake" },
  // Walk up to the cube, then shove it off the right side of the screen
  3: {
    pos: "pushL",
    mood: "lean",
    moves: [
      { at: 700, pos: "pushout" },
      { at: 2100, pos: "corner" },
    ],
  },
  4: { pos: "corner", mood: "hop" },
  // Go off screen, then come back in with the cube
  5: {
    pos: "off",
    moves: [
      { at: 800, pos: "pullin" },
      { at: 2100, pos: "corner" },
    ],
  },
  6: { pos: "corner" },
  7: { pos: "corner", mood: "hop" },
};

export function setupPersona() {
  const persona = document.getElementById("persona");
  const character = document.getElementById("character");
  const face = document.getElementById("face") as HTMLImageElement | null;
  const armR = document.getElementById("arm-r");
  const arrow = document.getElementById("arrow");
  if (!persona || !character || !face || !armR || !arrow) return;

  let timer: number | undefined;
  let moveTimers: number[] = [];

  function play(scene: Scene, entrance: boolean) {
    clearTimeout(timer);
    moveTimers.forEach((t) => clearTimeout(t));
    moveTimers = [];

    arrow!.classList.remove("show");
    character!.classList.remove("hop", "shake", "lean", "drop");
    armR!.classList.remove("wave");
    void character!.offsetWidth;

    persona!.dataset.pos = scene.pos;
    if (scene.face) face!.src = import.meta.env.BASE_URL + scene.face;
    if (entrance) character!.classList.add("drop");

    timer = window.setTimeout(() => {
      if (entrance) {
        armR!.classList.add("wave");
        arrow!.classList.add("show");
      }
      if (scene.mood) character!.classList.add(scene.mood);
    }, entrance ? 900 : 700);

    scene.moves?.forEach((move) => {
      moveTimers.push(
        window.setTimeout(() => {
          persona!.dataset.pos = move.pos;
        }, move.at)
      );
    });
  }

  document.addEventListener("spawn", () => {
    persona.classList.add("spawned");
    play({ pos: "center" }, true);
  });

  document.addEventListener("stepchange", (event) => {
    const index = (event as CustomEvent<{ index: number }>).detail.index;
    const scene = scenes[index];
    if (scene) play(scene, false);
  });
}
