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
		var canvas = DISPLAY.bg;
		var grd = canvas.createRadialGradient(x, y, 0, x, y, Math.sqrt(x * x + y * y));
		grd.addColorStop(0, inner);
		grd.addColorStop(1, outer);
		canvas.fillStyle = grd;
		canvas.fillRect(0, 0, 2 * x, 2 * y);
	},
	circle: function (X, Y, radius, colour) {
		var canvas = DISPLAY.bg;
		canvas.fillStyle = colour;
			canvas.beginPath();
			canvas.arc(X, Y, radius, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
	},
	times: function () {
		var canvas = DISPLAY.timedisplay;
		if ((DISPLAY.n % 10) === 0) {
			canvas.clearRect(0, 0, 150, 80);
			canvas.fillStyle = DISPLAY.BLACK;
			canvas.fillText("Proper time: " + (DISPLAY.n * INIT.timeStep), 10, 20); 
			canvas.fillText("   Map time: " + Math.round(GR.t), 10, 40);
		}
	},
	pointX: function (r, phi) {
		return DISPLAY.originX + r * Math.cos(phi);
	},
	pointY: function (r, phi) {
		return DISPLAY.originY + r * Math.sin(phi);
	},
	plotOrbit: function (model) {
		var canvas = DISPLAY.fg;
		var blank = DISPLAY.blankSize;
		model.X = DISPLAY.pointX(model.r, model.phi);
		model.Y = DISPLAY.pointY(model.r, model.phi);
		canvas.clearRect(model.X - blank, model.Y - blank, 2 * blank, 2 * blank);
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(model.X, model.Y, DISPLAY.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
	},
	energyBar: function (model) {
		var canvas = model.bgpotenial;
		canvas.strokeStyle = DISPLAY.BLACK;
			canvas.beginPath();
			canvas.moveTo(0, DISPLAY.potentialY);
			canvas.lineTo(DISPLAY.originX, DISPLAY.potentialY);
		canvas.stroke();
	},
	plotPotential: function (model, energy, minPotential) {
		var canvas = model.fgpotenial;
		var blank = DISPLAY.blankSize;
		var rAxis = DISPLAY.potentialY;
		var yValue2 = DISPLAY.potentialY + 180.0 * (energy - model.vEff(model.r, model.L)) / (energy - minPotential);
		canvas.clearRect(model.r - blank, rAxis - blank, 2 * blank, yValue2 + 2 * blank);
		// Potential ball
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(model.r, rAxis, DISPLAY.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		// Potential dropline
		canvas.strokeStyle = model.colour;
			canvas.beginPath();
			canvas.moveTo(model.r, rAxis);
			canvas.lineTo(model.r, yValue2);
		canvas.stroke();
	},
};

var drawBackground = function () {
	var grd;
	var vEn;
	var vE;
	var i;
	DISPLAY.circularGradient(DISPLAY.originX, DISPLAY.originY, DISPLAY.WHITE, DISPLAY.BLACK);
	grd = GR.bgpotenial.createLinearGradient(0, 0, DISPLAY.width, 0);
	grd.addColorStop(0, "white");
	grd.addColorStop(1, "black");
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
	NEWTON.bgpotenial.fillStyle = grd;
	NEWTON.bgpotenial.fillRect(0, 0, DISPLAY.width, 200);
	NEWTON.bgpotenial.fillStyle = DISPLAY.BLACK;
	NEWTON.bgpotenial.fillRect(0, 0, INIT.Rs, 200);
	NEWTON.bgpotenial.fillStyle = DISPLAY.BLACK;
	NEWTON.bgpotenial.fillRect(0, 0, INIT.Rs, 200); 
	DISPLAY.energyBar(NEWTON);
	// GR energy
	GR.bgpotenial.fillStyle = grd;
	GR.bgpotenial.fillRect(0, 0, DISPLAY.width, 200);
	GR.bgpotenial.globalAlpha = 0.2;
	GR.bgpotenial.fillStyle = DISPLAY.YELLOW;
	GR.bgpotenial.fillRect(0, 0, 3.0 * INIT.Rs, 200); 
	GR.bgpotenial.globalAlpha = 0.6;
	GR.bgpotenial.fillStyle = DISPLAY.RED;
	GR.bgpotenial.fillRect(0, 0, 1.5 * INIT.Rs, 200); 
	GR.bgpotenial.globalAlpha = 1.0;
	GR.bgpotenial.fillStyle = DISPLAY.BLACK;
	GR.bgpotenial.fillRect(0, 0, INIT.Rs, 200);
	DISPLAY.energyBar(GR);
	// Effective potentials
	for (i = DISPLAY.rMin; i < DISPLAY.originX; i += 1) {
		// Newton effective potential locus
		vEn = NEWTON.vEff(i, NEWTON.L);
		if (vEn <= NEWTON.E) {
			NEWTON.bgpotenial.fillStyle = DISPLAY.BLACK;
				NEWTON.bgpotenial.beginPath();
				NEWTON.bgpotenial.arc(i, DISPLAY.potentialY + 180.0 * (NEWTON.E - vEn) / (NEWTON.E - NEWTON.vC), 1, 0, GLOBALS.TWOPI, true);
				NEWTON.bgpotenial.closePath();
			NEWTON.bgpotenial.fill();
		}
		// GR effective potential locus
		vE = GR.vEff(i, GR.L);
		if (vE <= GR.E2) {
			GR.bgpotenial.fillStyle = DISPLAY.BLACK;
				GR.bgpotenial.beginPath();
				GR.bgpotenial.arc(i, DISPLAY.potentialY + 180.0 * (GR.E2 - vE) / (GR.E2 - GR.vMin(GR.L, GR.Rs)), 1, 0, GLOBALS.TWOPI, true);
				GR.bgpotenial.closePath();
			GR.bgpotenial.fill();
		}
	}
};

var drawForeground = function () {
	DISPLAY.times();
	if (! NEWTON.collided) {
		NEWTON.update(INIT.timeStep, NEWTON.r, NEWTON.L, INIT.Rs);
		DISPLAY.plotOrbit(NEWTON);
		DISPLAY.plotPotential(NEWTON, NEWTON.E, NEWTON.vC);
	}
	if (! GR.collided) {
		GR.update(INIT.timeStep, GR.r, GR.E2, GR.E, GR.L, INIT.Rs);
		DISPLAY.plotOrbit(GR);
		DISPLAY.plotPotential(GR, GR.E2, GR.vMin());
	}
	DISPLAY.n = DISPLAY.n + 1;
};

var initModels = function () {
	console.info("rDot: " + INIT.rDot + "\n");
	console.info("TimeStep: " + INIT.timeStep + "\n");
	DISPLAY.rMin = Math.round(INIT.Rs);
	// Common initial conditions
	INIT.initialize(NEWTON);
	INIT.initialize(GR);
	// Newton initial conditions
	NEWTON.collided = false;
	NEWTON.r = INIT.r;
	NEWTON.rOld = INIT.r;
	NEWTON.phi = INIT.phi;
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
	GR.collided = false;
	GR.r = INIT.r;
	GR.rOld = INIT.r;
	GR.phi = INIT.phi;
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
}

window.onload = function () {
	var polar = document.getElementById('fgorbit');
	var potential = document.getElementById('fgpotn');
	DISPLAY.originX = polar.width / 2;
	DISPLAY.originY = polar.height / 2;
	DISPLAY.width = potential.width;
	DISPLAY.fg = polar.getContext('2d');
	DISPLAY.bg = document.getElementById('bgorbit').getContext('2d');
	NEWTON.fgpotenial = document.getElementById('fgpotn').getContext('2d');
	NEWTON.bgpotenial = document.getElementById('bgpotn').getContext('2d');
	GR.fgpotenial = document.getElementById('fgpotgr').getContext('2d');
	GR.bgpotenial = document.getElementById('bgpotgr').getContext('2d');
	DISPLAY.timedisplay = document.getElementById('times').getContext('2d');
//	setKnifeEdge();
//	setJustStable();
	setPrecession();
	initModels();
	// Kick-off
	drawBackground();
	setInterval(drawForeground, DISPLAY.msInterval);
};

var scenarioAction = function () {
	console.info("scenarioAction() triggered\n");
	console.info(document.form.scenario[0].value);
	return false;
};

