const socket = io.connect("localhost:3977");
var player, game;

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

    $(".player").append(
      `<h3 id="black">Juegas con Negras ♚</h3>`
    );
  });

  socket.on("playerOne", () => {
    $(".audio")[0].play();
    player.setTurn(false);
  });

  socket.on("playerTwo", (data) => {
    $(".audio")[0].play();
    const message = "Sala ID: " + data.room;

    $(".player").append(
      `<h3 id="white">Juegas con Blancas ♔</h3>`
    );

    game = new Game(data.room);
    game.displayBoard(message);
    player.setTurn(true);
  });

  socket.on("turnPlayed", (data) => {
    let row = game.getRow(data.tile);
    let col = game.getCol(data.tile);
    console.log(data.tile, data.previus);
    console.log(data.chess);
    console.log("check: " + data.previusTile, data.nextTile);
    pieceOrigin = `${(row, col)}`;


    //compruebo que se selecciona un button con una figura
    game.setTimer()
    letter = ["A", "B", "C", "D", "E", "F", "G", "H"];

    const opponentColor = player.getColor() === p1Color ? p2Color : p1Color;

    game.placePieces();

    game.clearBoard(data.tile, data.previusTile);

    game.updateBoard("#52AE32", row, col, data.nextTile);
    game.updateBoard(
      "#8dba7d",
      data.previus[0],
      data.previus[1],
      data.previusTile
    );
    $(".audioMove")[0].play();
    player.setTurn(true);
  });

  socket.on("endGame", (data) => {
    game.endGameMessage(data.message);
  });


  socket.on("err", (data) => {
    alert(data.message);
    location.reload();
  });

  socket.on("userDisconnect", () => {
    game.disconnected();
  });

  socket.on("movementIlegal", (data) => {

    alert("Movimiento no permitido: " + data.from + " to " + data.to);


    /*SE TRANFORMA EL DATA.FROM A FORMATO I_J PARA DESPINTAR LA CASILLA*/

    const letter = ["A", "B", "C", "D", "E", "F", "G", "H"];
    var i, j, i_j
    const number = [8, 7, 6, 5, 4, 3, 2, 1, 0];

    var posicion = data.to.split("");

    i = number[posicion[1]];
    j = letter.indexOf(posicion[0]);

    i_j = i + "_" + j;

    if ((i + j) % 2 == 0) {
      $(`#${i}_${j}`).css("background-color", `${theme.light}`);
    } else {
      $(`#${i}_${j}`).css("background-color", `${theme.dark}`);
    }

  });

  socket.on("checkPlayer2", (data) => {
    $(".audioCheck")[0].play();
    $(`#${data.i_j_jaque}`).css("backgroundColor", "#D24379");

  });

  socket.on("historyToRoom", (data) => {
    $(".over").append(
      `<p>${data}</p>`
    );
  })

};

init();
