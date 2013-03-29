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
	phiBH: 0.0,
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
	timeUnits: function (time) {
		var hour = 60 * 60;
		var day = hour * 24;
		var year = day * 365;
		if (time < hour) {
			return time;
		} else if (time < day) {
			return time / hour;
		} else if (time < year) {
			return time / day;
		} else {
			return time / year;
		}
	},
	varTable: function () {
		var M = INIT.M;
		var c = GLOBALS.c;
		var properTime = this.n * INIT.timeStep * M / c;
		var beta, gamma, gamma2;
		if (! NEWTON.collided) {
			NEWTON.rDisplay.innerHTML = (M * NEWTON.r).toFixed(1);
			NEWTON.phiDisplay.innerHTML = GLOBALS.phiDegrees(NEWTON.phi) + "&deg;";
			NEWTON.tDisplay.innerHTML = properTime.toExponential(2);
			NEWTON.vDisplay.innerHTML = GLOBALS.speed(NEWTON).toFixed(1);
		}
		if (! GR.collided) {
			gamma = GR.tDot;
//			beta = 1.0 - 1.0 / (gamma * gamma);
			GR.tDisplay.innerHTML = (M * GR.t / c).toExponential(2);
			GR.rDisplay.innerHTML = (M * GR.r).toFixed(1);
			GR.phiDisplay.innerHTML = GLOBALS.phiDegrees(GR.phi) + "&deg;";
//			GR.betaDisplay.innerHTML = beta.toFixed(4);
			GR.tauDisplay.innerHTML = properTime.toExponential(2);
			GR.tDotDisplay.innerHTML = gamma.toFixed(3);
			GR.rDotDisplay.innerHTML = (M * GR.rDot).toFixed(3);
			GR.phiDotDisplay.innerHTML = (GR.phiDot * 360.0 / GLOBALS.TWOPI).toFixed(3);
//			GR.vDisplay.innerHTML = (beta * c).toExponential(2);
			GR.vDisplay.innerHTML = (GLOBALS.speed(GR) / gamma).toFixed(1);
		}
	},
	pointX: function (r, phi) {
		return this.originX + r * Math.cos(phi);
	},
	pointY: function (r, phi) {
		return this.originY + r * Math.sin(phi);
	},
	plotRotation: function () {
		var canvas = this.tracks;
		var blank = this.blankSize;
		var phiBH, X, Y;
		var radius = 0.7 * INIT.horizon;
		this.phiBH += INIT.deltaPhi;
		phiBH = this.phiBH;
		X = this.pointX(INIT.M * this.scale * radius, phiBH);
		Y = this.pointY(INIT.M * this.scale * radius, phiBH);
		canvas.clearRect(this.X - blank, this.Y - blank, 2 * blank, 2 * blank);
		canvas.fillStyle = this.RED;
			canvas.beginPath();
			canvas.arc(X, Y, 2, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		this.X = X;
		this.Y = Y;
	},
	plotOrbit: function (canvas, model) {
		var X, Y;
		var blank = this.blankSize;
		X = this.pointX(model.r * INIT.M * this.scale, model.phi);
		Y = this.pointY(model.r * INIT.M * this.scale, model.phi);
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
			canvas.moveTo(INIT.horizon * INIT.M * this.scale, this.potentialY);
			canvas.lineTo(this.originX, this.potentialY);
		canvas.stroke();
	},
	plotPotential: function (model) {
		var canvas = model.fgPotential;
		var blank = this.blankSize;
		var rAxis = this.potentialY;
		var yValue2 = this.potentialY + 180.0 * (model.energyBar - model.V(model.r));
		canvas.clearRect(model.rOld * INIT.M * this.scale - blank, rAxis - blank, 2 * blank, yValue2 + 2 * blank);
		// Potential ball
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(model.r * INIT.M * this.scale, yValue2, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		// Potential dropline
		canvas.strokeStyle = model.colour;
			canvas.beginPath();
			canvas.moveTo(model.r * INIT.M * this.scale, yValue2);
			canvas.lineTo(model.r * INIT.M * this.scale, rAxis);
		canvas.stroke();
	},
	plotTauDot: function (model) {
		var canvas = model.fgPotential;
		var tDotValue;
		var xValue = 395;
		// dTau/dt plot for GR
		tDotValue = 200 - 200.0 / model.tDot;
		canvas.clearRect(xValue - 3, 0, xValue + 3, 200);
		canvas.fillStyle = this.WHITE;
			canvas.beginPath();
			canvas.arc(xValue, tDotValue, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		canvas.strokeStyle = this.WHITE;
			canvas.beginPath();
			canvas.moveTo(xValue, 200);
			canvas.lineTo(xValue, tDotValue);
		canvas.stroke();
	},
	potential: function (model) {
		var i, r, v, vOld;
		var horizon = Math.floor(INIT.horizon * this.scale);
		vOld = model.V(horizon / this.scale);
		model.bgPotential.strokeStyle = this.BLACK;
		for (i = horizon; i < this.originX; i += 1) {
			r = i / (INIT.M * this.scale);
			v = model.V(r);
				model.bgPotential.beginPath();
				model.bgPotential.moveTo(r * INIT.M * this.scale - 1, this.potentialY + 180.0 * (model.energyBar - vOld));
				model.bgPotential.lineTo(r * INIT.M * this.scale, this.potentialY + 180.0 * (model.energyBar - v));
			model.bgPotential.stroke();
			vOld = v;
		}
	},
	isco: function () {
		var a = INIT.a;
		var z1 = 1.0 + Math.pow(1.0 - a * a, 1.0 / 3.0) * (Math.pow(1.0 + a, 1.0 / 3.0) + Math.pow(1.0 - a, 1.0 / 3.0));
		var z2 = Math.sqrt(3.0 * a * a + z1 * z1);
		if (GLOBALS.prograde) {
			return 3.0 + z2 - Math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2));
		} else {
			return 3.0 + z2 + Math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2));
		}
	},
};

