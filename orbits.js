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
			canvas.arc(X, Y, radius, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
	},
	varTable: function () {
		var properTime = this.n * INIT.timeStep;
		if (! NEWTON.collided) {
			NEWTON.rDisplay.innerHTML = NEWTON.r.toFixed(1);
			NEWTON.phiDisplay.innerHTML = GLOBALS.phiDegrees(NEWTON.phi);
			NEWTON.tDisplay.innerHTML = properTime.toFixed(0);
		}
		if (! GR.collided) {
			GR.tDisplay.innerHTML = GR.t.toFixed(0);
			GR.rDisplay.innerHTML = GR.r.toFixed(1);
			GR.phiDisplay.innerHTML = GLOBALS.phiDegrees(GR.phi);
			GR.tauDisplay.innerHTML = properTime.toFixed(0);
		}
	},
	pointX: function (r, phi) {
		return this.originX + r * Math.cos(phi);
	},
	pointY: function (r, phi) {
		return this.originY + r * Math.sin(phi);
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
	plotPotential: function (model, energy, minPotential) {
		var canvas = model.fgPotential;
		var blank = this.blankSize;
		var rAxis = this.potentialY;
		var yValue2 = this.potentialY + 180.0 * (energy - model.V(model.r, model.L)) / (energy - minPotential);
		canvas.clearRect(model.r - blank, rAxis - blank, 2 * blank, yValue2 + 2 * blank);
		// Potential ball
		canvas.fillStyle = model.colour;
			canvas.beginPath();
			canvas.arc(model.r, rAxis, this.ballSize, 0, GLOBALS.TWOPI, true);
			canvas.closePath();
		canvas.fill();
		// Potential dropline
		canvas.strokeStyle = model.colour;
			canvas.beginPath();
			canvas.moveTo(model.r, rAxis);
			canvas.lineTo(model.r, yValue2);
		canvas.stroke();
	},
	clearPotential: function (model, energy, minPotential) {
		var blank = this.blankSize;
		var rAxis = this.potentialY;
		var yValue2 = this.potentialY + 180.0 * (energy - model.V(model.r, model.L)) / (energy - minPotential);
		model.fgPotential.clearRect(model.r - blank, rAxis - blank, 2 * blank, yValue2 + 2 * blank);
	},
	directionChange: function (model) {
		var phiDegrees = GLOBALS.phiDegrees(model.phi);
		if (model.direction === 1) {
			model.pDisplay.innerHTML = phiDegrees;
			console.log(model.name + " - Periapsis: PHI = " + phiDegrees);
		} else {
			model.aDisplay.innerHTML = phiDegrees;
			console.log(model.name + " - Atapsis: PHI = " + phiDegrees);
		}
	},
};

var drawBackground = function () {
	var grd;
	var vEn;
	var vE;
	var i;
	DISPLAY.circularGradient(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, DISPLAY.WHITE, DISPLAY.BLACK);
	grd = GR.bgPotential.createLinearGradient(0, 0, DISPLAY.width, 0);
	grd.addColorStop(0, "white");
	grd.addColorStop(1, "black");
	// Stable orbit limit
	DISPLAY.bg.globalAlpha = 0.2;
	DISPLAY.circle(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, 3.0 * INIT.Rs, DISPLAY.YELLOW);
	// Unstable orbit limit
	DISPLAY.bg.globalAlpha = 0.6;
	DISPLAY.circle(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, 1.5 * INIT.Rs, DISPLAY.RED);
	// Gravitational radius
	DISPLAY.bg.globalAlpha = 1.0;
	DISPLAY.circle(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, INIT.Rs, DISPLAY.BLACK);
	// Newton energy
	NEWTON.bgPotential.fillStyle = grd;
	NEWTON.bgPotential.fillRect(0, 0, DISPLAY.width, 200);
	NEWTON.bgPotential.fillStyle = DISPLAY.BLACK;
	NEWTON.bgPotential.fillRect(0, 0, INIT.Rs, 200);
	NEWTON.bgPotential.fillStyle = DISPLAY.BLACK;
	NEWTON.bgPotential.fillRect(0, 0, INIT.Rs, 200); 
	DISPLAY.energyBar(NEWTON);
	// GR energy
	GR.bgPotential.fillStyle = grd;
	GR.bgPotential.fillRect(0, 0, DISPLAY.width, 200);
	GR.bgPotential.globalAlpha = 0.2;
	GR.bgPotential.fillStyle = DISPLAY.YELLOW;
	GR.bgPotential.fillRect(0, 0, 3.0 * INIT.Rs, 200); 
	GR.bgPotential.globalAlpha = 0.6;
	GR.bgPotential.fillStyle = DISPLAY.RED;
	GR.bgPotential.fillRect(0, 0, 1.5 * INIT.Rs, 200); 
	GR.bgPotential.globalAlpha = 1.0;
	GR.bgPotential.fillStyle = DISPLAY.BLACK;
	GR.bgPotential.fillRect(0, 0, INIT.Rs, 200);
	DISPLAY.energyBar(GR);
	// Effective potentials
	for (i = DISPLAY.rMin; i < DISPLAY.originX; i += 1) {
		// Newton effective potential locus
		vEn = NEWTON.V(i, NEWTON.L);
		if (vEn <= NEWTON.E) {
			NEWTON.bgPotential.fillStyle = DISPLAY.BLACK;
				NEWTON.bgPotential.beginPath();
				NEWTON.bgPotential.arc(i, DISPLAY.potentialY + 180.0 * (NEWTON.E - vEn) / (NEWTON.E - NEWTON.vC), 1, 0, GLOBALS.TWOPI, true);
				NEWTON.bgPotential.closePath();
			NEWTON.bgPotential.fill();
		}
		// GR effective potential locus
		vE = GR.V(i, GR.L);
		if (vE <= GR.E2) {
			GR.bgPotential.fillStyle = DISPLAY.BLACK;
				GR.bgPotential.beginPath();
				GR.bgPotential.arc(i, DISPLAY.potentialY + 180.0 * (GR.E2 - vE) / (GR.E2 - GR.vMin()), 1, 0, GLOBALS.TWOPI, true);
				GR.bgPotential.closePath();
			GR.bgPotential.fill();
		}
	}
	NEWTON.eDisplay.innerHTML = NEWTON.E.toFixed(6);
	NEWTON.lDisplay.innerHTML = NEWTON.L.toFixed(2);
	GR.eDisplay.innerHTML = GR.E.toFixed(6);
	GR.lDisplay.innerHTML = GR.L.toFixed(2);
};

