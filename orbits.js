/*jslint white: true, browser: true, safe: true */

"use strict";

var drawBackground = function () {
	var grd;
	var i;
	var isco = DISPLAY.isco();
	DISPLAY.circularGradient(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, DISPLAY.WHITE, DISPLAY.BLACK);
	grd = GR.bgPotential.createLinearGradient(0, 0, DISPLAY.width, 0);
	grd.addColorStop(0, DISPLAY.WHITE);
	grd.addColorStop(1, DISPLAY.BLACK);
	// Solar perimeter
	DISPLAY.bg.strokeStyle = DISPLAY.YELLOW;
		DISPLAY.bg.beginPath();
		DISPLAY.bg.arc(DISPLAY.originX, DISPLAY.originY, DISPLAY.scale * GLOBALS.rSolar, 0, GLOBALS.TWOPI, true);
		DISPLAY.bg.closePath();
	DISPLAY.bg.stroke();
	// Stable orbit limit
	GLOBALS.debug && console.info("ISCO: " + isco.toFixed(1));
	DISPLAY.bg.globalAlpha = 0.2;
	DISPLAY.circle(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, INIT.M * isco, DISPLAY.YELLOW);
	// Ergoregion
	DISPLAY.bg.globalAlpha = 0.6;
	DISPLAY.circle(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, INIT.M * GLOBALS.ergosphere, DISPLAY.CYAN);
	// Gravitational radius
	DISPLAY.bg.globalAlpha = 1.0;
	DISPLAY.circle(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, INIT.M * INIT.horizon, DISPLAY.BLACK);
	// Newton energy
	NEWTON.bgPotential.fillStyle = grd;
	NEWTON.bgPotential.fillRect(0, 0, DISPLAY.width, 200);
	NEWTON.bgPotential.fillStyle = DISPLAY.BLACK;
	NEWTON.bgPotential.fillRect(0, 0, DISPLAY.scale * INIT.M * INIT.horizon, 200);
	// Solar perimeter
	NEWTON.bgPotential.strokeStyle = DISPLAY.YELLOW;
		NEWTON.bgPotential.beginPath();
		NEWTON.bgPotential.moveTo(GLOBALS.rSolar * DISPLAY.scale, 0);
		NEWTON.bgPotential.lineTo(GLOBALS.rSolar * DISPLAY.scale, 200);
	NEWTON.bgPotential.stroke();
	// Effective potentials
	DISPLAY.energyBar(NEWTON);
	DISPLAY.potential(NEWTON);
	// GR energy
	GR.bgPotential.fillStyle = grd;
	GR.bgPotential.fillRect(0, 0, DISPLAY.width, 200);
	// Stable orbit limit
	GR.bgPotential.globalAlpha = 0.2;
	GR.bgPotential.fillStyle = DISPLAY.YELLOW;
	GR.bgPotential.fillRect(0, 0, DISPLAY.scale * INIT.M * isco, 200); 
	// Ergoregion
	GR.bgPotential.globalAlpha = 0.6;
	GR.bgPotential.fillStyle = DISPLAY.CYAN;
	GR.bgPotential.fillRect(0, 0, DISPLAY.scale * INIT.M * GLOBALS.ergosphere, 200); 
	// Gravitational radius
	GR.bgPotential.globalAlpha = 1.0;
	GR.bgPotential.fillStyle = DISPLAY.BLACK;
	GR.bgPotential.fillRect(0, 0, DISPLAY.scale * INIT.M * INIT.horizon, 200);
	// Solar perimeter
	GR.bgPotential.strokeStyle = DISPLAY.YELLOW;
		GR.bgPotential.beginPath();
		GR.bgPotential.moveTo(GLOBALS.rSolar * DISPLAY.scale, 0);
		GR.bgPotential.lineTo(GLOBALS.rSolar * DISPLAY.scale, 200);
	GR.bgPotential.stroke();
	// Effective potentials
	DISPLAY.energyBar(GR);
	DISPLAY.potential(GR);
	// Constants of motion for table
	NEWTON.lDisplay.innerHTML = (INIT.M * NEWTON.L).toFixed(4);
	GR.eDisplay.innerHTML = (INIT.M * GR.E).toFixed(6);
	GR.lDisplay.innerHTML = (INIT.M * GR.L).toFixed(4);
	GR.rsDisplay.innerHTML = (2.0 * INIT.M).toFixed(3);
};

