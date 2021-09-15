var timer;
var clicks = 0;
var posicionAnterior = " ";
var posicionSiguiente = " ";
var colAnterior = 0;
var rowAnterior = 0;
var colSiguiente = 0;
var rowSiguiente = 0;
var i_jaque = 0;
var j_jaque = 0;
var i_j_jaque ="";
var is_jaque = false;
var isStarting = false;

const theme = {
  light: "#EFF3F4",
  dark: "#0075B0",
};

const pieceTheme = {
  light: "#FFFFFF",
  dark: "#000000",
};
// 	♔,♕,♖,♗,♘,♙
const pieces = {
  king: ["♚", "♔"],
  queen: ["♛", "♕"],
  rook: ["♜", "♖"],
  bishop: ["♝", "♗"],
  knight: ["♞", "♘"],
  pawn: ["♟", "♙"],
};

class Game {
  constructor(room) {
    socket.emit("newGameChess");
    this.room = room;
    this.board = [];
    this.moves = 0;
  }

  createGameBoard() {
    /**
     *
     * Esta funcion checkea el evento si corresponde a un movimiento permitido, si es asi deja usar el manejador de eventos normal
     * @param {evento} e
     */
    function clickHandlerChecked(e) {
      let row, col;
      const letter = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const number = [8, 7, 6, 5, 4, 3, 2, 1];
     

      row = game.getRow(e.target.id);
      col = game.getCol(e.target.id);

      //RESETEO DE POSICIONES
      if (posicionAnterior !== " " && posicionSiguiente !== " ") {
        posicionSiguiente = " ";
        posicionAnterior = " ";
      }

      game.isCheck();
      var pieza1 = game.comprobarColor($(`#${row}_${col}`).html());

      //SE COMPRUEBA QUE LA CASILLA SELECCIONADA TENGA UNA PIEZA
      if (($(`#${row}_${col}`).html() !== " " || clicks > 0)) {


        //VERIFICA QUE SI SE SELECCIONO OTRA PIEZA DEL MISMO COLOR, RESETEE LOS CLICKS
         if (clicks == 1 && $(`#${row}_${col}`).html() != " " ) {
          if ( player.getColor() == game.comprobarColor($(`#${row}_${col}`).html())) {
            game.clearFirstPosition(posicionAnterior);
            clicks = 0;
            return;
          }
        }

        if (!player.getTurn() || !game) {
          return;
        }

        $(".table").removeAttr("style");

        clicks++;
       
        if (clicks == 1  && player.getColor() == game.comprobarColor($(`#${row}_${col}`).html())) {
          colAnterior = col;
          rowAnterior = row;
          posicionAnterior = row + "_" + col;
          game.updateBoard("#8dba7d", row, col, e.target.id);
        }else if (clicks == 2) {
          posicionSiguiente = row + "_" + col;
          colSiguiente = col;
          rowSiguiente = row;
          game.updateBoard("#52AE32", row, col, e.target.id);
        }else{
          clicks = 0;
          game.clearFirstPosition(posicionAnterior);
        }
        console.log("clicks", clicks)
        if (clicks == 2) {
          const from = letter[colAnterior] + number[rowAnterior];
          const to = letter[colSiguiente] + number[rowSiguiente];
          console.log(from, to);
          socket.emit("checkMovement", {
            from: from,
            to: to,
          });
        
        } else {
          player.setTurn(true);
        }
      }

      /**
       *
       * Este socket escucha si el movimiento que se quiere hacer es permitido
       */
      socket.on("movementChecked", (data) => {
        console.log("recibe");
        if (data.checked == true) {
          console.log("checked", data.checked == true);
          console.log("checkMate: ", data.checkMate);
          isStarting = false;
          clearInterval(timer);
          clickHandler(e);
        } else {
          game.clearFirstPosition(posicionAnterior);
          clicks = 0;
        }

      });
    }

    function clickHandler(e) {
      let row, col;
    
      row = game.getRow(e.target.id);
      col = game.getCol(e.target.id);

      if (!player.getTurn() || !game) {
        return;
      }

      $(".table").removeAttr("style");

      game.playTurn(e.target);

      /*   $(`#${posicionSiguiente}`).html($(`#${posicionAnterior}`).html());
      $(`#${posicionAnterior}`).html(``); */
      game.clearBoard(posicionAnterior, posicionSiguiente);
      game.placePieces();
      clicks = 0;

      //game.updateBoard(player.getColor(), row, col, e.target.id);
      socket.on("checkMate", (data) => {
        if (data.value) {
          var color = data.color == "white" ? "black" : "white";
          game.winner(color);
        }
      });

      socket.on("empate", (data)=> {
        if (data.value) {
          game.empate();
        }
      })

      socket.on("check", (data) => {
        if (data.value) {
        }
      });
      
      isStarting = true;

     
      $(".audioMove")[0].play();
      player.setTurn(false);

      socket.on("historyToGame", (data) => {
        console.log(data)
        $(".over").append(
          `<p>${data}</p>`
        );

      });
    }

    game.createTiles(clickHandlerChecked);

    
  }

