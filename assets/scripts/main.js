// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null
var game = new Chess()
var chessengine = new Worker('assets/scripts/lozza.js');

var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $econumber = $('#econumber')
var $econame = $('#econame')
var $opening_games = $('#opening_games')
var $opening_moves = $('#opening_moves')
var $evalbar = $('#evalbar')
var $evalwhite = $('#eval_white')
var $evalblack = $('#eval_black')
var $openingname = $('#main_opening_name')
var $openingvariant = $('#varaint_opening_name')

var movehistory = []
var movefuture = []

chessengine.onmessage = function (e) {
  data = e.data.split(" ")
  if (data[0] == 'bestmove'){
    console.log('best move =>', data[1])
  }
  evaluation = 0
  for (var i = 0; i < data.length; i++){
    if (data[i] == "score"){
      if (data[i+1] == "cp"){
        evaluation = data[i+2]
      } else if (data[i+1] == "mate"){
        evaluation = data[i+2]
      }
      if (game.turn() == 'b'){
        evaluation = evaluation * -1
      }
      updateEvalbar(evaluation)
    }

  }
 
  //console.log(e.data)
}

function updateEvalbar(evaluation){
  evalwidth = Math.min(50, evaluation/300*50) + 50
  console.log(evaluation, evalwidth)
  if (evaluation > 0){
    $('#eval_black').html('')
    $('#eval_white').html((evaluation/100).toFixed(2))
  } else {
    $('#eval_black').html((evaluation/100).toFixed(2))
    $('#eval_white').html('')
  }
  $('#evalbar').width(evalwidth + '%')

}

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
  if (move === null) {
    return 'snapback'
  }else{
    movehistory.push({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
  }
  
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
  $pgn.html("Blank")
  if (game.png){
    $pgn.html(game.pgn())
  }
  ecodata = lookup_png(game.pgn())
  $econumber.html(ecodata["eco"])
  $econame.html(ecodata["name"])
  opening_name = ecodata["name"].split(':')
  $('#main_opening_name').html(opening_name[0])
  $('#variant_opening_name').html('')
  if (opening_name.length>1){
    $('#variant_opening_name').html('( ' + opening_name[1] + ')')
  }
  chessengine.postMessage('position fen ' + game.fen());
  chessengine.postMessage('go depth 10');
  //  chessengine.postMessage('go depth 10')

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

function lookup_png(pgn){
  ecodata = {
    "name": "Not in database",
    "eco": "Not in database",
    "fen": "Not in database",
    "moves": "Not in database"
  }
  match = false
  
  for (ecocode of eco){
    if (ecocode["moves"] == pgn){
      ecodata = ecocode
      match = true
    } else if (ecocode["moves"].includes(pgn) && match == false){
      ecodata = ecocode
      match = true
    }
  }
  
  return (ecodata)
}

function lookup_name(name){
  ecodata = {
    "name": "Not in database",
    "eco": "Not in database",
    "fen": "Not in database",
    "moves": "Not in database"
  }
  for (ecocode of eco) {
    if (ecocode["name"] == name){
      ecodata = ecocode["moves"]
    }
  }
  return (ecodata)
}

function start(){
  board = Chessboard('myBoard', config)

  chessengine.postMessage('uci');         // get build etc
  chessengine.postMessage('position startpos');

  updateStatus()

  for (ecocode of eco) {
    $('#opening_games').append('<option value="' + ecocode["name"] + '"> '+ ecocode["name"] + ' </option>')
  } 
}

start()

$('#opening_games').on('change', function() {
  var openingSelected = $(this).children("option:selected").val();
  $('#opening_moves').val(lookup_name(openingSelected))
});

$('#startBtn').on('click', function(){
  board.start()
  game = new Chess()
})
$('#backBtn').on('click', function(){ 
  game = new Chess()
  movefuture.push(movehistory.pop())
  for (m of movehistory){
    game.move(m)
    updateStatus()
  }
  board.position(game.fen())
})
$('#forwardBtn').on('click', console.log("forward"))
$('#clearBtn').on('click', board.clear)