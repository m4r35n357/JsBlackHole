/*jslint white: true, browser: true, safe: true */

"use strict";

var DISPLAY = {
	msRefresh: 10,
	// Misc. constants
	BLACK: "#000000",
	RED: "#ff0000",
	GREEN: "#00ff00",
	BLUE: "#0000ff",
	YELLOW: "#808000",
	CYAN: "#008080",
	MAGENTA: "#800080",
	WHITE: "#ffffff",
	n: 0,
	ballSize: 3,
	blankSize: 4,
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
		var gamma, gamma2;
		if (! NEWTON.collided) {
			NEWTON.rDisplay.innerHTML = NEWTON.r.toFixed(1);
			NEWTON.phiDisplay.innerHTML = GLOBALS.phiDegrees(NEWTON.phi) + "&deg;";
			NEWTON.tDisplay.innerHTML = properTime.toFixed(0);
		}
		if (! GR.collided) {
			gamma = GR.tDot;
			gamma2 = gamma * gamma;
			GR.tDisplay.innerHTML = GR.t.toFixed(0);
			GR.rDisplay.innerHTML = GR.r.toFixed(1);
			GR.phiDisplay.innerHTML = GLOBALS.phiDegrees(GR.phi) + "&deg;";
			GR.betaDisplay.innerHTML = (1.0 - 1.0 / gamma2).toFixed(3);
			GR.tauDisplay.innerHTML = properTime.toFixed(0);
			GR.tDotDisplay.innerHTML = gamma.toFixed(3);
			GR.rDotDisplay.innerHTML = GR.rDot.toFixed(3);
			GR.phiDotDisplay.innerHTML = (GR.phiDot * 360.0 / GLOBALS.TWOPI).toFixed(3);
		}
	},
	pointX: function (r, phi) {
		return this.originX + this.scale * r * Math.cos(phi);
	},
	pointY: function (r, phi) {
		return this.originY + this.scale * r * Math.sin(phi);
	},
	plotOrbit: function (canvas, model) {
		var X, Y;
		var blank = this.blankSize;
		X = this.pointX(model.r, model.phi);
		Y = this.pointY(model.r, model.phi);
		canvas.clearRect(model.X - blank, model.Y - blank, 2 * blank, 2 * blank);
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(X, Y, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		if (this.showTracks) {
			this.tracks.strokeStyle = model.colour;
				this.tracks.beginPath();
				this.tracks.moveTo(model.X, model.Y);
				this.tracks.lineTo(X, Y);
			this.tracks.stroke();
		}
		model.X = X;
		model.Y = Y;
	},
	energyBar: function (model) {
		var canvas = model.bgPotential;
		canvas.strokeStyle = this.RED;
			canvas.beginPath();
			canvas.moveTo(INIT.horizon * this.scale, this.potentialY);
			canvas.lineTo(this.originX, this.potentialY);
		canvas.stroke();
	},
	plotPotential: function (model) {
		var canvas = model.fgPotential;
		var blank = this.blankSize;
		var rAxis = this.potentialY;
		var yValue2 = this.potentialY + 180.0 * (model.energyBar - model.V(model.r));
		canvas.clearRect(model.rOld * this.scale - blank, rAxis - blank, 2 * blank, yValue2 + 2 * blank);
		// Potential ball
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(model.r * this.scale, yValue2, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		// Potential dropline
		canvas.strokeStyle = model.colour;
			canvas.beginPath();
			canvas.moveTo(model.r * this.scale, yValue2);
			canvas.lineTo(model.r * this.scale, rAxis);
		canvas.stroke();
	},
	plotTauDot: function (model) {
		var canvas = model.fgPotential;
		var tDotValue;
		// dTau/dt plot for GR
		tDotValue = 200 - 200.0 / model.tDot;
		canvas.clearRect(2, 0, 8, 200);
		canvas.fillStyle = this.WHITE;
			canvas.beginPath();
			canvas.arc(5, tDotValue, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		canvas.strokeStyle = this.WHITE;
			canvas.beginPath();
			canvas.moveTo(5, 200);
			canvas.lineTo(5, tDotValue);
		canvas.stroke();
	},
	potential: function (model) {
		var i, v, vOld;
		vOld = model.V(INIT.horizon);
		model.bgPotential.strokeStyle = this.BLACK;
		for (i = INIT.horizon + 1; i < this.originX / this.scale; i += 1) {
			v = model.V(i);
				model.bgPotential.beginPath();
				model.bgPotential.moveTo((i - 1) * this.scale, this.potentialY + 180.0 * (model.energyBar - vOld));
				model.bgPotential.lineTo(i * this.scale, this.potentialY + 180.0 * (model.energyBar - v));
			model.bgPotential.stroke();
			vOld = v;
		}
	},
	isco: function () {
		var a = INIT.a / INIT.M;
		var z1 = 1.0 + Math.pow(1.0 - a * a, 1.0 / 3.0) * (Math.pow(1.0 + a, 1.0 / 3.0) + Math.pow(1.0 - a, 1.0 / 3.0));
		var z2 = Math.sqrt(3.0 * a * a + z1 * z1);
		if (GLOBALS.prograde) {
			return INIT.M * (3.0 + z2 - Math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2)));
		} else {
			return INIT.M * (3.0 + z2 + Math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2)));
		}
	},
};

