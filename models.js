/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	TWOPI: 2.0 * Math.PI,
	// Physical constants
	c: 1.0,
	G: 1.0,
	phiDegrees: function (phi) {
		return (phi * 360.0 / this.TWOPI % 360).toFixed(0);
	},
	rTurnAround: function (vNew, vOld, E, L, rDot2, step, direction) {
		return -2.0 * ((vNew - E) / (vNew - vOld) - 0.5) * direction * Math.sqrt(-rDot2) * step;
	},
};

var INIT = {
	phi: 0.0,
 	direction: -1.0,
	getFloatById: function (id) {
		return parseFloat(document.getElementById(id).value);
	},
	getHtmlValues: function () {
		var M = this.getFloatById('mass');
		this.M = M;
		this.Rs = 2.0 * GLOBALS.G * M / (GLOBALS.c * GLOBALS.c);
		this.r = this.getFloatById('radius');
		this.timeStep = this.getFloatById('timestep');
		this.lFac = this.getFloatById('lfactor') / 100.0;
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
		this.E = this.V(this.r, this.L);
		console.info(this.name + ".E: " + this.E.toFixed(6));
		this.L = this.L * INIT.lFac;
	},
	circL: function () {
		return Math.sqrt(this.r * INIT.Rs / 2.0);
	},
	V: function (r, L) {
		return (L * L / (r * r) - INIT.Rs / r) / 2.0;
	},
	update: function () {
		var step = INIT.timeStep;
		var rDot2;
		var vNew;
		var r = this.r;
		var rOld = this.rOld;
		var E = this.E;
		var L = this.L;
		var direction = this.direction;
		if (r > INIT.Rs) {
			vNew = this.V(r, L);
			// update positions (Newton)
			rDot2 = 2.0 * (E - vNew);
			if (rDot2 >= 0.0) {
				this.rOld = r;
				this.r += direction * Math.sqrt(rDot2) * step;
			} else {
				this.direction = - direction;
				this.r = rOld + GLOBALS.rTurnAround(vNew, this.V(rOld, L), E, L, rDot2, step, direction);
				DISPLAY.directionChange(this);
			}
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
		this.t = 0.0;
		this.L = this.circL();
		console.info(this.name + ".L: " + this.L.toFixed(3));
		this.E2 = this.V(this.r, this.L);
		console.info(this.name + ".E2: " + this.E2.toFixed(6));
		this.E = Math.sqrt(this.E2);
		console.info(this.name + ".E: " + this.E.toFixed(6));
		this.L = this.L * INIT.lFac;
	},
	circL: function () {
		return this.r / Math.sqrt(2.0 * this.r / INIT.Rs - 3.0);
	},
	V: function (r, L) {
		return (L * L / (r * r) + 1.0) * (1.0 - INIT.Rs / r);
	},
	update: function () {
		var Rs = INIT.Rs;
		var step = INIT.timeStep;
		var rDot2;
		var vNew;
		var r = this.r;
		var rOld = this.rOld;
		var E = this.E;
		var E2 = this.E2;
		var L = this.L;
		var direction = this.direction;
		if (r > Rs) {
			vNew = this.V(r, L);
			// update positions (GR)
			rDot2 = E2 - vNew;
			if (rDot2 >= 0.0) {
				this.rOld = r;
				this.r += direction * Math.sqrt(rDot2) * step;
			} else {
				this.direction = - direction;
				this.r = rOld + GLOBALS.rTurnAround(vNew, this.V(rOld, L), E2, L, rDot2, step, direction);
				DISPLAY.directionChange(this);
			}
			this.phi += L / (r * r) * step;
			this.t += E / (1.0 - Rs / r) * step;
		} else {
			this.collided = true;
			console.info(this.name + " - collided\n");
		}
	},
};


