/*jslint white: true, browser: true, safe: true */

"use strict";

var DISPLAY = {
	msInterval: 10,
	// Misc. constants
	originX: 600.0,
	originY: 300.0,
	BLACK: "#000000",
	RED: "#ff0000",
	GREEN: "#00ff00",
	BLUE: "#0000ff",
	YELLOW: "#ffff00",
	n: 0,
	rMin: Math.round(INIT.Rs),
	rMax: 300,
	ballSize: 3,
	blankSize: 5,
	circle: function (X, Y, radius, colour) {
		DISPLAY.bg.fillStyle = colour;
			DISPLAY.bg.beginPath();
			DISPLAY.bg.arc(X, Y, radius, 0, GLOBALS.TWOPI, true);
			DISPLAY.bg.closePath();
		DISPLAY.bg.fill();
	},
	times: function () {
		if ((DISPLAY.n % 10) === 0) {
			DISPLAY.fg.clearRect(0, 0, 200, 100);
			DISPLAY.fg.fillStyle = DISPLAY.BLACK;
			DISPLAY.fg.fillText("Proper time: " + (DISPLAY.n * INIT.time_step), 10, 50); 
			DISPLAY.fg.fillText("   Map time: " + Math.round(gr.t), 10, 90);
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
		DISPLAY.bg.strokeStyle = DISPLAY.BLACK;
			DISPLAY.bg.beginPath();
			DISPLAY.bg.moveTo(DISPLAY.rMin, model.potentialY);
			DISPLAY.bg.lineTo(DISPLAY.rMax, model.potentialY);
		DISPLAY.bg.stroke();
	},
	plotPotential: function (model, energy, minPotential) {
		var yValue2 = model.potentialY + 180.0 * (energy - model.vEff(model.r, model.L)) / (energy - minPotential);
		DISPLAY.fg.clearRect(model.r - DISPLAY.blankSize, model.potentialY - DISPLAY.blankSize, 2 * DISPLAY.blankSize, yValue2 + 2 * DISPLAY.blankSize);
		if (model.r > INIT.Rs) {
			// Potential ball
			DISPLAY.fg.fillStyle = model.colour;
				DISPLAY.fg.beginPath();
				DISPLAY.fg.arc(model.r, model.potentialY, DISPLAY.ballSize, 0, GLOBALS.TWOPI, true);
				DISPLAY.fg.closePath();
			DISPLAY.fg.fill();
			// Potential dropline
			DISPLAY.fg.strokeStyle = model.colour;
				DISPLAY.fg.beginPath();
				DISPLAY.fg.moveTo(model.r, model.potentialY);
				DISPLAY.fg.lineTo(model.r, yValue2);
			DISPLAY.fg.stroke();
		}
	},
};

var drawBackground = function () {
	// Stable orbit limit
	DISPLAY.circle(DISPLAY.originX, DISPLAY.originY, 3.0 * INIT.Rs, DISPLAY.YELLOW);
	// Unstable orbit limit
	DISPLAY.circle(DISPLAY.originX, DISPLAY.originY, 1.5 * INIT.Rs, DISPLAY.RED);
	// Gravitational radius
	DISPLAY.circle(DISPLAY.originX, DISPLAY.originY, INIT.Rs, DISPLAY.BLACK);
	// Newton energy
	DISPLAY.energyBar(newton);
	// GR energy
	DISPLAY.energyBar(gr);
	// Effective potentials
	for (var i = DISPLAY.rMin; i < DISPLAY.rMax; i += 1) {
		// Newton effective potential locus
		var vEn = newton.vEff(i, newton.L);
		if (vEn <= newton.E) {
			DISPLAY.bg.fillStyle = DISPLAY.BLACK;
				DISPLAY.bg.beginPath();
				DISPLAY.bg.arc(i, newton.potentialY + 180.0 * (newton.E - vEn) / (newton.E - newton.vC), 1, 0, GLOBALS.TWOPI, true);
				DISPLAY.bg.closePath();
			DISPLAY.bg.fill();
		}
		// GR effective potential locus
		var vE = gr.vEff(i, gr.L);
		if (vE <= gr.E2) {
			DISPLAY.bg.fillStyle = DISPLAY.BLACK;
				DISPLAY.bg.beginPath();
				DISPLAY.bg.arc(i, gr.potentialY + 180.0 * (gr.E2 - vE) / (gr.E2 - gr.vMin()), 1, 0, GLOBALS.TWOPI, true);
				DISPLAY.bg.closePath();
			DISPLAY.bg.fill();
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
	var canvas = document.getElementById('fgcanvas');
	DISPLAY.width = canvas.width;
	DISPLAY.height = canvas.height;
	DISPLAY.fg = canvas.getContext('2d');
	DISPLAY.bg = document.getElementById('bgcanvas').getContext('2d');
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
	newton.potentialY = 210;
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
	gr.potentialY = 410;
	// Kick-off
	drawBackground();
	setInterval(drawForeground, DISPLAY.msInterval);
};

