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
		return 2.0 * ((vNew - E) / (vNew - vOld) - 0.5) * direction * Math.sqrt(-rDot2) * step;
	},
};

var INIT = {
	phi: 0.0,
 	direction: -1.0,
	initialize: function (model) {
		model.collided = false;
		model.r = this.r;
		model.rOld = this.r;
		model.phi= this.phi;
		model.direction= this.direction;
	},
	setKnifeEdge: function () {
		this.M = 40.0;
		this.Rs = 2.0 * GLOBALS.G * this.M / (GLOBALS.c * GLOBALS.c)
		this.r = 239.0;
		this.rDot = 0.001;
		this.timeStep = 1.0;
	},
	setJustStable: function () {
		this.M = 40.0;
		this.Rs = 2.0 * GLOBALS.G * this.M / (GLOBALS.c * GLOBALS.c)
		this.r = 390.0;
		this.rDot = 0.172;
		this.timeStep = 1.0;
	},
	setPrecession: function () {
		this.M = 1.0;
		this.Rs = 2.0 * GLOBALS.G * this.M / (GLOBALS.c * GLOBALS.c)
		this.r = 100.0;
		this.rDot = 0.065;
		this.timeStep = 10.0;
	},
};

var NEWTON = {
	name: "Newton",
	initialize: function () {
		this.L = this.circL();
		console.info("Ln: " + this.L.toFixed(3));
		this.vC = this.V(this.r, this.L);
		console.info("vCN: " + this.vC.toFixed(6));
		this.E = INIT.rDot * INIT.rDot / 2.0 + this.vC;
		console.info("En: " + this.E.toFixed(6));
	},
	circL: function () {
		return Math.sqrt(this.r * INIT.Rs / 2.0);
	},
	V: function (r, L) {
		return (L * L / (r * r) - INIT.Rs / r) / 2.0;
	},
	update: function (step, r, L, Rs) {
		var rDot2;
		var vNew;
		if (r > Rs) {
			vNew = this.V(r, L);
			// update positions (Newton)
			rDot2 = 2.0 * (this.E - vNew);
			if (rDot2 >= 0.0) {
				this.rOld = r;
				this.r += this.direction * Math.sqrt(rDot2) * step;
			} else {
				this.direction = - this.direction;
				this.r = this.rOld + GLOBALS.rTurnAround(vNew, this.V(this.rOld, L), this.E, this.L, rDot2, step, this.direction);
				console.log(this.name + " - changed direction, PHI = " + GLOBALS.phiDegrees(this.phi));
				if (this.direction === 1) {
					this.pDisplay.innerHTML = GLOBALS.phiDegrees(this.phi);
				} else {
					this.aDisplay.innerHTML = GLOBALS.phiDegrees(this.phi);
				}
			}
			this.phi += L / (r * r) * step;
		} else {
			console.info(this.name + " - collided\n");
		}
	},
};

var GR = {
	name: "GR",
	initialize: function () {
		this.t = 0.0;
		this.L = this.circL();
		console.info("L: " + this.L.toFixed(3));
		this.vC = this.V(this.r, this.L);
		console.info("vC: " + this.vC.toFixed(6));
		this.E2 = INIT.rDot * INIT.rDot + this.vC;
		console.info("E2: " + this.E2.toFixed(6));
		this.E = Math.sqrt(this.E2);
		console.info("E: " + this.E.toFixed(6));
	},
	circL: function () {
		return this.r / Math.sqrt(2.0 * this.r / INIT.Rs - 3.0);
	},
	V: function (r, L) {
		return (L * L / (r * r) + 1.0) * (1.0 - INIT.Rs / r);
	},
	update: function (step, r, E2, E, L, Rs) {
		var rDot2;
		var vNew;
		if (r > Rs) {
			vNew = this.V(r, L);
			// update positions (GR)
			rDot2 = E2 - vNew;
			if (rDot2 >= 0.0) {
				this.rOld = r;
				this.r += this.direction * Math.sqrt(rDot2) * step;
			} else {
				this.direction = - this.direction;
				this.r = this.rOld + GLOBALS.rTurnAround(vNew, this.V(this.rOld, L), this.E2, this.L, rDot2, step, this.direction);
				console.log(this.name + " - changed direction, PHI = " + GLOBALS.phiDegrees(this.phi));
				if (this.direction === 1) {
					this.pDisplay.innerHTML = GLOBALS.phiDegrees(this.phi);
				} else {
					this.aDisplay.innerHTML = GLOBALS.phiDegrees(this.phi);
				}
			}
			this.phi += L / (r * r) * step;
			this.t += E / (1.0 - Rs / r) * step;
		} else {
			console.info(this.name + " - collided\n");
		}
	},
	vMin: function (L, Rs) {
		var Vmin;
		if (this.E2 > this.V((L * L - L * Math.sqrt(L * L - 3.0 * Rs * Rs)) / Rs, L)) {
			// lower vertical limit is potential at the horizon
			Vmin = this.V(Rs, L);
		} else {
			// lower vertical limit is potential of circular orbit
			Vmin = this.vC;
		}
		return Vmin;
	},
};


