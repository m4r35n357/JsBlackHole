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
			DISPLAY.timedisplay.fillText("   Map time: " + Math.round(gr.t), 10, 40);
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
	DISPLAY.energyBar(newton);
	// GR energy
	DISPLAY.energyBar(gr);
	// Effective potentials
	for (var i = DISPLAY.rMin; i < DISPLAY.originX; i += 1) {
		// Newton effective potential locus
		var vEn = newton.vEff(i, newton.L);
		if (vEn <= newton.E) {
			newton.bgpotenial.fillStyle = DISPLAY.BLACK;
				newton.bgpotenial.beginPath();
				newton.bgpotenial.arc(i, DISPLAY.potentialY + 180.0 * (newton.E - vEn) / (newton.E - newton.vC), 1, 0, GLOBALS.TWOPI, true);
				newton.bgpotenial.closePath();
			newton.bgpotenial.fill();
		}
		// GR effective potential locus
		var vE = gr.vEff(i, gr.L);
		if (vE <= gr.E2) {
			gr.bgpotenial.fillStyle = DISPLAY.BLACK;
				gr.bgpotenial.beginPath();
				gr.bgpotenial.arc(i, DISPLAY.potentialY + 180.0 * (gr.E2 - vE) / (gr.E2 - gr.vMin()), 1, 0, GLOBALS.TWOPI, true);
				gr.bgpotenial.closePath();
			gr.bgpotenial.fill();
		}
	}
};

var drawForeground = function () {
	DISPLAY.times();
	newton.update();
	gr.update();
	DISPLAY.plotOrbit(newton);
	DISPLAY.plotOrbit(gr);
	DISPLAY.plotPotential(newton, newton.E, newton.vC);
	DISPLAY.plotPotential(gr, gr.E2, gr.vMin());
	DISPLAY.n = DISPLAY.n + 1;
};

window.onload = function () {
	var canvas = document.getElementById('fgorbit');
	DISPLAY.originX = canvas.width / 2;
	DISPLAY.originY = canvas.height / 2;
	DISPLAY.fg = canvas.getContext('2d');
	DISPLAY.bg = document.getElementById('bgorbit').getContext('2d');
	newton.fgpotenial = document.getElementById('fgpotn').getContext('2d');
	newton.bgpotenial = document.getElementById('bgpotn').getContext('2d');
	gr.fgpotenial = document.getElementById('fgpotgr').getContext('2d');
	gr.bgpotenial = document.getElementById('bgpotgr').getContext('2d');
	DISPLAY.timedisplay = document.getElementById('times').getContext('2d');
	console.info("rDot: " + INIT.rDot + "\n");
	console.info("TimeStep: " + INIT.time_step + "\n");
	// Newton initial conditions
	newton.L = newton.circL();
	console.info("Ln: " + newton.L + "\n");
	newton.vC = newton.vEff(newton.r, newton.L);
	console.info("vCN: " + newton.vC + "\n");
	newton.E = INIT.rDot * INIT.rDot / 2.0 + newton.vC;
	console.info("En: " + newton.E + "\n");
	newton.direction = INIT.direction;
	newton.X = DISPLAY.pointX(newton.r, newton.phi);
	newton.Y = DISPLAY.pointY(newton.r, newton.phi);
	newton.colour = DISPLAY.GREEN;
	// GR initial conditions
	gr.L = gr.circL();
	console.info("L: " + gr.L + "\n");
	gr.vC = gr.vEff(gr.r, gr.L);
	console.info("vC: " + gr.vC + "\n");
	gr.E2 = INIT.rDot * INIT.rDot + gr.vC;
	gr.E = Math.sqrt(gr.E2);
	console.info("E: " + gr.E + "\n");
	gr.direction = INIT.direction;
	gr.X = DISPLAY.pointX(gr.r, gr.phi);
	gr.Y = DISPLAY.pointY(gr.r, gr.phi);
	gr.colour = DISPLAY.BLUE;
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

