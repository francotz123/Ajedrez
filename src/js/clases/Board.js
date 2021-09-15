import Piece from './Piece';

class Board {
    widht;
    width;
    height;
    files;
    ranks;
    cellWidth;
    cellheight;
    pieceOffset;
    boardMatrix = Piece[any][any];
    theme;
    pieceTheme;
    $canvas;
    ctx;

    constructor(width, height, files, ranks, theme, pieceTheme) {
        this.width = width;
        this.height = height;
        this.files = files;
        this.ranks = ranks;
        this.theme = theme;
        this.pieceTheme = pieceTheme;

        this.cellWidth = this.width / this.files;
        this.cellheight = this.height / this.ranks;

        this.pieceOffset = this.cellheight * 0.6;


        this.$canvas = document.createElement('canvas');
        this.ctx = this.$canvas.getContext('2d');

        this.$canvas.width = this.width;
        this.$canvas.height = this.height;

        document.body.appendChild(this.$canvas);

        document.body.style.display = 'grid';
        document.body.style.placeItems = 'center';
        document.body.style.alignItems = 'center';
        document.body.style.height = '100%';
        document.body.parentElement.style.width = '100%';
        document.body.style.background = '#004874'
        this.$canvas.style.border = '5px solid #191D1E';

        this.$canvas.style.backgroundColor = '#FFFFFF';

        //Inicializar tablero
        this.boardMatrix = [];

        for (let x = 0; x < this.files; x += 1) {
            this.boardMatrix[x] = [];
            for (let y = 0; y < this.ranks; y += 1) {
                this.boardMatrix[x][y] = null;
            }
        }
        this.$canvas.addEventListener('mousedown', () => {
            console.log('Drag')
        });

        this.$canvas.addEventListener('mouseup', () => {
            console.log('Drop')
        });

        this.setMouseCell = this.setMouseCell.bind(this);

        this.$canvas.addEventListener('mousemove', this.setMouseCell);

    }


    setCell(x, y, cell) {
        this.boardMatrix[x][y] = cell;
    }
    //renderizar
    render() {
        for (let x = 0; x < this.files; x += 1) {
            for (let y = 0; y < this.ranks; y += 1) {
                let reactColor = this.theme.light;
                let textColor = this.theme.dark;

                if ((x + y) % 2) {
                    reactColor = this.theme.dark;
                    textColor = this.theme.light;
                }

                this.ctx.fillStyle = reactColor;
                this.ctx.fillRect(x * this.cellWidth, y * this.cellheight, this.cellWidth, this.cellheight);

                this.ctx.fillStyle = textColor;

                this.ctx.textBaseline = 'top';
                this.ctx.textAlign = 'start';
                this.ctx.font = '8px Arial';
                this.ctx.fillText(`[${x};${y} ]`, x * this.cellWidth + 10, y * this.cellheight + 10);



                let piece = this.boardMatrix[x][y];
                if (piece) {
                    this.ctx.fillStyle = piece.color;
                    this.ctx.textBaseline = 'middle';
                    this.ctx.textAlign = 'center';
                    this.ctx.font = '48px Arial';
                    this.ctx.fillStyle = piece.color;
                    this.ctx.fillText(piece.type[0], x * this.cellWidth + this.cellWidth / 2, y * this.cellheight + this.cellheight / 2, this.pieceOffset);
                    this.ctx.fillStyle = this.pieceTheme.dark;
                    this.ctx.fillText(piece.type[1], x * this.cellWidth + this.cellWidth / 2, y * this.cellheight + this.cellheight / 2, this.pieceOffset);
                }


            }
        }
    }

}

export default Board;