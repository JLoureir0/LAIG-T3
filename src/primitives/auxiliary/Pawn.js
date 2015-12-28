function Pawn(scene, x, y) {
  CGFobject.call(this, scene);

  this.scene = scene;

  this.x = x;
  this.y = y;

  this.cylinder = new Cylinder(scene, 0.3, 0.3, 0.3, 10, 10);
}

Pawn.prototype = Object.create(CGFobject.prototype);
Pawn.prototype.constructor = Pawn;

Pawn.prototype.setTextureAmplification = function(amplifS, amplifT) {
  this.cylinder.setTextureAmplification(amplifS, amplifT);
};
