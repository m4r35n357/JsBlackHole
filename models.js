/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	debug: false,
	TWOPI: 2.0 * Math.PI,
	// Physical constants
	c: 1.0,
	G: 1.0,
	phiDegrees: function (phiRadians) {
		return (phiRadians * 360.0 / this.TWOPI % 360).toFixed(0);
	},
	rTurnAround: function (model) {
		return - 2.0 * ((model.vNew - model.energyBar) / (model.vNew - model.V(model.rOld)) - 0.5) * model.rDot * INIT.timeStep;
	},
	reportDirectionChange: function (model) {
		var r = model.r.toFixed(1);
		var phiDegrees = this.phiDegrees(model.phi);
		if (model.direction === 1) {
			model.rMinDisplay.innerHTML = r;
			this.debug && console.log(model.name + " - Periapsis: Rmin = " + r);
			model.pDisplay.innerHTML = phiDegrees + "&deg;";
			this.debug && console.log(model.name + " - Periapsis: PHI = " + phiDegrees);
		} else {
			model.rMaxDisplay.innerHTML = r;
			this.debug && console.log(model.name + " - Apapsis: Rmax = " + r);
			model.aDisplay.innerHTML = phiDegrees + "&deg;";
			this.debug && console.log(model.name + " - Apapsis: PHI = " + phiDegrees);
		}
	},
	updateR: function (model) {
		var rDot2;
		model.vNew = model.V(model.r);
		rDot2 = 2.0 * (model.energyBar - model.vNew);
		if (rDot2 >= 0.0) {
			model.rOld = model.r;
			model.rDot = model.direction * Math.sqrt(rDot2);
			model.r += model.rDot * INIT.timeStep;
		} else {
			model.rDot = model.direction * Math.sqrt(- rDot2);
			model.direction = - model.direction;
			model.r = model.rOld + this.rTurnAround(model);
			this.reportDirectionChange(model);
		}
	},
};

var INIT = {
	name: "INIT",
	phi: 0.0,
 	direction: -1.0,
	getFloatById: function (id) {
		return parseFloat(document.getElementById(id).value);
	},
	getHtmlValues: function () {
		var M = this.getFloatById('mass') * GLOBALS.G / (GLOBALS.c * GLOBALS.c);
		GLOBALS.debug && console.info("Restarting . . . ");
		this.timeStep = this.getFloatById('timestep');
		this.lFac = this.getFloatById('lfactor') / 100.0;
		this.M = M;
		GLOBALS.debug && console.info(this.name + ".M: " + this.M.toFixed(1));
//		this.Rs = 2.0 * GLOBALS.G * M / (GLOBALS.c * GLOBALS.c);
		this.r = this.getFloatById('radius');
		this.a = this.getFloatById('spin') * M;
		GLOBALS.debug && console.info(this.name + ".a: " + this.a.toFixed(1));
		if (this.a >= 0.0) {
			GLOBALS.prograde = true;
		} else {
			GLOBALS.prograde = false;
		}
		this.horizon = M + Math.sqrt(M * M - this.a * this.a);
		GLOBALS.debug && console.info(this.name + ".horizon: " + this.horizon.toFixed(1));
		this.omega = this.a / (this.horizon * this.horizon + this.a * this.a);
	},
	initialize: function (model) {
		model.collided = false;
		model.r = this.r;
		model.rOld = this.r;
		model.phi = this.phi;
		model.direction = this.direction;
	},
};

var NEWTON = {
	name: "NEWTON",
	initialize: function () {
		this.L = this.circL();
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.L = this.L * INIT.lFac;
	},
	circL: function () {
		return Math.sqrt(this.r * INIT.M);
	},
	V: function (r) {
		var L = this.L;
		return - INIT.M / r + L * L / (2.0 * r * r);
	},
	update: function () {
		var step = INIT.timeStep;
		var r = this.r;
		var L = this.L;
		if (r > INIT.horizon) {
			GLOBALS.updateR(this);
			this.phiDot = L / (r * r);
			this.phi += this.phiDot * step;
		} else {
			this.collided = true;
			GLOBALS.debug && console.info(this.name + " - collided\n");
		}
	},
};

var GR = {
	name: "GR",
	initialize: function () {
		this.t = 0.0;
		this.L = this.circL();
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		this.E = this.circE();
		GLOBALS.debug && console.info(this.name + ".E: " + this.E.toFixed(6));
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.L = this.L * INIT.lFac;
		this.tDot = 1.0;
		this.rDot = 0.0;
		this.phiDot = 0.0;
	},
	circL: function () {
		var M = INIT.M;
		var a = INIT.a / M;
		var r = this.r / M;
		var sqrtR = Math.sqrt(r);
		var r2 = r * r;
		return INIT.M * (r2 - 2.0 * a * sqrtR + a * a) / (sqrtR * Math.sqrt(r2 - 3.0 * r + 2.0 * a * sqrtR));
	},
	circE: function () {
		var M = INIT.M;
		var a = INIT.a / M;
		var r = this.r / M;
		var sqrtR = Math.sqrt(r);
		var r2 = r * r;
		return (r2 - 2.0 * r + a * sqrtR) / (r * Math.sqrt(r2 - 3.0 * r + 2.0 * a * sqrtR));
	},
	V: function (r) {
		var M = INIT.M;
		var a = INIT.a;
		var L = this.L;
		var E = this.E;
		return - M / r + (L * L - a * a * (E * E - 1.0)) / (2.0 * r * r) - M * (L - a * E) * (L - a * E) / (r * r * r);
	},
	update: function () {
		var M = INIT.M;
//		var Rs = INIT.Rs;
		var step = INIT.timeStep;
		var r = this.r;
		var L = this.L;
		var E = this.E;
		var a = INIT.a;
		var delta;
		if (r > INIT.horizon) {
			GLOBALS.updateR(this);
			delta = r * r + a * a - 2.0 * M * r;
			this.phiDot = ((1.0 - 2.0 * M / r) * L + 2.0 * M * a / r * E) / delta;
			this.phi += this.phiDot * step;
			this.tDot = ((r * r + a * a + 2.0 * M * a * a / r) * E - 2.0 * M * a / r * L ) / delta;
			this.t += this.tDot * M * step;
		} else {
			this.collided = true;
			GLOBALS.debug && console.info(this.name + " - collided\n");
		}
	},
};
/*
var GR = {
	name: "GR",
	initialize: function () {
		this.t = 0.0;
		this.L = this.circL();
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.E = Math.sqrt(2.0 * this.energyBar + 1);
		GLOBALS.debug && console.info(this.name + ".E: " + this.E.toFixed(6));
		this.L = this.L * INIT.lFac;
		this.tDot = 1.0;
		this.rDot = 0.0;
		this.phiDot = 0.0;
	},
	circL: function () {
		return this.r / Math.sqrt(2.0 * this.r / 2.0 * INIT.M - 3.0);
	},
	V: function (r) {
		var M = INIT.M;
		var L = this.L;
		return - M / r + L * L / (2.0 * r * r) - M * L * L / (r * r * r);
	},
	update: function () {
//		var Rs = INIT.Rs;
		var step = INIT.timeStep;
		var r = this.r;
		var L = this.L;
		var E = this.E;
		if (r > INIT.horizon) {
			GLOBALS.updateR(this);
			this.phiDot = L / (r * r);
			this.phi += this.phiDot * step;
			this.tDot = E / (1.0 - 2.0 * INIT.M / r);
			this.t += this.tDot * step;
		} else {
			this.collided = true;
			GLOBALS.debug && console.info(this.name + " - collided\n");
		}
	},
};
*/

