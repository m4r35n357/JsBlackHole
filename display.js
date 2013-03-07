/*jslint white: true, browser: true, safe: true */

"use strict";

var DISPLAY = {
	msRefresh: 10,
	// Misc. constants
	BLACK: "#000000",
	RED: "#ff0000",
	GREEN: "#00ff00",
	BLUE: "#0000ff",
	YELLOW: "#ffff00",
	WHITE: "#ffffff",
	rMin: Math.round(INIT.Rs),
	ballSize: 3,
	blankSize: 5,
	potentialY: 10,
	circularGradient: function (canvas, x, y, inner, outer) {
		var grd = canvas.createRadialGradient(x, y, 0, x, y, Math.sqrt(x * x + y * y));
		grd.addColorStop(0, inner);
		grd.addColorStop(1, outer);
		canvas.fillStyle = grd;
		canvas.fillRect(0, 0, 2 * x, 2 * y);
	},
	circle: function (canvas, X, Y, radius, colour) {
		canvas.fillStyle = colour;
			canvas.beginPath();
			canvas.arc(X, Y, this.scale * radius, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
	},
	varTable: function () {
		var properTime = this.n * INIT.timeStep;
		if (! NEWTON.collided) {
			NEWTON.rDisplay.innerHTML = NEWTON.r.toFixed(1);
			NEWTON.phiDisplay.innerHTML = GLOBALS.phiDegrees(NEWTON.phi) + "&deg;";
			NEWTON.tDisplay.innerHTML = properTime.toFixed(0);
		}
		if (! GR.collided) {
			GR.tDisplay.innerHTML = GR.t.toFixed(0);
			GR.rDisplay.innerHTML = GR.r.toFixed(1);
			GR.phiDisplay.innerHTML = GLOBALS.phiDegrees(GR.phi) + "&deg;";
			GR.tauDisplay.innerHTML = properTime.toFixed(0);
		}
	},
	pointX: function (r, phi) {
		return this.originX + this.scale * r * Math.cos(phi);
	},
	pointY: function (r, phi) {
		return this.originY + this.scale * r * Math.sin(phi);
	},
	plotOrbit: function (model) {
		var canvas = this.fg;
		var blank = this.blankSize;
		model.X = this.pointX(model.r, model.phi);
		model.Y = this.pointY(model.r, model.phi);
		canvas.clearRect(model.X - blank, model.Y - blank, 2 * blank, 2 * blank);
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(model.X, model.Y, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
	},
	clearOrbit: function (model) {
		var blank = this.blankSize;
		model.X = this.pointX(model.r, model.phi);
		model.Y = this.pointY(model.r, model.phi);
		this.fg.clearRect(model.X - blank, model.Y - blank, 2 * blank, 2 * blank);
	},
	energyBar: function (model) {
		var canvas = model.bgPotential;
		canvas.strokeStyle = this.BLACK;
			canvas.beginPath();
			canvas.moveTo(0, this.potentialY);
			canvas.lineTo(this.originX, this.potentialY);
		canvas.stroke();
	},
	plotPotential: function (model) {
		var canvas = model.fgPotential;
		var blank = this.blankSize;
		var rAxis = this.potentialY;
		var yValue2 = this.potentialY + 180.0 * (model.energyBar - model.V(model.r, model.L));
		canvas.clearRect(model.r * this.scale - blank, rAxis - blank, 2 * blank, yValue2 + 2 * blank);
		// Potential ball
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(model.r * this.scale, rAxis, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		// Potential dropline
		canvas.strokeStyle = model.colour;
			canvas.beginPath();
			canvas.moveTo(model.r * this.scale, rAxis);
			canvas.lineTo(model.r * this.scale, yValue2);
		canvas.stroke();
	},
	clearPotential: function (model) {
		var blank = this.blankSize;
		var rAxis = this.potentialY;
		var yValue2 = this.potentialY + 180.0 * (model.energyBar - model.V(model.r, model.L));
		model.fgPotential.clearRect(model.r * this.scale - blank, rAxis - blank, 2 * blank, yValue2 + 2 * blank);
	},
};

