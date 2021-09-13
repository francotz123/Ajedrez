const socket = io.connect("https://ejemploajedrez.herokuapp.com/");
var player, game;
//import chessgame from '../../server.js'

init = () => {
  const p1Color = "black";
  const p2Color = "white";

  setInterval(() => {
    socket.emit("rooms");
  }, 3000);

  $(".rooms").on("click", (e) => {
    const room = e.target.innerText;

    player = new Player(p2Color);
    socket.emit("join", { room: room });
  });

  $("#new").on("click", () => {
    player = new Player(p1Color);
    socket.emit("create");
  });

  $("#return").on("click", function () {
    const room = $(this).text().slice(12, 16);

    socket.emit("end", { room: room });
    location.reload();
  });

  socket.on("listGame", (data) => {
    $(".rooms").empty();

    data.list.forEach((e) => {
      $(".rooms").append(`<h5>${e}</h5>`);
    });
  });

  socket.on("newGame", (data) => {
    const message = "Sala ID: " + data.room;

    game = new Game(data.room);
    game.displayBoard(message);
  });

  socket.on("playerOne", () => {
    player.setTurn(false);
  });

  socket.on("playerTwo", (data) => {
    const message = "Sala ID: " + data.room;

    game = new Game(data.room);
    game.displayBoard(message);
    player.setTurn(true);
  });

  socket.on("turnPlayed", (data) => {

      let row = game.getRow(data.tile);
      let col = game.getCol(data.tile);

      pieceOrigin = `${row, col}`
      //compruebo que se selecciona un button con una figura
      
      letter = ["A", "B", "C", "D", "E", "F", "G", "H"];

      
      const opponentColor = player.getColor() === p1Color ? p2Color : p1Color;

      game.placePieces();

      game.clearBoard(data.tile, data.previusTile);

      //$(`#${data.previusTile}`).html(` `);

      game.updateBoard("#D24379", row, col, data.nextTile);
      game.updateBoard("#D24379", data.previus[0],data.previus[1], data.previusTile);
      //console.log("checkMate: ", data.checkMate);
    player.setTurn(true);

  });

  socket.on("endGame", (data) => {
    game.endGameMessage(data.message);
  });

  socket.on("movementIlegal", (data) => {
    //alert("Movimiento no permitido: " + data.move + " to ");
  });

  socket.on("err", (data) => {
    alert(data.message);
    location.reload();
  });

  socket.on("userDisconnect", () => {
    game.disconnected();
  });

    /**
   * 
   * Este socket recibe el historial de partida, si lo necesitas cambiar de lugar hacia game. hacelo
   */
     socket.on("history", (data) => {
      console.log(data)
    });
    
    socket.on("movementIlegal", (data) => {
      alert("Movimiento no permitido: " + data.from + " to " + data.to);
    });

  
    
};

init();
