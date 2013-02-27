/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
	TWOPI: 2.0 * Math.PI,
	// Physical constants
	c: 1.0,
	G: 1.0,
	M: 40.0,			// 1.0 for precession demo, 40.0 for orbital stability demo
//	M: 1.0,			// 1.0 for precession demo, 40.0 for orbital stability demo
};

var INIT = {
	Rs: 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c),
	r: 390.0,			// 100.0 for precession demo, 239.0 for orbital stability demo
//	r: 100.0,			// 100.0 for precession demo, 239.0 for orbital stability demo
	rDot: 0.172,			// 0.065 for precession demo, 0.001/0 for orbital stability demo
//	rDot: 0.065,			// 0.065 for precession demo, 0.001/0 for orbital stability demo
	phi: 0.0,
 	direction: -1.0,
	time_step: 1.0,		// 10.0 for precession demo, 1.0 for orbital stability demo
//	time_step: 10.0,		// 10.0 for precession demo, 1.0 for orbital stability demo
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
	vEff: function (radius, momentum) {
		return (momentum * momentum / (radius * radius) - INIT.Rs / radius) / 2.0;
	},
	update: function () {
		if (NEWTON.r > INIT.Rs) {
			// update positions (Newton)
			var dRdT2 = 2.0 * (NEWTON.E - NEWTON.vEff(NEWTON.r, NEWTON.L));
			if (dRdT2 >= 0.0) {
				NEWTON.rOld = NEWTON.r;
				NEWTON.r += NEWTON.direction * Math.sqrt(dRdT2) * INIT.time_step;
			} else {
				NEWTON.direction = - NEWTON.direction;
				NEWTON.r = NEWTON.rOld;
				console.log("Newton - changed direction, PHI = " + NEWTON.phi * 360.0 / GLOBALS.TWOPI % 360, + "\n");
			}
			NEWTON.phi += NEWTON.L / (NEWTON.r * NEWTON.r) * INIT.time_step;
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
	vEff: function (radius, momentum) {
		return (momentum * momentum / (radius * radius) + 1.0) * (1.0 - INIT.Rs / radius);
	},
	update: function () {
		if (GR.r > INIT.Rs) {
			// update positions (GR)
			var dRdTau2 = GR.E2 - GR.vEff(GR.r, GR.L);
			if (dRdTau2 >= 0.0) {
				GR.rOld = GR.r;
				GR.r += GR.direction * Math.sqrt(dRdTau2) * INIT.time_step;
			} else {
				GR.direction = - GR.direction;
				GR.r = GR.rOld;
				console.log("GR - changed direction, PHI = " + GR.phi * 360.0 / GLOBALS.TWOPI % 360, + "\n");
			}
			GR.phi += GR.L / (GR.r * GR.r) * INIT.time_step;
			GR.t += GR.E / (1.0 - INIT.Rs / GR.r) * INIT.time_step;
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

var setPrecession = function () {
	GLOBALS.M = 1.0;
	INIT.Rs = 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c)
	INIT.r = 100.0;
	INIT.rDot = 0.065;
	INIT.time_step = 10.0;
};

