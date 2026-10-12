import "./styles";

import { setupButtons } from "./buttons";
import { setupSteps } from "./steps";
import { setupPersona } from "./persona";
import { setupModel } from "./model";
import { setupPoster } from "./poster";

setupButtons();
const steps = setupSteps();
setupPersona();
setupModel();
setupPoster();

import { io } from "socket.io-client";

const socket = io("https://energy-project-70zp.onrender.com");


socket.on("presentation:command", (command: string) => {
    if (command === "next") {
        steps.next();
    } else if (command === "previous") {
        steps.prev();
    } else if (command === "supercapacitor:open") {
        document.dispatchEvent(
            new Event("remote:supercapacitor-open")
        );
    } else if (command === "supercapacitor:close") {
        document.dispatchEvent(
            new Event("remote:supercapacitor-close")
        );
    }
});
