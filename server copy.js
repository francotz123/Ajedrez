const express = require("express");
const path = require("path");

const jsChessEngine = require("js-chess-engine");
const chessgame = new jsChessEngine.Game();

const app = express();
const httpServer = require("http").Server(app);
const io = require("socket.io")(httpServer);

const PORT = process.env.PORT || 3977;

var roomsList = [];

app.use(express.static("."));
app.use(express.static("src"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src/view/index.html"));
});

io.on("connection", (socket) => {
  socket.on("create", () => {
    const min = 1000;
    const max = 9999;

    var room = Math.floor(Math.random() * (max - min + 1) + min);
    roomsList.push(room);

    socket.join(room);
    socket.emit("newGame", { room: room });
  });

  socket.on("rooms", () => {
    socket.emit("listGame", { list: roomsList });
  });

  socket.on("join", (data) => {
    var room = io.sockets.adapter.rooms[data.room];

    if (room.length !== 1) {
      socket.emit("err", { message: "Partida cerrada" });
    } else {
      socket.join(data.room);
      socket.broadcast.to(data.room).emit("playerOne");
      socket.emit("playerTwo", { room: data.room });
    }
  });

  socket.on("turn", (data) => {
    const myArr = data.move.split("");
   
    console.log(data.move + " " + myArr[0] + 3);
    //myArr[0]+(myArr[2]+1)
    const checked = true;
    try {
      chessgame.move(data.move, myArr[0] + 3);
      
      
    } catch (error) {
      socket.emit("movementIlegal", data);
      console.log(error);
    }
    
    socket.broadcast.to(data.room).emit("turnPlayed", {
      
      previus: data.previus,
      next: data.next,
      tile: data.tile,
      room: data.room,
      previusTile: data.previusTile,
      chess: chessgame.exportJson(),
      move: data.move,
    });

  });

  socket.on("end", (data) => {
    remove(data.room);

    socket.broadcast.to(data.room).emit("endGame", data);
    socket.leave(data.room);
  });

  socket.on("remove", (data) => {
    remove(data.room);

    socket.leave(data.room);
  });

  socket.on("disconnecting", () => {
    var rooms = Object.keys(socket.rooms);

    rooms.forEach((room) => {
      remove(room);

      socket.to(room).emit("userDisconnect", {});
      socket.leave();
    });
  });
});

function remove(room) {
  var index = roomsList.indexOf(parseInt(room));
  if (index !== -1) roomsList.splice(index, 1);
}



httpServer.listen(PORT);
