/*
    Copyright (C) 2013  Ian Smith <m4r35n357@gmail.com>

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

    As additional permission under GNU GPL version 3 section 7, you
    may distribute non-source (e.g., minimized or compacted) forms of
    that code without the copy of the GNU GPL normally required by
    section 4, provided you include this license notice and a URL
    through which recipients can access the Corresponding Source.
*/

/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	debug: true,
	TWOPI: 2.0 * Math.PI,
	CUBEROOT2: Math.pow(2.0, 1.0 / 3.0),
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
	speed: function (model) {
		return this.c * Math.sqrt(model.rDot * model.rDot + model.r * model.r * model.phiDot * model.phiDot);
	},
	reportDirectionChange: function (model) {
		var r = model.r;
		var phiDegrees = this.phiDegrees(model.phi);
		if (model.direction === -1) {
			model.rMinDisplay.innerHTML = (INIT.M * r).toFixed(1);
			model.pDisplay.innerHTML = phiDegrees + "&deg;";
			this.debug && console.log(model.name + " - Perihelion: R = " + (INIT.M * r).toExponential(2) + ", PHI = " + phiDegrees);
		} else {
			model.rMaxDisplay.innerHTML = (INIT.M * r).toFixed(1);
			model.aDisplay.innerHTML = phiDegrees + "&deg;";
			this.debug && console.log(model.name + " - Aphelion: R = " + (INIT.M * r).toExponential(2) + ", PHI = " + phiDegrees);
		}
	},
	h: function (model) {  // the radial "Hamiltonian"
		var h = 0.5 * model.rDot * model.rDot + model.V(model.r);
		var h0 = model.h0;
		this.debug && console.log(model.name + " - H0: " + h0.toExponential(3) + ", H: " + h.toExponential(3) + ", Error: " + ((h - h0) / h0).toExponential(1));
		return h;
	},
	sympBase: function (model, c) { // 2nd-order symplectic building block
		model.updateQ(c * 0.5);
		model.updateP(c);
		model.updateQ(c * 0.5);
	},
	updateR: function (model) {  // Stormer-Verlet integrator, 4th-order
		var rOld = model.rOld = model.r;
		var y = 1.0 / (2.0 - this.CUBEROOT2);
		this.sympBase(model, y);
		this.sympBase(model, - this.CUBEROOT2 * y);
		this.sympBase(model, y);
		if (((model.r > rOld) && (model.direction < 0)) || ((model.r < rOld) && (model.direction > 0))) {
			this.reportDirectionChange(model);
			model.direction = - model.direction;
			this.h(model);
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
		this.timeStep = this.getFloatById('timestep') * 500000000.0;
		this.lFac = this.getFloatById('lfactor') / 100.0;
		this.M = this.getFloatById('mass') * 0.000000001 * GLOBALS.mSolar * GLOBALS.G / (GLOBALS.c * GLOBALS.c);
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
		GLOBALS.debug && console.info(this.name + ".horizon: " + this.horizon.toFixed(3));
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
		var V0;
		this.circular(this.r);
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		this.L2 = this.L * this.L;
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.L = this.L * INIT.lFac;
		this.L2 = this.L * this.L;
		V0 = this.V(this.r); // using (possibly) adjusted L from above
		this.rDot = - Math.sqrt(2.0 * (this.energyBar - V0));
		this.h0 =  0.5 * this.rDot * this.rDot + V0;
	},
	circular: function (r) {  // L for a circular orbit of r
		this.L = Math.sqrt(r);
	},
	V: function (r) {  // the Effective Potential
		return - 1.0 / r + this.L2 / (2.0 * r * r);
	},
	updateQ: function (c) {  // update radial position
		this.r += c * this.rDot * INIT.timeStep;
	},
	updateP: function (c) {  // update radial momentum
		var r = this.r;
		this.rDot -= c * (1.0 / (r * r) - this.L2 / (r * r * r)) * INIT.timeStep;
	},
	update: function () {
		var step = INIT.timeStep;
		var r = this.r;
		var L = this.L;
		if (this.r > INIT.horizon) {
			GLOBALS.updateR(this);
			this.phiDot = L / (r * r);
			this.phi += this.phiDot * step;
		} else {
			this.collided = true;
			GLOBALS.debug && console.info(this.name + " - collided\n");
		}
	},
};

var GR = { // can be spinning
	name: "GR",
	initialize: function () {
		var V0;
		this.circular(this.r, INIT.a);
		GLOBALS.debug && console.info(this.name + ".L: " + this.L.toFixed(3));
		GLOBALS.debug && console.info(this.name + ".E: " + this.E.toFixed(6));
		this.potentialFactors(this.L, this.E, INIT.a);
		this.energyBar = this.V(this.r);
		GLOBALS.debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.L = this.L * INIT.lFac;
		this.potentialFactors(this.L, this.E, INIT.a);
		this.t = 0.0;
		this.tDot = 1.0;
		V0 = this.V(this.r); // using (possibly) adjusted L from above
		this.rDot = - Math.sqrt(2.0 * (this.energyBar - V0));
		this.h0 =  0.5 * this.rDot * this.rDot + V0;
	},
	circular: function (r, a) {  // L and E for a circular orbit of r
		var sqrtR = Math.sqrt(r);
		var tmp = Math.sqrt(r * r - 3.0 * r + 2.0 * a * sqrtR);
		this.L = (r * r - 2.0 * a * sqrtR + a * a) / (sqrtR * tmp);
		this.E = (r * r - 2.0 * r + a * sqrtR) / (r * tmp);
	},
	potentialFactors: function (L, E, a) {
		this.k1 = L * L - a * a * (E * E - 1.0);
		this.k2 = (L - a * E) * (L - a * E);
	},
	V: function (r) {  // the Effective Potential
		return - 1.0 / r + this.k1 / (2.0 * r * r) - this.k2 / (r * r * r);
	},
	updateQ: function (c) {  // update radial position
		this.r += c * this.rDot * INIT.timeStep;
	},
	updateP: function (c) {  // update radial momentum
		var r = this.r;
		this.rDot -= c * (1.0 / (r * r) - this.k1 / (r * r * r) + 3.0 * this.k2 / (r * r * r * r)) * INIT.timeStep;
	},
	update: function () {
		var step = INIT.timeStep;
		var r = this.r;
		var L = this.L;
		var E = this.E;
		var a = INIT.a;
		var delta;
		if (r > INIT.horizon) {
			GLOBALS.updateR(this);
			delta = r * r + a * a - 2.0 * r;
			this.phiDot = ((1.0 - 2.0 / r) * L + 2.0 * a * E / r) / delta;
			this.phi += this.phiDot * step;
			this.tDot = ((r * r + a * a * (1.0 + 2.0 / r)) * E - 2.0 * a * L / r) / delta;
			this.t += this.tDot * step;
		} else {
			this.collided = true;
			GLOBALS.debug && console.info(this.name + " - collided\n");
		}
	},
};

