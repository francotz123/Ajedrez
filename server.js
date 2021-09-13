const express = require("express");
const path = require("path");

const jsChessEngine = require("js-chess-engine");
var chessgame ;// new jsChessEngine.Game();

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
    //chessgame = new jsChessEngine.Game();
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

  /**
   *
   *  ESTE SOCKET EFECTUA EL MOVIMIENTO EN EL JUEGO
   */
  socket.on("turn", (data) => {
    //const myArr = data.from.split("");
    //console.log(data.from + " " + myArr[0] + 3);
    //myArr[0]+(myArr[2]+1)
    const checked = true;

    try {
      chessgame.move(data.from, data.to);

      socket.broadcast.to(data.room).emit("turnPlayed", {
        previusTile: data.previusTile,
        nextTile: data.nextTile,
        previus: data.previus,
        next: data.next,
        tile: data.tile,
        room: data.room,
        chess: chessgame.exportJson(),
        from: data.from,
        to: data.to,
        checked: checked,
      });
      console.log("MOVIMIENTO ", data.from, data.to, " CORRECTO");

      let movements = [];
      let cont = 0;
      chessgame.getHistory().forEach((mov) => {
        getTo = mov.from;
        movements.push({
          from: mov.from,
          to: mov.to,
          player: mov.configuration.turn,
          piece: mov.configuration.pieces[getTo],
          number: cont++,
        });
  
        socket.broadcast.to(data.room).emit("history", {
          movements,
        });
      });

      if(getCheckMate()){
        socket.broadcast.emit("checkMate", {
          value: true,
          color: getColorPlayer(),
        });
      }

    } catch (error) {
      console.log(error);
    }

   
  });

  /**
   *
   *  ESTE SOCKET CHECKEA EL MOVIMIENTO Y EMITE LE DA EL PERMISO AL clickHandler(e) de las tiles por medio de un clickHandlerChecked(e)
   */
  socket.on("checkMovement", (data) => {

    
    if (chessgame.moves(data.from).indexOf(data.to) >= 0) {
      socket.emit("movementChecked", {
        from: data.from,
        to: data.to,
        checked: true,
        checkMate: getCheckMate(),
      });
    } else {
      socket.emit("movementChecked", {
        from: data.from,
        to: data.to,
        checked: false,
        checkMate: getCheckMate(),
      });
      socket.emit("movementIlegal", data);
    }

   
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

  socket.on("newGameChess", ()=>{
     chessgame = new jsChessEngine.Game();
  });

  socket.on("placePieces", () =>{
    //console.log(chessgame.exportJson());
    socket.emit("places", {
      hola: "hola",
      chess: chessgame.exportJson(),
    });
 });

});


function remove(room) {
  var index = roomsList.indexOf(parseInt(room));
  if (index !== -1) roomsList.splice(index, 1);
}

function getCheckMate(){
  return  chessgame.exportJson().checkMate;
}

function getColorPlayer(){
  return  chessgame.exportJson().turn;
}
httpServer.listen(PORT);
