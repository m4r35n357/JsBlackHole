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
	plotPotential: function (model, energy, minPotential) {
		var yValue2 = model.potentialY + 180.0 * (energy - model.vEff(model.r, model.L)) / (energy - minPotential);
		DISPLAY.fg.clearRect(model.r - 5.0, model.potentialY - 5.0, 10.0, yValue2 + 10.0);
		if (model.r > GLOBALS.Rs) {
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

var drawForeground = function () {
	DISPLAY.times();
	newton.update();
	gr.update();
	DISPLAY.plotOrbit(newton);
	DISPLAY.plotOrbit(gr);
	DISPLAY.plotPotential(newton, newton.E, newton.vC);
	DISPLAY.plotPotential(gr, gr.E2, gr.vMin());
	DISPLAY.n = DISPLAY.n + 1;
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
	setInterval(drawForeground, 10);
};

