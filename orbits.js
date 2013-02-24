/*jslint white: true, browser: true, safe: true */

"use strict";

var DISPLAY = {
	msInterval: 10,
	// Misc. constants
	BLACK: "#000000",
	RED: "#ff0000",
	GREEN: "#00ff00",
	BLUE: "#0000ff",
	YELLOW: "#ffff00",
	WHITE: "#ffffff",
	n: 0,
	rMin: Math.round(INIT.Rs),
	ballSize: 3,
	blankSize: 5,
	potentialY: 10,
	circularGradient: function (x, y, inner, outer) {
		var grd = DISPLAY.bg.createRadialGradient(x, y, 0, x, y, Math.sqrt(x * x + y * y));
		grd.addColorStop(0, inner);
		grd.addColorStop(1, outer);
		DISPLAY.bg.fillStyle = grd;
		DISPLAY.bg.fillRect(0, 0, 2 * x, 2 * y);
	},
	circle: function (X, Y, radius, colour) {
		DISPLAY.bg.fillStyle = colour;
			DISPLAY.bg.beginPath();
			DISPLAY.bg.arc(X, Y, radius, 0, GLOBALS.TWOPI, true);
			DISPLAY.bg.closePath();
		DISPLAY.bg.fill();
	},
	times: function () {
		if ((DISPLAY.n % 10) === 0) {
			DISPLAY.timedisplay.clearRect(0, 0, 150, 80);
			DISPLAY.timedisplay.fillStyle = DISPLAY.BLACK;
			DISPLAY.timedisplay.fillText("Proper time: " + (DISPLAY.n * INIT.time_step), 10, 20); 
			DISPLAY.timedisplay.fillText("   Map time: " + Math.round(GR.t), 10, 40);
		}
	},
	pointX: function (radius, angle) {
		return DISPLAY.originX + radius * Math.cos(angle);
	},
	pointY: function (radius, angle) {
		return DISPLAY.originY + radius * Math.sin(angle);
	},
	plotOrbit: function (model) {
		model.X = DISPLAY.pointX(model.r, model.phi);
		model.Y = DISPLAY.pointY(model.r, model.phi);
		DISPLAY.fg.clearRect(model.X - DISPLAY.blankSize, model.Y - DISPLAY.blankSize, 2 * DISPLAY.blankSize, 2 * DISPLAY.blankSize);
		DISPLAY.fg.fillStyle = model.colour;
			DISPLAY.fg.beginPath();
			DISPLAY.fg.arc(model.X, model.Y, DISPLAY.ballSize, 0, GLOBALS.TWOPI, true);
			DISPLAY.fg.closePath();
		DISPLAY.fg.fill();
	},
	energyBar: function (model) {
		model.bgpotenial.strokeStyle = DISPLAY.BLACK;
			model.bgpotenial.beginPath();
			model.bgpotenial.moveTo(0, DISPLAY.potentialY);
			model.bgpotenial.lineTo(DISPLAY.originX, DISPLAY.potentialY);
		model.bgpotenial.stroke();
	},
	plotPotential: function (model, energy, minPotential) {
		var yValue2 = DISPLAY.potentialY + 180.0 * (energy - model.vEff(model.r, model.L)) / (energy - minPotential);
		model.fgpotenial.clearRect(model.r - DISPLAY.blankSize, DISPLAY.potentialY - DISPLAY.blankSize, 2 * DISPLAY.blankSize, yValue2 + 2 * DISPLAY.blankSize);
		if (model.r > INIT.Rs) {
			// Potential ball
			model.fgpotenial.fillStyle = model.colour;
				model.fgpotenial.beginPath();
				model.fgpotenial.arc(model.r, DISPLAY.potentialY, DISPLAY.ballSize, 0, GLOBALS.TWOPI, true);
				model.fgpotenial.closePath();
			model.fgpotenial.fill();
			// Potential dropline
			model.fgpotenial.strokeStyle = model.colour;
				model.fgpotenial.beginPath();
				model.fgpotenial.moveTo(model.r, DISPLAY.potentialY);
				model.fgpotenial.lineTo(model.r, yValue2);
			model.fgpotenial.stroke();
		}
	},
};