var drawForeground = function () {
	DISPLAY.refreshId && clearInterval(DISPLAY.refreshId);
	if ((DISPLAY.n % 10) === 0) {
		DISPLAY.varTable();
	}
	DISPLAY.plotRotation();
	if (! NEWTON.collided) {
		NEWTON.update();
		DISPLAY.plotOrbit(NEWTON.fg, NEWTON);
		DISPLAY.plotPotential(NEWTON);
	}
	if (! GR.collided) {
		GR.update();
		DISPLAY.plotOrbit(GR.fg, GR);
		DISPLAY.plotPotential(GR);
		DISPLAY.plotTauDot(GR);
	}
	DISPLAY.n += 1;
	DISPLAY.refreshId = setTimeout(drawForeground, DISPLAY.msRefresh);
};

var getDom = function () {
	var orbitPlot = document.getElementById('tracks');
	var potential = document.getElementById('fgpotn');
	DISPLAY.originX = orbitPlot.width / 2;
	DISPLAY.originY = orbitPlot.height / 2;
	DISPLAY.width = potential.width;
	DISPLAY.tracks = orbitPlot.getContext('2d');

	NEWTON.fg = document.getElementById('fgorbitn').getContext('2d');
	GR.fg = document.getElementById('fgorbitgr').getContext('2d');
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
	NEWTON.rMinDisplay = document.getElementById('rminNEWTON');
	NEWTON.pDisplay = document.getElementById('pNEWTON');
	NEWTON.rMaxDisplay = document.getElementById('rmaxNEWTON');
	NEWTON.aDisplay = document.getElementById('aNEWTON');
	NEWTON.vDisplay = document.getElementById('vNEWTON');
	GR.rsDisplay = document.getElementById('rs');
	GR.eDisplay = document.getElementById('eGR');
	GR.lDisplay = document.getElementById('lGR');
	GR.tDisplay = document.getElementById('tGR');
	GR.rDisplay = document.getElementById('rGR');
	GR.phiDisplay = document.getElementById('phiGR');
//	GR.betaDisplay = document.getElementById('betaGR');
	GR.tauDisplay = document.getElementById('tauGR');
	GR.rMinDisplay = document.getElementById('rminGR');
	GR.pDisplay = document.getElementById('pGR');
	GR.rMaxDisplay = document.getElementById('rmaxGR');
	GR.aDisplay = document.getElementById('aGR');
	GR.tDotDisplay = document.getElementById('tdotGR');
	GR.rDotDisplay = document.getElementById('rdotGR');
	GR.phiDotDisplay = document.getElementById('phidotGR');
	GR.tauDotDisplay = document.getElementById('taudotGR');
	GR.vDisplay = document.getElementById('vGR');
	INIT.getHtmlValues();
	DISPLAY.scale = INIT.getFloatById('scale') * 0.000005;
	if (document.getElementById('showTracks').checked) {
		DISPLAY.showTracks = true;
	} else {
		DISPLAY.showTracks = false;
	}
	document.getElementById('scenarioForm').onsubmit = scenarioChange;
};

var scenarioChange = function () {
	getDom();
	// Newton initial conditions
	INIT.initialize(NEWTON);
	NEWTON.initialize();
	NEWTON.X = DISPLAY.pointX(INIT.M * DISPLAY.scale * NEWTON.r, NEWTON.phi);
	NEWTON.Y = DISPLAY.pointY(INIT.M * DISPLAY.scale * NEWTON.r, NEWTON.phi);
	NEWTON.colour = DISPLAY.GREEN;
	// GR initial conditions
	INIT.initialize(GR);
	GR.initialize();
	GR.X = DISPLAY.pointX(INIT.M * DISPLAY.scale * GR.r, GR.phi);
	GR.Y = DISPLAY.pointY(INIT.M * DISPLAY.scale * GR.r, GR.phi);
	GR.colour = DISPLAY.BLUE;
	// Start drawing . . .
	drawForeground();
	drawBackground();
	return false;
};

window.onload = function () {
	scenarioChange();
};

