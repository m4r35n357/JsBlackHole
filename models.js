/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	TWOPI: 2.0 * Math.PI,
	// Physical constants
	c: 1.0,
	G: 1.0,
	phiDegrees: function (phiRadians) {
		return (phiRadians * 360.0 / this.TWOPI % 360).toFixed(0);
	},
	rTurnAround: function (vNew, vOld, E, rDot, step) {
		return - 2.0 * ((vNew - E) / (vNew - vOld) - 0.5) * rDot * step;
	},
	directionChange: function (model) {
		var r = model.r.toFixed(1);
		var phiDegrees = this.phiDegrees(model.phi);
		if (model.direction === 1) {
			model.rMinDisplay.innerHTML = r;
			console.log(model.name + " - Periapsis: Rmin = " + r);
			model.pDisplay.innerHTML = phiDegrees + "&deg;";
			console.log(model.name + " - Periapsis: PHI = " + phiDegrees);
		} else {
			model.rMaxDisplay.innerHTML = r;
			console.log(model.name + " - Atapsis: Rmax = " + r);
			model.aDisplay.innerHTML = phiDegrees + "&deg;";
			console.log(model.name + " - Atapsis: PHI = " + phiDegrees);
		}
	},
	updateR: function (model, r, L, rOld, energyBar, step, direction) {
		var vNew = model.V(r, L);
		var rDot2 = 2.0 * (energyBar - vNew);
		var rDot;
		if (rDot2 >= 0.0) {
			model.rOld = r;
			model.rDot = direction * Math.sqrt(rDot2);
			model.r += model.rDot * step;
		} else {
			model.direction = - direction;
			model.rDot = direction * Math.sqrt(- rDot2);
			model.r = rOld + this.rTurnAround(vNew, model.V(rOld), energyBar, model.rDot, step);
			this.directionChange(model);
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
		var M = this.getFloatById('mass');
		console.info("Restarting . . . ");
		this.timeStep = this.getFloatById('timestep');
		this.lFac = this.getFloatById('lfactor') / 100.0;
		this.M = M;
		console.info(this.name + ".M: " + this.M.toFixed(1));
		this.Rs = 2.0 * GLOBALS.G * M / (GLOBALS.c * GLOBALS.c);
		this.r = this.getFloatById('radius');
		this.a = this.getFloatById('spin') * M;
		console.info(this.name + ".a: " + this.a.toFixed(1));
		if (this.a >= 0.0) {
			GLOBALS.prograde = true;
		} else {
			GLOBALS.prograde = false;
		}
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
		console.info(this.name + ".L: " + this.L.toFixed(3));
		this.energyBar = this.V(this.r, this.L);
		console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
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
		var rDot2;
		var vNew;
		var r = this.r;
		var rOld = this.rOld;
		var L = this.L;
		var energyBar = this.energyBar;
		var direction = this.direction;
		if (r > GR.horizon) {
			GLOBALS.updateR (this, r, L, rOld, energyBar, step, direction);
			this.phi += L / (r * r) * step;
		} else {
			this.collided = true;
			console.info(this.name + " - collided\n");
		}
	},
};

var GR = {
	name: "GR",
	initialize: function () {
		this.horizon = INIT.M + Math.sqrt(INIT.M * INIT.M - INIT.a * INIT.a);
		console.info(this.name + ".horizon: " + this.horizon.toFixed(1));
		this.t = 0.0;
		this.L = this.circL();
		console.info(this.name + ".L: " + this.L.toFixed(3));
		this.E = this.circE();
		console.info(this.name + ".E: " + this.E.toFixed(6));
		this.energyBar = this.V(this.r, this.L);
		console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
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
		var Rs = INIT.Rs;
		var step = INIT.timeStep;
		var rDot2;
		var vNew;
		var r = this.r;
		var rOld = this.rOld;
		var L = this.L;
		var E = this.E;
		var energyBar = this.energyBar;
		var direction = this.direction;
		var a = INIT.a;
		var delta;
		if (r > this.horizon) {
			GLOBALS.updateR (this, r, L, rOld, energyBar, step, direction);
			delta = r * r + a * a - Rs * r;
			this.phiDot = ((1.0 - Rs / r) * L + Rs * a / r * E) / delta;
			this.phi += this.phiDot * step;
			this.tDot = ((r * r + a * a + Rs * a * a / r) * E - Rs * a / r * L ) / delta;
			this.t += this.tDot * step;
		} else {
			this.collided = true;
			console.info(this.name + " - collided\n");
		}
	},
};
/*
var GR = {
	name: "GR",
	initialize: function () {
		this.horizon = INIT.Rs;
		console.info(this.name + ".horizon: " + this.horizon.toFixed(1));
		this.t = 0.0;
		this.L = this.circL();
		console.info(this.name + ".L: " + this.L.toFixed(3));
		this.energyBar = this.V(this.r, this.L);
		console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
		this.E = Math.sqrt(2.0 * this.energyBar + 1);
		console.info(this.name + ".E: " + this.E.toFixed(6));
		this.L = this.L * INIT.lFac;
		this.tDot = 1.0;
		this.rDot = 0.0;
		this.phiDot = 0.0;
	},
	circL: function () {
		return this.r / Math.sqrt(2.0 * this.r / INIT.Rs - 3.0);
	},
	V: function (r) {
		var M = INIT.M;
		var L = this.L;
		return - M / r + L * L / (2.0 * r * r) - M * L * L / (r * r * r);
	},
	update: function () {
		var Rs = INIT.Rs;
		var step = INIT.timeStep;
		var rDot2;
		var vNew;
		var r = this.r;
		var rOld = this.rOld;
		var L = this.L;
		var E = this.E;
		var energyBar = this.energyBar;
		var direction = this.direction;
		if (r > this.horizon) {
			GLOBALS.updateR (this, r, L, rOld, energyBar, step, direction);
			this.phiDot = L / (r * r);
			this.phi += this.phiDot * step;
			this.tDot = E / (1.0 - Rs / r);
			this.t += this.tDot * step;
		} else {
			this.collided = true;
			console.info(this.name + " - collided\n");
		}
	},
};
*/

