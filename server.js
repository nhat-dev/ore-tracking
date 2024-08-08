const express = require("express");
const { spawn } = require("child_process");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  const command = spawn("ore", [
    "mine",
    "--priority-fee",
    "500000",
    "--rpc=https://solana-mainnet.g.alchemy.com/v2/GR48VUbiPP_P5KIoPAvXZHzrS61JpHQt",
  ]);

  command.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    socket.emit("log", data.toString());
  });

  command.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    socket.emit("log", `stderr: ${data.toString()}`);
  });

  command.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    socket.emit("log", `Process exited with code ${code}`);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    command.kill();
  });
});

server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
