degreeToRad = Math.PI / 180;

function Scene(cgfInterface) {
  CGFscene.call(this);

  this.cgfInterface = cgfInterface;

  var self = this;

  this.animationsQueue = new AnimationsQueue(function() {
      if (!self.gameEnd) {
        self.pickingLocked = false;
      }
      self.lastPick = null;
    }
  );

  this.scenery = 'dark';
  this.lastScenery = this.scenery;

  this.cameraAnimationInterfacePlug = false;
  this.linearVelocity = 1 / 250;
  this.cameraSpan = 1000;

  this.lastPick = null;
}

Scene.prototype = Object.create(CGFscene.prototype);
Scene.prototype.constructor = Scene;

Scene.prototype.init = function(application) {
  CGFscene.prototype.init.call(this, application);

  this.initCameras();

  this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

  this.gl.clearDepth(100.0);
  this.gl.enable(this.gl.DEPTH_TEST);
  this.gl.enable(this.gl.CULL_FACE);
  this.gl.depthFunc(this.gl.LEQUAL);

  this.tablut = new Tablut(this);
};

Scene.prototype.initLights = function() {

  this.setActiveShader(this.defaultShader);

  var index = 0;
  for (var lightName in this.graph.lights) {
    var light = this.graph.lights[lightName];

    this.lights[index].name = lightName;
    this.lights[index].enabled = light.enabled;

    this.lights[index].setPosition(light.position.x, light.position.y, light.position.z, light.position.w);
    this.lights[index].setAmbient(light.ambient.r, light.ambient.g, light.ambient.b, light.ambient.a);
    this.lights[index].setDiffuse(light.diffuse.r, light.diffuse.g, light.diffuse.b, light.diffuse.a);
    this.lights[index].setSpecular(light.specular.r, light.specular.g, light.specular.b, light.specular.a);

    this.lights[index].name = lightName;

    if (this.lights[index].enabled) {
      this.lights[index].enable();
      //this.lights[index].setVisible(true);
    } else {
      this.lights[index].disable();
      this.lights[index].setVisible(false);
    }

    //this.lights[index].setConstantAttenuation(1);
    //this.lights[index].setLinearAttenuation(1);
    //this.lights[index].setQuadraticAttenuation(0);

    ++index;
  }

  this.lights.filledLength = index;

  this.lightsCreated = true;

  this.cgfInterface.createLightsGui();
};

Scene.prototype.initTablut = function() {

  this.tablut.init();

  this.setPickEnabled(true);

  this.tablutCreated = true;

  this.cgfInterface.createTablutGui();
};

Scene.prototype.initCameras = function() {
  this.camera = new CGFcamera(0.4, 0.1, 500, vec3.fromValues(4.5, 25, 10), vec3.fromValues(4.5, 0, 4.5));
};

Scene.prototype.updateLights = function() {
  for (i = 0; i < this.lights.filledLength; i++) {
    this.lights[i].update();
  }
};

Scene.prototype.setDefaultAppearance = function() {
  this.setAmbient(0.2, 0.4, 0.8, 1.0);
  this.setDiffuse(0.2, 0.4, 0.8, 1.0);
  this.setSpecular(0.2, 0.4, 0.8, 1.0);
  this.setShininess(10.0);
};

// Handler called when the graph is finally loaded.
// As loading is asynchronous, this may be called already after the application has started the run loop
Scene.prototype.onGraphLoaded = function() {
  /**** DEBUG ****/
  console.log(this.graph);
  console.log(this);
  /***************/

  /** INITIALS **/
  // Frustum
  this.camera.near = this.graph.initials.frustum.near;
  this.camera.far = this.graph.initials.frustum.far;
  // Reference
  this.axis = new CGFaxis(this, this.graph.initials.reference);

  /** ILLUMINATION **/
  // background
  this.gl.clearColor(this.graph.illumination.background.r, this.graph.illumination.background.g, this.graph.illumination.background.b, this.graph.illumination.background.a);
  // ambient
  this.setGlobalAmbientLight(this.graph.illumination.ambient.r, this.graph.illumination.ambient.g, this.graph.illumination.ambient.b, this.graph.illumination.ambient.a);

  /** TABLUT **/
  this.initTablut();

  /** LIGHTS **/
  this.initLights();

  /** TEXTURES **/
  this.enableTextures(true);
};

