/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	debug: true,
	TWOPI: 2.0 * Math.PI,
	// Physical constants
	c: 299792.458,
	G: 6.67398e-11,
	mSolar: 1.9891e30,
	rSolar: 700000.0,
	hgR: 58e9,
	ergosphere: 2.0,
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
			model.rMinDisplay.innerHTML = (INIT.M * r).toExponential(2);
			this.debug && console.log(model.name + " - Periapsis: Rmin = " + (INIT.M * r).toExponential(2));
			model.pDisplay.innerHTML = phiDegrees + "&deg;";
			this.debug && console.log(model.name + " - Periapsis: PHI = " + phiDegrees);
		} else {
			model.rMaxDisplay.innerHTML = (INIT.M * r).toExponential(2);
			this.debug && console.log(model.name + " - Apapsis: Rmax = " + (INIT.M * r).toExponential(2));
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
		GLOBALS.debug && console.info("Restarting . . . ");
		this.timeStep = this.getFloatById('timestep') * 1000000000.0;
		this.lFac = this.getFloatById('lfactor') / 100.0;
		this.M = this.getFloatById('mass') * 1.4771;
//		this.M = this.getFloatById('mass') * GLOBALS.mSolar * GLOBALS.G / (GLOBALS.c * GLOBALS.c);
		GLOBALS.debug && console.info(this.name + ".M: " + this.M.toFixed(3));
		this.r = this.getFloatById('radius') / this.M;
		GLOBALS.debug && console.info(this.name + ".r: " + this.r.toFixed(1));
		this.a = this.getFloatById('spin');
		GLOBALS.debug && console.info(this.name + ".a: " + this.a.toFixed(1));
		if (this.a >= 0.0) {
			GLOBALS.prograde = true;
		} else {
			GLOBALS.prograde = false;
		}
		this.horizon = 1.0 + Math.sqrt(1.0 - this.a * this.a);
		GLOBALS.debug && console.info(this.name + ".horizon: " + this.horizon.toFixed(1));
		this.deltaPhi = this.a / (this.horizon * this.horizon + this.a * this.a) * this.timeStep;
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
		this.L = this.circular();
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.L = this.L * INIT.lFac;
	},
	circular: function () {
		return Math.sqrt(this.r);
	},
	V: function (r) {
		var L = this.L;
		return - 1.0 / r + L * L / (2.0 * r * r);
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
		this.circular();
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		GLOBALS.debug && console.info(this.name + ".E: " + this.E.toFixed(6));
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.L = this.L * INIT.lFac;
		this.t = 0.0;
		this.tDot = 1.0;
		this.rDot = 0.0;
		this.phiDot = 0.0;
	},
	circular: function () {
		var a = INIT.a;
		var r = this.r
		var sqrtR = Math.sqrt(r);
		var r2 = r * r;
		var tmp = Math.sqrt(r2 - 3.0 * r + 2.0 * a * sqrtR);
		this.L = (r2 - 2.0 * a * sqrtR + a * a) / (sqrtR * tmp);
		this.E = (r2 - 2.0 * r + a * sqrtR) / (r * tmp);
	},
	V: function (r) {
		var a = INIT.a;
		var L = this.L;
		var E = this.E;
		var r2 = r * r;
		var a2 = a * a;
		var E2 = E * E;
		var L2 = L * L;
		return - 1.0 / r + (L2 - a2 * (E2 - 1.0)) / (2.0 * r2) - (L2 - 2.0 * a * E * L + a2 * E2) / (r2 * r);
	},
	update: function () {
		var step = INIT.timeStep;
		var r = this.r;
		var L = this.L;
		var E = this.E;
		var a = INIT.a;
		var delta, tmp;
		if (r > INIT.horizon) {
			GLOBALS.updateR(this);
			delta = r * r + a * a - 2.0 * r;
			tmp = 2.0 / r;
			this.phiDot = ((1.0 - tmp) * L + a * tmp * E) / delta;
			this.phi += this.phiDot * step;
			this.tDot = ((r * r + a * a * (1.0 + tmp)) * E - a * tmp * L ) / delta;
			this.t += this.tDot * step;
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
		this.L = this.circular();
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.E = Math.sqrt(2.0 * this.energyBar + 1);
		GLOBALS.debug && console.info(this.name + ".E: " + this.E.toFixed(6));
		this.L = this.L * INIT.lFac;
		this.t = 0.0;
		this.tDot = 1.0;
		this.rDot = 0.0;
		this.phiDot = 0.0;
	},
	circular: function () {
		return this.r / Math.sqrt(this.r - 3.0);
	},
	V: function (r) {
		var L = this.L;
		return - 1.0 / r + L * L / (2.0 * r * r) - L * L / (r * r * r);
	},
	update: function () {
		var step = INIT.timeStep;
		var r = this.r;
		var L = this.L;
		var E = this.E;
		if (r > INIT.horizon) {
			GLOBALS.updateR(this);
			this.phiDot = L / (r * r);
			this.phi += this.phiDot * step;
			this.tDot = E / (1.0 - 2.0 / r);
			this.t += this.tDot * step;
		} else {
			this.collided = true;
			GLOBALS.debug && console.info(this.name + " - collided\n");
		}
	},
};
*/

