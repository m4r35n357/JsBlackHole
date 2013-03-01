/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	TWOPI: 2.0 * Math.PI,
	// Physical constants
	c: 1.0,
	G: 1.0,
	M: 17.5,			// 1.0 for precession demo, 40.0 for orbital stability demo
};

var INIT = {
	Rs: 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c),
	r: 350.0,			// 100.0 for precession demo, 239.0 for orbital stability demo
	rDot: 0.000,			// 0.065 for precession demo, 0.001/0 for orbital stability demo
	phi: 0.0,
 	direction: -1.0,
	timeStep: 1.0,		// 10.0 for precession demo, 1.0 for orbital stability demo
	initialize: function (model) {
		model.collided = false;
		model.r = INIT.r;
		model.rOld = INIT.r;
		model.phi= INIT.phi;
		model.direction= INIT.direction;
	},
};

var NEWTON = {
	name: "Newton",
	circL: function () {
		return Math.sqrt(NEWTON.r * INIT.Rs / 2.0);
	},
	vEff: function (r, L) {
		return (L * L / (r * r) - INIT.Rs / r) / 2.0;
	},
	update: function (step, r, L, Rs) {
		var rDot2;
		if (r > Rs) {
			// update positions (Newton)
			rDot2 = 2.0 * (NEWTON.E - NEWTON.vEff(r, L));
			if (rDot2 >= 0.0) {
				NEWTON.rOld = r;
				NEWTON.r += NEWTON.direction * Math.sqrt(rDot2) * step;
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
	circL: function () {
		return GR.r / Math.sqrt(2.0 * GR.r / INIT.Rs - 3.0);
	},
	vEff: function (r, L) {
		return (L * L / (r * r) + 1.0) * (1.0 - INIT.Rs / r);
	},
	update: function (step, r, E2, E, L, Rs) {
		var rDot2;
		if (r > Rs) {
			// update positions (GR)
			rDot2 = E2 - GR.vEff(r, L);
			if (rDot2 >= 0.0) {
				GR.rOld = r;
				GR.r += GR.direction * Math.sqrt(rDot2) * step;
			} else {
				GR.direction = - GR.direction;
				GR.r = GR.rOld;
				console.log("GR - changed direction, PHI = " + GR.phi * 360.0 / GLOBALS.TWOPI % 360, + "\n");
			}
			GR.phi += L / (r * r) * step;
			GR.t += E / (1.0 - Rs / r) * step;
		} else {
			console.info("GR - collided\n");
		}
	},
	vMin: function (L, Rs) {
		var Vmin;
		if (GR.E2 > GR.vEff((L * L - L * Math.sqrt(L * L - 3.0 * Rs * Rs)) / Rs, L)) {
			// lower vertical limit is potential at the horizon
			Vmin = GR.vEff(Rs, L);
		} else {
			// lower vertical limit is potential of circular orbit
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
	INIT.timeStep = 1.0;
};

var setJustStable = function () {
	GLOBALS.M = 40.0;
	INIT.Rs = 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c)
	INIT.r = 390.0;
	INIT.rDot = 0.172;
	INIT.timeStep = 1.0;
};

var setPrecession = function () {
	GLOBALS.M = 1.0;
	INIT.Rs = 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c)
	INIT.r = 100.0;
	INIT.rDot = 0.065;
	INIT.timeStep = 10.0;
};

