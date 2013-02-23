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

var DISPLAY = {
	// Misc. constants
	originX: 600.0,
	originY: 300.0,
	BLACK: "#000000",
	RED: "#ff0000",
	GREEN: "#00ff00",
	BLUE: "#0000ff",
	YELLOW: "#ffff00",
	n: 0,
	times: function () {
		if ((DISPLAY.n % 10) === 0) {
			DISPLAY.fg.clearRect(0, 0, 200, 100);
			DISPLAY.fg.fillStyle = DISPLAY.BLACK;
			DISPLAY.fg.fillText("Proper time: " + (DISPLAY.n * INIT.time_step), 10, 50); 
			DISPLAY.fg.fillText("   Map time: " + Math.round(gr.t), 10, 90);
		}
	},
	pointX: function (radius, angle) {
		return DISPLAY.originX + radius * Math.cos(angle);
	},
	pointY: function (radius, angle) {
		return DISPLAY.originY + radius * Math.sin(angle);
	},
	plotOrbit: function (model) {
		model.X = DISPLAY.pointX(model.r, model.phi);
		model.Y = DISPLAY.pointY(model.r, model.phi);
		DISPLAY.fg.clearRect(model.X - 5.0, model.Y - 5.0, 10.0, 10.0);
		DISPLAY.fg.fillStyle = model.colour;
			DISPLAY.fg.beginPath();
			DISPLAY.fg.arc(model.X, model.Y, 3, 0, TWOPI, true);
			DISPLAY.fg.closePath();
		DISPLAY.fg.fill();
	},
	plotPotential: function (model, energy, vEff, minPotential) {
		var yValue2 = model.potentialY + 180.0 * (energy - vEff) / (energy - minPotential);
		DISPLAY.fg.clearRect(model.r - 5.0, model.potentialY - 5.0, 10.0, yValue2 + 10.0);
		if (model.r > GLOBALS.Rs) {
//			console.info("Plotting " + model.name + "\n");
			DISPLAY.fg.fillStyle = model.colour;
				DISPLAY.fg.beginPath();
				DISPLAY.fg.arc(model.r, model.potentialY, 3, 0, TWOPI, true);
				DISPLAY.fg.closePath();
			DISPLAY.fg.fill();
			DISPLAY.fg.strokeStyle = model.colour;
				DISPLAY.fg.beginPath();
				DISPLAY.fg.moveTo(model.r, model.potentialY);
				DISPLAY.fg.lineTo(model.r, yValue2);
			DISPLAY.fg.stroke();
		}
	},
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

window.onload = function () {
	DISPLAY.fg = document.getElementById('canvas').getContext('2d');
	DISPLAY.bg = document.getElementById('bgcanvas').getContext('2d');
	GLOBALS.Rs = 2.0 * GLOBALS.G * GLOBALS.M / (GLOBALS.c * GLOBALS.c);
	console.info("rDot: " + INIT.rDot + "\n");
	console.info("TimeStep: " + INIT.time_step + "\n");
	TWOPI = 2.0 * Math.PI;
	// Newton initial conditions
	newton.L = newton.circL();
	console.info("Ln: " + newton.L + "\n");
	newton.vC = newton.vEff(newton.r, newton.L);
	console.info("vCN: " + newton.vC + "\n");
	newton.E = INIT.rDot * INIT.rDot / 2.0 + newton.vC;
	console.info("En: " + newton.E + "\n");
	newton.direction = INIT.direction;
	newton.X = DISPLAY.pointX(newton.r, newton.phi);
	newton.Y = DISPLAY.pointY(newton.r, newton.phi);
	newton.colour = DISPLAY.GREEN;
	newton.potentialY = 210;
	// GR initial conditions
	gr.L = gr.circL();
	console.info("L: " + gr.L + "\n");
	gr.vC = gr.vEff(gr.r, gr.L);
	console.info("vC: " + gr.vC + "\n");
	gr.E2 = INIT.rDot * INIT.rDot + gr.vC;
	gr.E = Math.sqrt(gr.E2);
	console.info("E: " + gr.E + "\n");
	gr.direction = INIT.direction;
	gr.X = DISPLAY.pointX(gr.r, gr.phi);
	gr.Y = DISPLAY.pointY(gr.r, gr.phi);
	gr.colour = DISPLAY.BLUE;
	gr.potentialY = 410;
	// Kick-off
	drawBackground();
	setInterval(draw, 10);
};

var drawBackground = function () {
	var rMin = Math.round(GLOBALS.Rs);
	// Gravitational radius
	DISPLAY.bg.fillStyle = DISPLAY.BLACK;
		DISPLAY.bg.beginPath();
		DISPLAY.bg.arc(DISPLAY.originX, DISPLAY.originY, GLOBALS.Rs, 0, TWOPI, true);
		DISPLAY.bg.closePath();
	DISPLAY.bg.fill();
	// Unstable orbit limit
	DISPLAY.bg.strokeStyle = DISPLAY.YELLOW;
		DISPLAY.bg.beginPath();
		DISPLAY.bg.arc(DISPLAY.originX, DISPLAY.originY, 1.5 * GLOBALS.Rs, 0, TWOPI, true);
		DISPLAY.bg.closePath();
	DISPLAY.bg.stroke();
	// Stable orbit limit
	DISPLAY.bg.strokeStyle = DISPLAY.RED;
		DISPLAY.bg.beginPath();
		DISPLAY.bg.arc(DISPLAY.originX, DISPLAY.originY, 3.0 * GLOBALS.Rs, 0, TWOPI, true);
		DISPLAY.bg.closePath();
	DISPLAY.bg.stroke();
	// Newton energy
	DISPLAY.bg.strokeStyle = DISPLAY.BLACK;
		DISPLAY.bg.beginPath();
		DISPLAY.bg.moveTo(rMin, 210);
		DISPLAY.bg.lineTo(300, 210);
	DISPLAY.bg.stroke();
	// GR energy
	DISPLAY.bg.strokeStyle = DISPLAY.BLACK;
		DISPLAY.bg.beginPath();
		DISPLAY.bg.moveTo(rMin, 410);
		DISPLAY.bg.lineTo(300, 410);
	DISPLAY.bg.stroke();
	for (var i = rMin; i < 300; i += 1) {
		// Newton potential
		var vEn = newton.vEff(i, newton.L);
		if (vEn <= newton.E) {
			DISPLAY.bg.fillStyle = DISPLAY.BLACK;
				DISPLAY.bg.beginPath();
				DISPLAY.bg.arc(i, newton.potentialY + 180.0 * (newton.E - vEn) / (newton.E - newton.vC), 1, 0, TWOPI, true);
				DISPLAY.bg.closePath();
			DISPLAY.bg.fill();
		}
		// GR potential
		var vE = gr.vEff(i, gr.L);
		if (vE <= gr.E2) {
			DISPLAY.bg.fillStyle = DISPLAY.BLACK;
				DISPLAY.bg.beginPath();
				DISPLAY.bg.arc(i, gr.potentialY + 180.0 * (gr.E2 - vE) / (gr.E2 - gr.vMin()), 1, 0, TWOPI, true);
				DISPLAY.bg.closePath();
			DISPLAY.bg.fill();
		}
	}
};

var draw = function () {
	// Time display
	DISPLAY.times();
	// Stop iterating if they collide
	newton.update();
	gr.update();
	DISPLAY.plotOrbit(newton);
	DISPLAY.plotOrbit(gr);
	DISPLAY.plotPotential(newton, newton.E, newton.vEff(newton.r, newton.L), newton.vC);
	DISPLAY.plotPotential(gr, gr.E2, gr.vEff(gr.r, gr.L), gr.vMin());
	DISPLAY.n = DISPLAY.n + 1;
};

