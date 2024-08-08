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

let command;

io.on("connection", (socket) => {
  console.log("A user connected");

  // Gửi log hiện tại đến client khi họ kết nối
  if (command) {
    command.stdout.on("data", (data) => {
      socket.emit("log", data.toString());
    });

    command.stderr.on("data", (data) => {
      socket.emit("log", `stderr: ${data.toString()}`);
    });

    command.on("close", (code) => {
      socket.emit("log", `Process exited with code ${code}`);
    });
  }

  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Không cần phải dừng lệnh khi người dùng ngắt kết nối
  });
});

// Khởi chạy lệnh `ore` khi server bắt đầu lắng nghe
server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");

  command = spawn("ore", [
    "mine",
    "--priority-fee",
    "500000",
    "--rpc=https://solana-mainnet.g.alchemy.com/v2/GR48VUbiPP_P5KIoPAvXZHzrS61JpHQt",
  ]);

  command.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    io.emit("log", data.toString()); // Gửi log đến tất cả các client
  });

  command.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    io.emit("log", `stderr: ${data.toString()}`); // Gửi log đến tất cả các client
  });

  command.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
    io.emit("log", `Process exited with code ${code}`); // Gửi log đến tất cả các client
  });

  command.on("error", (err) => {
    console.error(`Failed to start subprocess: ${err}`);
    io.emit("log", `Error: ${err.message}`); // Gửi log đến tất cả các client
  });
});
