var GLOBALS = {
	// Physical constants
	c: 1.0,
	G: 1.0,
	M: 1.0,			// 1.0 for precession demo, 40.0 for orbital stability demo
};

var INIT = {
	r: 100.0,			// 100.0 for precession demo, 239.0 for orbital stability demo
	rDot: 0.065,			// 0.065 for precession demo, 0.001/0 for orbital stability demo
	phi: 0.0,
 	direction: -1.0,
	time_step: 10.0,		// 10.0 for precession demo, 1.0 for orbital stability demo
};

var newton = {
	name: "Newton",
	r: INIT.r,
	rOld: INIT.r,
	phi: INIT.phi,
	circL: function () {
		return Math.sqrt(newton.r * GLOBALS.Rs / 2.0);
	},
	vEff: function (radius, momentum) {
		return (momentum * momentum / (radius * radius) - GLOBALS.Rs / radius) / 2.0;
	},
	update: function () {
		if (newton.r > GLOBALS.Rs) {
			// update positions (Newton)
			var dRdT2 = 2.0 * (newton.E - newton.vEff(newton.r, newton.L));
			if (dRdT2 > 0.0) {
				newton.rOld = newton.r;
				newton.r += newton.direction * Math.sqrt(dRdT2) * INIT.time_step;
			} else {
				newton.direction = - newton.direction;
				newton.r = newton.rOld;
				console.log("Newton - changed direction, PHI = " + newton.phi * 360.0 / TWOPI, + "\n");
			}
			newton.phi += newton.L / (newton.r * newton.r) * INIT.time_step;
		} else {
			console.info("Newton - collided\n");
		}
	},
};

var gr = {
	name: "GR",
	t: 0.0,
	r: INIT.r,
	rOld: INIT.r,
	phi: INIT.phi,
	circL: function () {
		return gr.r / Math.sqrt(2.0 * gr.r / GLOBALS.Rs - 3.0);
	},
	vEff: function (radius, momentum) {
		return (momentum * momentum / (radius * radius) + 1.0) * (1.0 - GLOBALS.Rs / radius);
	},
	update: function () {
		if (gr.r > GLOBALS.Rs) {
			// update positions (GR)
			var dRdTau2 = gr.E2 - gr.vEff(gr.r, gr.L);
			if (dRdTau2 > 0.0) {
				gr.rOld = gr.r;
				gr.r += gr.direction * Math.sqrt(dRdTau2) * INIT.time_step;
			} else {
				gr.direction = - gr.direction;
				gr.r = gr.rOld;
				console.log("GR - changed direction, PHI = " + gr.phi * 360.0 / TWOPI, + "\n");
			}
			gr.phi += gr.L / (gr.r * gr.r) * INIT.time_step;
			gr.t += gr.E / (1.0 - GLOBALS.Rs / gr.r) * INIT.time_step;
		} else {
			console.info("GR - collided\n");
		}
	},
	vMin: function () {
		if (gr.E2 > gr.vEff((gr.L * gr.L - gr.L * Math.sqrt(gr.L * gr.L - 3.0 * GLOBALS.Rs * GLOBALS.Rs)) / GLOBALS.Rs, gr.L)) {
			Vmin = gr.vEff(GLOBALS.Rs, gr.L);
		} else {
			Vmin = gr.vC;
		}
		return Vmin;
	},
};