var drawForeground = function () {
	if ((DISPLAY.n % 10) === 0) {
		DISPLAY.varTable();
	}
	if (! NEWTON.collided) {
		NEWTON.update();
		DISPLAY.plotOrbit(NEWTON);
		DISPLAY.plotPotential(NEWTON, NEWTON.E, NEWTON.vC);
	}
	if (! GR.collided) {
		GR.update();
		DISPLAY.plotOrbit(GR);
		DISPLAY.plotPotential(GR, GR.E2, GR.vMin());
	}
	DISPLAY.n = DISPLAY.n + 1;
};

var initModels = function () {
	console.info("rDot: " + INIT.rDot + "\n");
	console.info("TimeStep: " + INIT.timeStep + "\n");
	DISPLAY.rMin = Math.round(INIT.Rs);
	// Newton initial conditions
	INIT.initialize(NEWTON);
	NEWTON.initialize();
	NEWTON.X = DISPLAY.pointX(NEWTON.r, NEWTON.phi);
	NEWTON.Y = DISPLAY.pointY(NEWTON.r, NEWTON.phi);
	NEWTON.colour = DISPLAY.GREEN;
	// GR initial conditions
	INIT.initialize(GR);
	GR.initialize();
	GR.X = DISPLAY.pointX(GR.r, GR.phi);
	GR.Y = DISPLAY.pointY(GR.r, GR.phi);
	GR.colour = DISPLAY.BLUE;
}

var getDom = function () {
	var polar = document.getElementById('fgorbit');
	var potential = document.getElementById('fgpotn');
	DISPLAY.originX = polar.width / 2;
	DISPLAY.originY = polar.height / 2;
	DISPLAY.width = potential.width;
	DISPLAY.fg = polar.getContext('2d');
	DISPLAY.bg = document.getElementById('bgorbit').getContext('2d');
	NEWTON.fgPotential = document.getElementById('fgpotn').getContext('2d');
	NEWTON.bgPotential = document.getElementById('bgpotn').getContext('2d');
	GR.fgPotential = document.getElementById('fgpotgr').getContext('2d');
	GR.bgPotential = document.getElementById('bgpotgr').getContext('2d');
	NEWTON.eDisplay = document.getElementById('eNEWTON');
	NEWTON.lDisplay = document.getElementById('lNEWTON');
	NEWTON.tDisplay = document.getElementById('timeNEWTON');
	NEWTON.rDisplay = document.getElementById('rNEWTON');
	NEWTON.phiDisplay = document.getElementById('phiNEWTON');
	NEWTON.pDisplay = document.getElementById('pNEWTON');
	NEWTON.aDisplay = document.getElementById('aNEWTON');
	GR.eDisplay = document.getElementById('eGR');
	GR.lDisplay = document.getElementById('lGR');
	GR.tDisplay = document.getElementById('tGR');
	GR.rDisplay = document.getElementById('rGR');
	GR.phiDisplay = document.getElementById('phiGR');
	GR.tauDisplay = document.getElementById('tauGR');
	GR.pDisplay = document.getElementById('pGR');
	GR.aDisplay = document.getElementById('aGR');
};

var scenarioChange = function () {
	var form = document.getElementById('scenarioForm');
	DISPLAY.refreshId && clearInterval(DISPLAY.refreshId);
	getDom();
	DISPLAY.clearOrbit(NEWTON);
	DISPLAY.clearPotential(NEWTON, NEWTON.E, NEWTON.vC);
	DISPLAY.clearOrbit(GR);
	DISPLAY.clearPotential(GR, GR.E2, GR.vMin());
	DISPLAY.n = 0;
	for (var i = 0; i < form.length; i++) {
		if (form.elements[i].type === 'radio' && form.elements[i].checked) {
			if (form.elements[i].value === 'edge') {
				INIT.setKnifeEdge();
			} else if (form.elements[i].value === 'stable') {
				INIT.setJustStable();
			} else if (form.elements[i].value === 'precess') {
				INIT.setPrecession();
			}
			console.info(form.elements[i].value + " selected");
		}
	}
	initModels();
	drawBackground();
	DISPLAY.refreshId = setInterval(drawForeground, DISPLAY.msRefresh);
	return false;
};

window.onload = function () {
	scenarioChange();
};

