// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $econumber = $('#econumber')
var $econame = $('#econame')

var move_histroy = []

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
  move_histroy.push(board.position())
  ecodata = lookup_eco(game.pgn())
  console.log(ecodata)
  $econumber.html(ecodata["eco"])
  $econame.html(ecodata["name"])
}

function pieceTheme (piece) {
  // wikipedia theme for white pieces
  if (piece.search(/w/) !== -1) {
    return 'assets/img/chesspieces/wikipedia/' + piece + '.png'
  }

  // alpha theme for black pieces
  return 'assets/img/chesspieces/alpha/' + piece + '.png'
}

var config = {
  pieceTheme: pieceTheme,
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}

function lookup_eco(pgn){
  ecodata = {
    "name": "Not in database",
    "eco": "Not in database",
    "fen": "Not in database",
    "moves": "Not in database"
  }
  for (ecocode of eco) {
    if (ecocode["moves"] == pgn){
      ecodata = ecocode
    }
  }
  return (ecodata)
}

board = Chessboard('myBoard', config)

updateStatus()

$('#startBtn').on('click', board.start)
$('#backBtn').on('click', function(){board.position(move_histroy.pop())})
$('#forwardBtn').on('click', console.log("forward"))
$('#clearBtn').on('click', board.clear)