export function setupButtons() {
  const presentButton = document.getElementById("present");
  const connectButton = document.getElementById("connect");

  presentButton?.addEventListener("click", () => {
    const landing = document.getElementById("landing");
    landing?.classList.add("hidden");

    const presentation = document.getElementById("presentation");
    presentation?.classList.remove("hidden");
  });

  connectButton?.addEventListener("click", () => {
    console.log("Connect clicked");
  });
}