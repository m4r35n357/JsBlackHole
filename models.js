/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	TWOPI: 2.0 * Math.PI,
	// Physical constants
	c: 1.0,
	G: 1.0,
	M: 50.0,			// 1.0 for precession demo, 40.0 for orbital stability demo
};

var INIT = {
	Rs: 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c),
	r: 350.0,			// 100.0 for precession demo, 239.0 for orbital stability demo
	rDot: 0.000,			// 0.065 for precession demo, 0.001/0 for orbital stability demo
	phi: 0.0,
 	direction: -1.0,
	time_step: 1.0,		// 10.0 for precession demo, 1.0 for orbital stability demo
};

var NEWTON = {
	name: "Newton",
	collided: false,
	r: INIT.r,
	rOld: INIT.r,
	phi: INIT.phi,
	circL: function () {
		return Math.sqrt(NEWTON.r * INIT.Rs / 2.0);
	},
	vEff: function (r, L) {
		return (L * L / (r * r) - INIT.Rs / r) / 2.0;
	},
	update: function (r, L) {
		var step = INIT.time_step;
		if (r > INIT.Rs) {
			// update positions (Newton)
			var dRdT2 = 2.0 * (NEWTON.E - NEWTON.vEff(r, L));
			if (dRdT2 >= 0.0) {
				NEWTON.rOld = r;
				NEWTON.r += NEWTON.direction * Math.sqrt(dRdT2) * step;
			} else {
				NEWTON.direction = - NEWTON.direction;
				NEWTON.r = NEWTON.rOld;
				console.log("Newton - changed direction, PHI = " + NEWTON.phi * 360.0 / GLOBALS.TWOPI % 360, + "\n");
			}
			NEWTON.phi += L / (r * r) * step;
		} else {
			console.info("Newton - collided\n");
		}
	},
};

var GR = {
	name: "GR",
	collided: false,
	t: 0.0,
	r: INIT.r,
	rOld: INIT.r,
	phi: INIT.phi,
	circL: function () {
		return GR.r / Math.sqrt(2.0 * GR.r / INIT.Rs - 3.0);
	},
	vEff: function (r, L) {
		return (L * L / (r * r) + 1.0) * (1.0 - INIT.Rs / r);
	},
	update: function (r, E2, E, L) {
		var step = INIT.time_step;
		var Rs = INIT.Rs;
		var k1, k2, k3, k4;
		if (r > Rs) {
			// update positions (GR)
			var dRdTau2 = E2 - GR.vEff(r, L);
			if (dRdTau2 >= 0.0) {
				GR.rOld = r;
				GR.r += GR.direction * Math.sqrt(dRdTau2) * step;
//				k1 = Math.sqrt(dRdTau2);
//				k2 = Math.sqrt(E2 - GR.vEff(r + 0.5 * k1 * step, L));
//				k3 = Math.sqrt(E2 - GR.vEff(r + 0.5 * k2 * step, L));
//				k4 = Math.sqrt(E2 - GR.vEff(r + k3 * step, L));
//				GR.r += GR.direction * step * (k1 + 2.0 * (k2 + k3) + k4) / 6.0;
			} else {
				GR.direction = - GR.direction;
				GR.r = GR.rOld;
				console.log("GR - changed direction, PHI = " + GR.phi * 360.0 / GLOBALS.TWOPI % 360, + "\n");
			}
			GR.phi += L / (r * r) * step;
//			k1 = L / (r * r);
//			k2 = L / ((r + 0.5 * k1 * step) * (r + 0.5 * k1 * step));
//			k3 = L / ((r + 0.5 * k2 * step) * (r + 0.5 * k2 * step));
//			k4 = L / ((r + k3 * step) * (r + k3 * step));
//			GR.phi += step * (k1 + 2.0 * (k2 + k3) + k4) / 6.0;
			GR.t += E / (1.0 - Rs / r) * step;
//			k1 = E / (1.0 - Rs / r);
//			k2 = E / (1.0 - Rs / (r + 0.5 * k1 * step));
//			k3 = E / (1.0 - Rs / (r + 0.5 * k2 * step));
//			k4 = E / (1.0 - Rs / (r + k3 * step));
//			GR.t += step * (k1 + 2.0 * (k2 + k3) + k4) / 6.0;
		} else {
			console.info("GR - collided\n");
		}
	},
	vMin: function () {
		var Vmin;
		if (GR.E2 > GR.vEff((GR.L * GR.L - GR.L * Math.sqrt(GR.L * GR.L - 3.0 * INIT.Rs * INIT.Rs)) / INIT.Rs, GR.L)) {
			Vmin = GR.vEff(INIT.Rs, GR.L);
		} else {
			Vmin = GR.vC;
		}
		return Vmin;
	},
};

var setKnifeEdge = function () {
	GLOBALS.M = 40.0;
	INIT.Rs = 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c)
	INIT.r = 239.0;
	INIT.rDot = 0.001;
	INIT.time_step = 1.0;
};

var setJustStable = function () {
	GLOBALS.M = 40.0;
	INIT.Rs = 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c)
	INIT.r = 390.0;
	INIT.rDot = 0.172;
	INIT.time_step = 1.0;
};

var setPrecession = function () {
	GLOBALS.M = 1.0;
	INIT.Rs = 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c)
	INIT.r = 100.0;
	INIT.rDot = 0.065;
	INIT.time_step = 10.0;
};

