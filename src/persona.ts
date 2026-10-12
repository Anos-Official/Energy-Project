type Pos = "corner" | "center" | "left" | "off" | "pushL" | "pushout" | "pullin" | "thanks";

type Scene = {
  pos: Pos;
  mood?: "hop" | "shake" | "lean" | "leanL";
  face?: string;
  ref?: boolean;
  wave?: boolean;
  
  moves?: { at: number; pos: Pos }[];
};


const FLASH_FACE = "face-flash.png";

const FLASH_FACE_TIME = 2000;

const scenes: Record<number, Scene> = {
  0: { pos: "corner" },
  1: { pos: "corner", mood: "hop" },
  2: { pos: "left", mood: "shake" },
  3: {
    pos: "pushL",
    mood: "lean",
    moves: [
      { at: 700, pos: "pushout" },
      { at: 2100, pos: "corner" },
    ],
  },
  4: { pos: "corner" },
  // Go off screen, then come back in with the cube
  5: {
    pos: "off",
    mood: "leanL",
    face: "face.png",
    moves: [
      { at: 800, pos: "pullin" },
      { at: 2100, pos: "corner" },
    ],
  },
  // Referee in the middle, between the two contenders
  6: { pos: "center", mood: "hop", face: "face-referee.png", ref: true },
  7: { pos: "corner", face: "face.png" },
  8: { pos: "thanks", wave: true },
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

  let faceTimer: number | undefined;
  let baseFace = face.src;
  
  new Image().src = import.meta.env.BASE_URL + FLASH_FACE;
  new Image().src = import.meta.env.BASE_URL + "face-referee.png";

  function play(scene: Scene, entrance: boolean) {
    clearTimeout(timer);
    moveTimers.forEach((t) => clearTimeout(t));
    moveTimers = [];

    arrow!.classList.remove("show");
    character!.classList.remove("hop", "shake", "lean", "leanL", "drop");
    armR!.classList.remove("wave", "wave-loop");
    void character!.offsetWidth;

    persona!.dataset.pos = scene.pos;
    persona!.classList.toggle("referee", !!scene.ref);
    if (scene.face) {
      face!.src = import.meta.env.BASE_URL + scene.face;
      baseFace = face!.src;
    }
    if (entrance) character!.classList.add("drop");

    timer = window.setTimeout(() => {
      if (entrance) {
        armR!.classList.add("wave");
        arrow!.classList.add("show");
      }
      if (scene.mood) character!.classList.add(scene.mood);
      if (scene.wave) armR!.classList.add("wave-loop");
    }, entrance ? 900 : 700);

    scene.moves?.forEach((move) => {
      moveTimers.push(
        window.setTimeout(() => {
          persona!.dataset.pos = move.pos;
          if (move.pos === "corner") character!.classList.remove("lean", "leanL");
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

  document.addEventListener("flash", () => {
    clearTimeout(faceTimer);
    face.src = import.meta.env.BASE_URL + FLASH_FACE;
    faceTimer = window.setTimeout(() => {
      face.src = baseFace;
    }, FLASH_FACE_TIME);
  });
}
