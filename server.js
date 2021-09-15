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
      socket.emit("err", { message: "Partida comenzada" });
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

      /*
      chessgame.getHistory().forEach((mov) => {

         getTo = mov.from;
        movements.push({
          from: mov.from,
          to: mov.to,
          player: mov.configuration.turn,
          piece: mov.configuration.pieces[getTo],
          number: cont++,
        });
   */

      if(getCheckMate()){
        socket.broadcast.emit("checkMate", {
          value: true,
          color: getColorPlayer(),
        });
      }

      if (getCheck()) {
          socket.emit("check", {
            value: chessgame.exportJson().check,
            color: getColorPlayer(),
            position: getCheckKing(),
          })
      }

      if(getEmpate()){
        socket.emit("empate", {
          value: true,
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
        isFinished: getEmpate(),
      });
    } else {
      socket.emit("movementChecked", {
        from: data.from,
        to: data.to,
        checked: false,
        checkMate: getCheckMate(),
        isFinished: getEmpate(),
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

 /**
  * 
  * Recibe el pedido de historial y lo envia todos
  */
 socket.on("requestHistory", (data) => {
  let movements = [];
  chessgame.getHistory().reverse().forEach(mov => {
      geto = mov.from;
      movements.push(
        `<br> ${mov.from} - ${mov.to}`
      )
  });
  socket.to(data.room).emit("historyToRoom", movements);
  socket.emit("historyToGame", movements)

  //socket.to(data.room).emit("historyToRoom", `${chessgame.getHistory()[0].from} - ${chessgame.getHistory()[0].to}`);
  //socket.emit("historyToGame", `${chessgame.getHistory()[0].from} - ${chessgame.getHistory()[0].to}`)
 })

 socket.on("checkServer", (data) => {
  socket.broadcast.to(data.room).emit("checkPlayer2", data)
});

});


function remove(room) {
  var index = roomsList.indexOf(parseInt(room));
  if (index !== -1) roomsList.splice(index, 1);
}

function getCheckMate(){
  return  chessgame.exportJson().checkMate;
}

function getEmpate() {
  return (chessgame.exportJson().isFinished && !(chessgame.exportJson().checkMate)) || (chessgame.exportJson().halfMove == 50);
}

function getCheck() {
  return chessgame.exportJson().check;
}

function getCheckKing() {
  var pieces = chessgame.exportJson().pieces;
  if (getCheck() && (getColorPlayer() == "white")) {
    return getKeyByValue(pieces,"K")
  }
   if (getCheck() && (getColorPlayer() == "black")) {
     return getKeyByValue(pieces, "k")
   }
}


function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}
function getColorPlayer(){
  return  chessgame.exportJson().turn;
}

httpServer.listen(PORT);