Scene.prototype.restart = function() {

  this.tablutCreated = false;
  this.animationsQueue.kill();
  this.pickingLocked = false;
  this.gameEnd = false;
  window.hideWinnerGui();
  window.resetPoints();

  if (this.cameraAnimationInterfacePlug) {
    this.cameraAnimationActive = true;
  } else {
    this.cameraAnimationActive = false;
  }

  if (this.scenery !== this.lastScenery) {
    this.graph.isLoaded = false;
    this.cgfInterface.init();
    this.graph = null;
    new SceneGraph(this.scenery + '.xml', this);
    this.lastScenery = this.scenery;
  } else {
    this.tablut.init();
    this.tablutCreated = true;
  }
};

Scene.prototype.display = function() {
  this.logPicking();
  this.clearPickRegistration();

  // ---- BEGIN Background, camera and axis setup
  this.setActiveShader(this.defaultShader);

  // Clear image and depth buffer everytime we update the scene
  this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

  // Initialize Model-View matrix as identity (no transformation
  this.updateProjectionMatrix();
  this.loadIdentity();

  // Apply transformations corresponding to the camera position relative to the origin
  this.applyViewMatrix();

  this.setDefaultAppearance();

  // ---- END Background, camera and axis setup

  // it is important that things depending on the proper loading of the graph
  // only get executed after the graph has loaded correctly.
  // This is one possible way to do it
  if (this.graph.isLoaded) {

    var initials = this.graph.initials;
    this.translate(initials.translate.x, initials.translate.y, initials.translate.z);
    this.rotate(degreeToRad * initials.rotation.x, 1, 0, 0);
    this.rotate(degreeToRad * initials.rotation.y, 0, 1, 0);
    this.rotate(degreeToRad * initials.rotation.z, 0, 0, 1);
    this.scale(initials.scale.sx, initials.scale.sy, initials.scale.sz);

    if (this.lightsCreated) {
      this.updateLights();
    }

    // Draw axis
    if (this.graph.initials.reference !== 0) {
      this.axis.display();
    }

    var root = this.graph.nodes.root;
    this.graph.display(root, root.material, root.material.texture);

    if (this.tablutCreated) {
      this.tablut.display();
    }
  }

};

Scene.prototype.logPicking = function() {
  if (this.pickMode === false && !this.pickingLocked) {
    if (this.pickResults !== null && this.pickResults.length > 0) {
      for (var i = 0; i < this.pickResults.length; i++) {
        var obj = this.pickResults[i][0];
        if (obj) {
          console.log("getAvailableMoves,");
          console.log(this.tablut.rules.getAvailableMoves(obj.x, obj.y));
          var customId = this.pickResults[i][1];
          console.log("Picked object: " + obj + ", with pick id " + customId);
          if ((this.lastPick instanceof King || this.lastPick instanceof Pawn) && obj instanceof Cell) {
            var rulesValid = this.tablut.rules.commit({
              x: this.lastPick.x,
              y: this.lastPick.y
            }, {
              x: obj.x,
              y: obj.y
            });
            if (rulesValid) {
              this.tablut.saveToHistory();
              this.pickingLocked = true;
              var linear = new LinearAnimation(this.lastPick, obj, this.linearVelocity);
              if (this.cameraAnimationActive) {
                var cameraAnimation = new CameraAnimation(this.camera, this.cameraSpan);
                this.animationsQueue.add(cameraAnimation);
              }
              //var linear = new SlamAnimation(this.lastPick, obj, 3, this.linearVelocity);
              this.animationsQueue.add(linear);
              if (this.cameraAnimation) {
                this.animationsQueue.add(this.cameraAnimation);
              }

              if (rulesValid.deleted && rulesValid.deleted.length > 0) {
                window.incrementPoints(this.tablut.rules.getTurn(), rulesValid.deleted.length);
              }

              console.log("result,");
              console.log(rulesValid);
              if (rulesValid.deleted && rulesValid.deleted.length > 0) {
                for (var piece in rulesValid.deleted) {
                  this.tablut.deletePiece(rulesValid.deleted[piece].x, rulesValid.deleted[piece].y);
                }
              }

              if (rulesValid.won) {
                window.showWinnerGui(rulesValid.won);
                this.gameEnd = true;
              }
            } else {
              console.log("BAD MOVE");
              this.lastPick = null;
            }
          }
        }
        this.lastPick = obj;
      }
      this.pickResults.splice(0, this.pickResults.length);
    }
  }
};