var drawBackground = function () {
	DISPLAY.circularGradient(DISPLAY.originX, DISPLAY.originY, DISPLAY.WHITE, DISPLAY.BLACK);
	// Stable orbit limit
	DISPLAY.bg.globalAlpha = 0.2;
	DISPLAY.circle(DISPLAY.originX, DISPLAY.originY, 3.0 * INIT.Rs, DISPLAY.YELLOW);
	// Unstable orbit limit
	DISPLAY.bg.globalAlpha = 0.6;
	DISPLAY.circle(DISPLAY.originX, DISPLAY.originY, 1.5 * INIT.Rs, DISPLAY.RED);
	// Gravitational radius
	DISPLAY.bg.globalAlpha = 1.0;
	DISPLAY.circle(DISPLAY.originX, DISPLAY.originY, INIT.Rs, DISPLAY.BLACK);
	// Newton energy
	DISPLAY.energyBar(NEWTON);
	// GR energy
	DISPLAY.energyBar(GR);
	// Effective potentials
	for (var i = DISPLAY.rMin; i < DISPLAY.originX; i += 1) {
		// Newton effective potential locus
		var vEn = NEWTON.vEff(i, NEWTON.L);
		if (vEn <= NEWTON.E) {
			NEWTON.bgpotenial.fillStyle = DISPLAY.BLACK;
				NEWTON.bgpotenial.beginPath();
				NEWTON.bgpotenial.arc(i, DISPLAY.potentialY + 180.0 * (NEWTON.E - vEn) / (NEWTON.E - NEWTON.vC), 1, 0, GLOBALS.TWOPI, true);
				NEWTON.bgpotenial.closePath();
			NEWTON.bgpotenial.fill();
		}
		// GR effective potential locus
		var vE = GR.vEff(i, GR.L);
		if (vE <= GR.E2) {
			GR.bgpotenial.fillStyle = DISPLAY.BLACK;
				GR.bgpotenial.beginPath();
				GR.bgpotenial.arc(i, DISPLAY.potentialY + 180.0 * (GR.E2 - vE) / (GR.E2 - GR.vMin()), 1, 0, GLOBALS.TWOPI, true);
				GR.bgpotenial.closePath();
			GR.bgpotenial.fill();
		}
	}
};

var drawForeground = function () {
	DISPLAY.times();
	NEWTON.update();
	GR.update();
	DISPLAY.plotOrbit(NEWTON);
	DISPLAY.plotOrbit(GR);
	DISPLAY.plotPotential(NEWTON, NEWTON.E, NEWTON.vC);
	DISPLAY.plotPotential(GR, GR.E2, GR.vMin());
	DISPLAY.n = DISPLAY.n + 1;
};

window.onload = function () {
	var canvas = document.getElementById('fgorbit');
	DISPLAY.originX = canvas.width / 2;
	DISPLAY.originY = canvas.height / 2;
	DISPLAY.fg = canvas.getContext('2d');
	DISPLAY.bg = document.getElementById('bgorbit').getContext('2d');
	NEWTON.fgpotenial = document.getElementById('fgpotn').getContext('2d');
	NEWTON.bgpotenial = document.getElementById('bgpotn').getContext('2d');
	GR.fgpotenial = document.getElementById('fgpotgr').getContext('2d');
	GR.bgpotenial = document.getElementById('bgpotgr').getContext('2d');
	DISPLAY.timedisplay = document.getElementById('times').getContext('2d');
	console.info("rDot: " + INIT.rDot + "\n");
	console.info("TimeStep: " + INIT.time_step + "\n");
	// Newton initial conditions
	NEWTON.L = NEWTON.circL();
	console.info("Ln: " + NEWTON.L + "\n");
	NEWTON.vC = NEWTON.vEff(NEWTON.r, NEWTON.L);
	console.info("vCN: " + NEWTON.vC + "\n");
	NEWTON.E = INIT.rDot * INIT.rDot / 2.0 + NEWTON.vC;
	console.info("En: " + NEWTON.E + "\n");
	NEWTON.direction = INIT.direction;
	NEWTON.X = DISPLAY.pointX(NEWTON.r, NEWTON.phi);
	NEWTON.Y = DISPLAY.pointY(NEWTON.r, NEWTON.phi);
	NEWTON.colour = DISPLAY.GREEN;
	// GR initial conditions
	GR.L = GR.circL();
	console.info("L: " + GR.L + "\n");
	GR.vC = GR.vEff(GR.r, GR.L);
	console.info("vC: " + GR.vC + "\n");
	GR.E2 = INIT.rDot * INIT.rDot + GR.vC;
	GR.E = Math.sqrt(GR.E2);
	console.info("E: " + GR.E + "\n");
	GR.direction = INIT.direction;
	GR.X = DISPLAY.pointX(GR.r, GR.phi);
	GR.Y = DISPLAY.pointY(GR.r, GR.phi);
	GR.colour = DISPLAY.BLUE;
	// Kick-off
//	setKnifeEdge();
//	setPrecession();
	drawBackground();
	setInterval(drawForeground, DISPLAY.msInterval);
};

var scenarioAction = function () {
	console.info("scenarioAction() triggered\n");
	console.info(document.form.scenario[0].value);
	return false;
};

