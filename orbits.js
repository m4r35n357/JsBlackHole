/*jslint white: true, browser: true, safe: true */

"use strict";

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
	NEWTON.bgPotential.fillRect(0, 0, DISPLAY.scale * INIT.Rs, 200);
	DISPLAY.energyBar(NEWTON);
	// GR energy
	GR.bgPotential.fillStyle = grd;
	GR.bgPotential.fillRect(0, 0, DISPLAY.width, 200);
	GR.bgPotential.globalAlpha = 0.2;
	GR.bgPotential.fillStyle = DISPLAY.YELLOW;
	GR.bgPotential.fillRect(0, 0, DISPLAY.scale * 3.0 * INIT.Rs, 200); 
	GR.bgPotential.globalAlpha = 0.6;
	GR.bgPotential.fillStyle = DISPLAY.RED;
	GR.bgPotential.fillRect(0, 0, DISPLAY.scale * 1.5 * INIT.Rs, 200); 
	GR.bgPotential.globalAlpha = 1.0;
	GR.bgPotential.fillStyle = DISPLAY.BLACK;
	GR.bgPotential.fillRect(0, 0, DISPLAY.scale * INIT.Rs, 200);
	DISPLAY.energyBar(GR);
	// Effective potentials
	for (i = DISPLAY.rMin; i < DISPLAY.originX / DISPLAY.scale; i += 1) {
		// Newton effective potential locus
		vEn = NEWTON.V(i, NEWTON.L);
		if (vEn <= NEWTON.E) {
			NEWTON.bgPotential.fillStyle = DISPLAY.BLACK;
				NEWTON.bgPotential.beginPath();
				NEWTON.bgPotential.arc(i * DISPLAY.scale, DISPLAY.potentialY + 180.0 * (NEWTON.E - vEn) / (NEWTON.E - NEWTON.vC), 1, 0, GLOBALS.TWOPI, true);
				NEWTON.bgPotential.closePath();
			NEWTON.bgPotential.fill();
		}
		// GR effective potential locus
		vE = GR.V(i, GR.L);
		if (vE <= GR.E2) {
			GR.bgPotential.fillStyle = DISPLAY.BLACK;
				GR.bgPotential.beginPath();
				GR.bgPotential.arc(i * DISPLAY.scale, DISPLAY.potentialY + 180.0 * (GR.E2 - vE) / (GR.E2 - GR.vMin()), 1, 0, GLOBALS.TWOPI, true);
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
	var element;
	DISPLAY.refreshId && clearInterval(DISPLAY.refreshId);
	getDom();
	DISPLAY.clearOrbit(NEWTON);
	DISPLAY.clearPotential(NEWTON, NEWTON.E, NEWTON.vC);
	DISPLAY.clearOrbit(GR);
	DISPLAY.clearPotential(GR, GR.E2, GR.vMin());
	DISPLAY.n = 0;
	for (var i = 0; i < form.length; i++) {
		element = form.elements[i];
		if (element.type === 'radio' && element.checked) {
			if (element.value === 'edge') {
				INIT.setKnifeEdge();
			} else if (element.value === 'stable') {
				INIT.setJustStable();
			} else if (element.value === 'precess') {
				INIT.setPrecession();
			}
			console.info(element.value + " selected");
		} else if (element.type === 'text' && element.name === 'scale') {
			DISPLAY.scale = parseFloat(element.value);
			console.info(element.name + ": " + element.value);
		} else if (element.type === 'text' && element.name === 'timestep') {
			INIT.timeStep = parseFloat(element.value);
			console.info(element.name + ": " + element.value);
		}
	}
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
	drawBackground();
	DISPLAY.refreshId = setInterval(drawForeground, DISPLAY.msRefresh);
	return false;
};

window.onload = function () {
	scenarioChange();
};

