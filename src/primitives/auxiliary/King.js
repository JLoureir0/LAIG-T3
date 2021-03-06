function King(scene, x, y) {
  CGFobject.call(this, scene);

  this.scene = scene;

  this.x = x;
  this.y = y;
  this.z = 0;

  this.cylinder = new Cylinder(scene, 1, 0.3, 0, 25, 25);
}

King.prototype = Object.create(CGFobject.prototype);
King.prototype.constructor = King;

King.prototype.display = function() {
  this.setTextureAmplification(this.scene.graph.tablut.king.texture.amplifFactor.s, this.scene.graph.tablut.king.texture.amplifFactor.t);

  this.scene.graph.tablut.king.material.apply();
  this.scene.graph.tablut.king.texture.bind();

  this.scene.pushMatrix();
  this.scene.translate(this.x + 0.5, this.z, this.y + 0.5);
  this.scene.rotate(-Math.PI / 2, 1, 0, 0);
  this.cylinder.display();
  this.scene.popMatrix();

  this.scene.setDefaultAppearance();
  this.scene.graph.tablut.king.texture.unbind();
};

King.prototype.setTextureAmplification = function(amplifS, amplifT) {
  this.cylinder.setTextureAmplification(amplifS, amplifT);
};