  createTiles(clickHandlerChecked) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 7; j++) {
        if ((i + j) % 2 == 0) {
          $(".table").append(
            `<button class="tile" id="${i}_${j}" "style="background-color:${theme.light}, font-size: 300px;"></button> `
          );
        } else {
          $(".table").append(
            `<button class="tile" id="${i}_${j}" style="background-color:${theme.dark} ;"></button>`
          );
        }
      }
      if (i % 2 == 0) {
        $(".table").append(
          `<button class="tile" id="${i}_7" style="float:none;background-color:${theme.dark} ;"></button>`
        );
      } else {
        $(".table").append(
          `<button class="tile" id="${i}_7" style="float:none;background-color:${theme.light} ;"></button>`
        );
      }
    }

    game.placePieces();

    for (let i = 0; i < 8; i++) {
      this.board.push([""]);
      for (let j = 0; j < 8; j++) {
        $(`#${i}_${j}`).on("click", clickHandlerChecked);
      }
    }
  }

  placePieces() {
    const letter = ["A", "B", "C", "D", "E", "F", "G", "H"];

    const number = [8, 7, 6, 5, 4, 3, 2, 1, 0];
    var i_j;
    var idCell;
    socket.emit("placePieces");
    game.clearAllPieces();
    socket.on("places", (data) => {
      /*  Object.keys(data.chess.pieces).forEach(position => {
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            i_j = letter[i] + number[j];
            idCell = j + "_" + i;
            
            if (position == i_j) {

              game.printPieces(data.chess.pieces[position], idCell)
  
            } else {
              
            }
          }

        }
      }); */

      Object.keys(data.chess.pieces).forEach((position) => {
        var posicion = position.split("");

        i_j = number[posicion[1]] + "_" + letter.indexOf(posicion[0]);

        game.printPieces(data.chess.pieces[position], i_j);
      });
    });
  }

  printPieces(piece, idCell) {
    switch (piece) {
      //BLANCASS
      case "P":
        $(`#${idCell}`).html(`${pieces.pawn[1]}`);
        break;
      case "N":
        $(`#${idCell}`).html(`${pieces.knight[1]}`);
        break;
      case "B":
        $(`#${idCell}`).html(`${pieces.bishop[1]}`);
        break;
      case "R":
        $(`#${idCell}`).html(`${pieces.rook[1]}`);
        break;
      case "Q":
        $(`#${idCell}`).html(`${pieces.queen[1]}`);
        break;

      case "K":
        $(`#${idCell}`).html(`${pieces.king[1]}`);
        break;

      //NEGRAS
      case "p":
        $(`#${idCell}`).html(`${pieces.pawn[0]}`);
        break;
      case "n":
        $(`#${idCell}`).html(`${pieces.knight[0]}`);
        break;
      case "b":
        $(`#${idCell}`).html(`${pieces.bishop[0]}`);
        break;
      case "r":
        $(`#${idCell}`).html(`${pieces.rook[0]}`);
        break;
      case "q":
        $(`#${idCell}`).html(`${pieces.queen[0]}`);
        break;
      case "k":
        $(`#${idCell}`).html(`${pieces.king[0]}`);
        break;
    }
  }

  setTimer() {
    timer = setInterval(() => {
      var time = player.getTime();
      --player.time;

      $(".time").html(
        `⧗Tiempo: ${game.secondsToString(player.time)}`
      );

      if (player.getTime() == 0) {
        let message;

        message = player.getColor() == "white" ? "black" : "white";

        socket.emit("end", {
          room: game.getRoom(),
          message: message,
        });

        game.endGameMessage(message);
        clearInterval(timer);
      }
    }, 1000);
  }

  displayBoard(message) {
    $(".room").css("display", "none");
    $("header").addClass("order");
    $(".side-bar").css("display", "block");
    $(".side-history").css("display", "block");
    $("#return").css("display", "block");
    $("#logo").css("display", "none");
    $(".game").css("display", "block");
    $("#roomID").html(message);
    this.createGameBoard();
  }

  updateBoard(color, row, col, tile) {
    
    $(`#${tile}`).css("backgroundColor", `${color}`);
    //.prop("disabled", true);
    this.board[row][col] = color[0];
    this.moves++;
  }

  getClicks() {
    return clicks;
  }
  getRow(id) {
    let row = id.split("_")[0];
    return row;
  }

  getCol(id) {
    let col = id.split("_")[1];
    return col;
  }

  getRoom() {
    return this.room;
  }

  getPosicionAnterior() {
    return posicionAnterior;
  }

  getColAnterior() {
    return colAnterior;
  }

  getRowAnterior() {
    return rowAnterior;
  }

  getColSiguiente() {
    return colSiguiente;
  }

  getRowSiguiente() {
    return rowSiguiente;
  }

  getPosicionSiguiente() {
    return posicionSiguiente;
  }

  playTurn(tile) {
    const clickedTile = $(tile).attr("id");
    const previusTile = game.getPosicionAnterior();
    const nextTile = game.getPosicionSiguiente();
    console.log("playturn:" + game.getPosicionAnterior());
    const letter = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const number = [8, 7, 6, 5, 4, 3, 2, 1];
    const from = letter[colAnterior] + number[rowAnterior];
    const to = letter[colSiguiente] + number[rowSiguiente];
    console.log("entra a playTurn");
    socket.emit("turn", {
      previus: [game.getRowAnterior(), game.getColAnterior()],
      next: [game.getRowSiguiente(), game.getColSiguiente()],
      tile: clickedTile,
      nextTile: nextTile,
      previusTile: previusTile,
      room: this.getRoom(),
      from: from,
      to: to,
    });
  }

  endGameMessage(message) {
    isStarting = false;
    clearInterval(timer);
    $(".tile").attr("disabled", true);

    if (message == player.color) {
      message = "ganaste!";
      printMessage();
    } else if (message.includes("desconectado")) {
      $("#turn").text(message);
    } else if (message.includes("Tablas")) {
      message = "tablas";
      printMessage();
    } else {
      message = "perdiste";
      printMessage();
    }

    function printMessage() {
      const value = message.split("");
      $("#turn").css("opacity", 0);

      value.forEach((e) => {
        $("#result").append(`<h1>${e}</h1>`);
      });
      $("#result").css("display", "flex");
    }
  }

  checkDraw() {
    return this.moves >= 5 * 10;
  }

  disconnected() {
    const message = "Jugador desconectado";

    socket.emit("end", {
      room: this.getRoom(),
      message: message,
    });
    this.endGameMessage(message);
  }

  winner(color) {
    const message = color;
    console.log("color del jugador: ", message);
    socket.emit("end", {
      room: this.getRoom(),
      message: message,
    });
    this.endGameMessage(message);
  }

  empate() {
    const message = "¡Tablas!";
    socket.emit("end", {
      room: this.getRoom(),
      message: message,
    });
    this.endGameMessage(message);
  }

  clearBoard(p1, p2) {

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 7; j++) {
        if (`${i}_${j}` != p1 && `${i}_${j}` != p2) {
          if ((i + j) % 2 == 0) {
            $(`#${i}_${j}`).css("background-color", `${theme.light}`);
          } else {
            $(`#${i}_${j}`).css("background-color", `${theme.dark}`);
          }
        }
      }

      if (`${i}_7` != p1 || `${i}_7` != p2) {
        if (i % 2 == 0) {
          $(`#${i}_7`).css("background-color", `${theme.dark}`);
        } else {
          $(`#${i}_7`).css("background-color", `${theme.light}`);
        }
      }
    }
  }

  clearFirstPosition(p1) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 7; j++) {
        if (`${i}_${j}` == p1) {
          if ((i + j) % 2 == 0) {
            $(`#${i}_${j}`).css("background-color", `${theme.light}`);
          } else {
            $(`#${i}_${j}`).css("background-color", `${theme.dark}`);
          }
        }
      }

      if (`${i}_7` == p1) {
        if (i % 2 == 0) {
          $(`#${i}_7`).css("background-color", `${theme.dark}`);
        } else {
          $(`#${i}_7`).css("background-color", `${theme.light}`);
        }
      }
    }
  }

  clearAllPieces() {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        $(`#${i}_${j}`).html(` `);
      }
    }
  }

  isCheck() {
    socket.on("check", (data) => {
      if (data.value) {
        const letter = ["A", "B", "C", "D", "E", "F", "G", "H"];

        const number = [8, 7, 6, 5, 4, 3, 2, 1, 0];

        var posicion = data.position.split("");

        i_jaque = number[posicion[1]];
        j_jaque = letter.indexOf(posicion[0]);

        i_j_jaque = i_jaque + "_" + j_jaque ;
        is_jaque = true;
      
        $(`#${i_j_jaque}`).css("backgroundColor", "#D24379");
        this.board[i_jaque][j_jaque] =
          "#D24379";

        $(".audioCheck")[0].play();

        socket.emit("checkServer", {
          room: this.getRoom(),
          i_jaque: i_jaque,
          j_jaque: j_jaque,
          i_j_jaque: i_j_jaque,
          is_jaque: is_jaque,
        })

      }
    });
  }

  //DEVUELVE LOS SEGUNDOS EN MINUTOS Y SEG
   secondsToString(seconds) {
    var minute = Math.floor((seconds / 60) % 60);
    minute = (minute < 10)? '0' + minute : minute;
    var second = seconds % 60;
    second = (second < 10)? '0' + second : second;
    return  minute + ':' + second;
  }

  comprobarColor(figura){
    
    var color ="";
    switch(figura){
      case "♚":
      case "♛":
      case "♜":
      case "♝":
      case "♞":
      case "♟":
          color = "black";
      break;
      case "♔":
      case "♕":
      case "♖":
      case "♗":
      case "♘":
      case "♙":
       
          color = "white";
      break;

      
    }
    return color;
  }

  /* checkWinner() {
    let color = player.getColor()[0];

    this.horizontal(color);
    this.vertical(color);
    this.diagonal(color);
    this.diagonalReverse(color);

    if (this.checkDraw()) {
      const message = "¡Empate!";

      socket.emit("end", {
        room: this.getRoom(),
        message: message,
      });
      this.endGameMessage(message);
    }
  } */
}
