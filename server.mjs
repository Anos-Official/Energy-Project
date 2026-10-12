
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import os from "node:os";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = 3000;

app.use(express.static("dist"));

app.get("/remote.html", (req, res) => {
    res.sendFile(process.cwd() + "/remote.html");
});

io.on("connection", (socket) => {
    console.log("Device connected:", socket.id);

    socket.on("remote:command", (command) => {
        const allowedCommands = [
            "next",
            "previous",
            "supercapacitor:open",
            "supercapacitor:close"
        ];
    
        if (!allowedCommands.includes(command)) return;
    
        io.emit("presentation:command", command);
    });
  
    socket.on("disconnect", () => {
        console.log("Device disconnected:", socket.id);
    });
});

function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const entries of Object.values(interfaces)) {
        for (const entry of entries ?? []) {
            if (entry.family === "IPv4" && !entry.internal) {
                addresses.push(entry.address);
            }
        }
    }

    return addresses;
}

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Energy Project server running on port ${PORT}`);

    for (const ip of getLocalIPs()) {
        console.log(`Local address: http://${ip}:${PORT}`);
    }
});
