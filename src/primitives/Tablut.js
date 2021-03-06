function Tablut(scene) {
  CGFobject.call(this, scene);

  this.playerOptions = ['player', 'computer'];
  this.dificultyOptions = ['easy', 'medium', 'hard'];

  this.sweedeAI = 'player';
  this.muscoviteAI = 'player';
  this.dificulty = 'easy';

  this.scene = scene;
}

Tablut.prototype = Object.create(CGFobject.prototype);
Tablut.prototype.constructor = Tablut;

Tablut.prototype.init = function() {

  this.mainBoard = new TablutBoard(this.scene);
  this.graveyard = new Graveyard(this.scene);

  this.pieces = [];
  this.boardHistory = [];

  this.pieces.push(new King(this.scene, 4, 4));

  this.pieces.push(new Swede(this.scene, 2, 4));
  this.pieces.push(new Swede(this.scene, 3, 4));
  this.pieces.push(new Swede(this.scene, 5, 4));
  this.pieces.push(new Swede(this.scene, 6, 4));
  this.pieces.push(new Swede(this.scene, 4, 2));
  this.pieces.push(new Swede(this.scene, 4, 3));
  this.pieces.push(new Swede(this.scene, 4, 5));
  this.pieces.push(new Swede(this.scene, 4, 6));

  this.pieces.push(new Muscovite(this.scene, 3, 0));
  this.pieces.push(new Muscovite(this.scene, 4, 0));
  this.pieces.push(new Muscovite(this.scene, 5, 0));
  this.pieces.push(new Muscovite(this.scene, 4, 1));
  this.pieces.push(new Muscovite(this.scene, 3, 8));
  this.pieces.push(new Muscovite(this.scene, 4, 8));
  this.pieces.push(new Muscovite(this.scene, 5, 8));
  this.pieces.push(new Muscovite(this.scene, 4, 7));
  this.pieces.push(new Muscovite(this.scene, 0, 3));
  this.pieces.push(new Muscovite(this.scene, 0, 4));
  this.pieces.push(new Muscovite(this.scene, 0, 5));
  this.pieces.push(new Muscovite(this.scene, 1, 4));
  this.pieces.push(new Muscovite(this.scene, 8, 3));
  this.pieces.push(new Muscovite(this.scene, 8, 4));
  this.pieces.push(new Muscovite(this.scene, 8, 5));
  this.pieces.push(new Muscovite(this.scene, 7, 4));

  this.rules = new Rules();
};

Tablut.prototype.display = function() {
  for (i = 0; i < this.pieces.length; i++) {
    this.scene.registerForPick(i + 1, this.pieces[i]);
    this.pieces[i].display();
  }

  this.mainBoard.display();
  this.graveyard.display();
};

Tablut.prototype.undo = function() {
  if (this.boardHistory.length > 0) {
    var currentPiecesInGraveyard = this.piecesInGraveyard();
    this.pieces = this.boardHistory.pop();
    var piecesInGraveyardAfterUndo = this.piecesInGraveyard();
    this.rules.pop();
    for(var i=0; i < (currentPiecesInGraveyard-piecesInGraveyardAfterUndo); i++)
      this.graveyard.undo();
    if (this.scene.cameraAnimationActive) {
      var cameraAnimation = new CameraAnimation(this.scene.camera, this.scene.cameraSpan);
      this.scene.animationsQueue.add(cameraAnimation);
    }
  }
};

Tablut.prototype.deletePiece = function(x, y) {
  for (var i = 0; i < this.pieces.length; i++) {
    if (this.pieces[i].x === x && this.pieces[i].y === y) {
      var tomb = this.graveyard.getTomb();
      this.scene.animationsQueue.add(new SlamAnimation(this.pieces[i], tomb, 3, this.scene.linearVelocity));
    }
  }
};

Tablut.prototype.saveToHistory = function() {
  var boardStatus = [];
  for (var piece in this.pieces) {
    if (this.pieces[piece] instanceof King)
      boardStatus.push(new King(this.scene, this.pieces[piece].x, this.pieces[piece].y));
    if (this.pieces[piece] instanceof Swede)
      boardStatus.push(new Swede(this.scene, this.pieces[piece].x, this.pieces[piece].y));
    if (this.pieces[piece] instanceof Muscovite)
      boardStatus.push(new Muscovite(this.scene, this.pieces[piece].x, this.pieces[piece].y));
  }
  this.boardHistory.push(boardStatus);
};

Tablut.prototype.piecesInGraveyard= function() {
  var piecesInGraveyard = 0;
  for (var i = 0; i < this.pieces.length; i++) {
    if (this.pieces[i].x < 0 || this.pieces[i].y < 0) {
      piecesInGraveyard++;
    }
  }
  return piecesInGraveyard;
};

Tablut.prototype.setTextureAmplification = function(amplifS, amplifT) {
  this.cell.setTextureAmplification(amplifS, amplifT);
};
