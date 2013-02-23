window.onload = function () {
	fg = document.getElementById('canvas').getContext('2d');
	bg = document.getElementById('bgcanvas').getContext('2d');
	// Physical constants
	c = 1.0;
	G = 1.0;
	M = 1.0;			// 1.0 for precession demo, 40.0 for orbital stability demo
	Rs = 2.0 * G * M / (c * c);
	rDot = 0.065;			// 0.065 for precession demo, 0.001/0 for orbital stability demo
	console.info("rDot: " + rDot + "\n");
	time_step = 10.0;		// 10.0 for precession demo, 1.0 for orbital stability demo
	console.info("TimeStep: " + time_step + "\n");
	// Misc. constants
	originX = 600.0;
	originY = 300.0;
	BLACK = "#000000";
	RED = "#ff0000";
	GREEN = "#00ff00";
	BLUE = "#0000ff";
	YELLOW = "#ffff00";
	TWOPI = 2.0 * Math.PI;
	n = 0;
	// Newton initial conditions
	rN = 100.0;			// 100.0 for precession demo, 239.0 for orbital stability demo
	rNold = rN;
	phiN = 0.0;
	Ln = circLN(rN);
	console.info("Ln: " + Ln + "\n");
	vCN = vEffN(rN, Ln);
	console.info("vCN: " + vCN + "\n");
	En = rDot * rDot / 2.0 + vCN;
	console.info("En: " + En + "\n");
	directionN = -1.0;
	Xn = pointX(rN, phiN);
	Yn = pointY(rN, phiN);
	// GR initial conditions
	t = 0.0;
	r = rN;
	rold = r;
	phi = phiN;
	L = circLGR(r);
	console.info("L: " + L + "\n");
	vC = vEffGr(r, L);
	console.info("vC: " + vC + "\n");
	E2 = rDot * rDot + vC;
	E = Math.sqrt(E2);
	console.info("E: " + E + "\n");
	direction = directionN;
	if (E2 > vEffGr((L * L - L * Math.sqrt(L * L - 3.0 * Rs * Rs)) / Rs, L)) {
		Vmin = vEffGr(Rs, L);
	} else {
		Vmin = vC;
	}
	X = pointX(r, phi);
	Y = pointY(r, phi);
	// Kick-off
	drawBackground();
	setInterval(draw, 10);
};

drawBackground = function () {
	var rMin = Math.round(Rs);
	// Gravitational radius
	bg.fillStyle = BLACK;
		bg.beginPath();
		bg.arc(originX, originY, Rs, 0, TWOPI, true);
		bg.closePath();
	bg.fill();
	// Unstable orbit limit
	bg.strokeStyle = YELLOW;
		bg.beginPath();
		bg.arc(originX, originY, 1.5 * Rs, 0, TWOPI, true);
		bg.closePath();
	bg.stroke();
	// Stable orbit limit
	bg.strokeStyle = RED;
		bg.beginPath();
		bg.arc(originX, originY, 3.0 * Rs, 0, TWOPI, true);
		bg.closePath();
	bg.stroke();
	// Newton energy
	bg.strokeStyle = BLACK;
		bg.beginPath();
		bg.moveTo(rMin, 210);
		bg.lineTo(300, 210);
	bg.stroke();
	// GR energy
	bg.strokeStyle = BLACK;
		bg.beginPath();
		bg.moveTo(rMin, 410);
		bg.lineTo(300, 410);
	bg.stroke();
	for (var i = rMin; i < 300; i += 1) {
		// Newton potential
		var vEn = vEffN(i, Ln);
		if (vEn <= En) {
			bg.fillStyle = BLACK;
				bg.beginPath();
				bg.arc(i, 210.0 + 180.0 * (En - vEn) / (En - vCN), 1, 0, TWOPI, true);
				bg.closePath();
			bg.fill();
		}
		// GR potential
		var vE = vEffGr(i, L);
		if (vE <= E2) {
			bg.fillStyle = BLACK;
				bg.beginPath();
				bg.arc(i, 410.0 + 180.0 * (E2 - vE) / (E2 - Vmin), 1, 0, TWOPI, true);
				bg.closePath();
			bg.fill();
		}
	}
};

pointX = function (radius, angle) {
	return originX + radius * Math.cos(angle);
};

pointY = function (radius, angle) {
	return originY + radius * Math.sin(angle);
};

circLN = function (radius) {
	return Math.sqrt(radius * Rs / 2.0);
};

circLGR = function (radius) {
	return radius / Math.sqrt(2.0 * radius / Rs - 3.0);
};

vEffN = function (radius, momentum) {
	return (momentum * momentum / (radius * radius) - Rs / radius) / 2.0;
};

vEffGr = function (radius, momentum) {
	return (momentum * momentum / (radius * radius) + 1.0) * (1.0 - Rs / radius);
};

draw = function () {
	var vEn = vEffN(rN, Ln);
	var vE = vEffGr(r, L);
	var xValue;
	var yValue1;
	var yValue2;
	// Time display
	n = n + 1;
	if ((n % 10) === 0) {
		fg.clearRect(0, 0, 200, 100);
		fg.fillStyle = BLACK;
		fg.fillText("Proper time: " + (n * time_step), 10, 50); 
		fg.fillText("   Map time: " + Math.round(t), 10, 90);
	}
	// Stop iterating if they collide
	if (rN > Rs) {
		// update positions (Newton)
		var dRdT2 = 2.0 * (En - vEn);
		if (dRdT2 > 0.0) {
			rNold = rN;
			rN += directionN * Math.sqrt(dRdT2) * time_step;
		} else {
			directionN = - directionN;
			rN = rNold;
        		console.log("Newton - changed direction\n");
		}
		phiN += Ln / (rN * rN) * time_step;
	} else {
        	console.info("Newton - collided\n");
	}
	if (r > Rs) {
		// update positions (GR)
		var dRdTau2 = E2 - vE;
		if (dRdTau2 > 0.0) {
			rold = r;
			r += direction * Math.sqrt(dRdTau2) * time_step;
		} else {
			direction = - direction;
			r = rold;
        		console.log("GR - changed direction\n");
		}
		phi += L / (r * r) * time_step;
		t += E / (1.0 - Rs / r) * time_step;
	} else {
        	console.info("GR - collided\n");
	}
	fg.clearRect(Xn - 5.0, Yn - 5.0, 10.0, 10.0);
	fg.clearRect(X - 5.0, Y - 5.0, 10.0, 10.0);
	// Newton orbit
	Xn = pointX(rN, phiN);
	Yn = pointY(rN, phiN);
	fg.fillStyle = GREEN;
		fg.beginPath();
		fg.arc(Xn, Yn, 3, 0, TWOPI, true);
		fg.closePath();
	fg.fill();
	// GR orbit
	X = pointX(r, phi);
	Y = pointY(r, phi);
	fg.fillStyle = BLUE;
		fg.beginPath();
		fg.arc(X, Y, 3, 0, TWOPI, true);
		fg.closePath();
	fg.fill();
	// Newton potential
	xValue = rN;
	yValue1 = 210.0
	yValue2 = yValue1 + 180.0 * (En - vEn) / (En - vCN);
	fg.clearRect(xValue - 5.0, yValue1 - 5.0, 10.0, yValue2 + 10.0);
	fg.fillStyle = GREEN;
		fg.beginPath();
		fg.arc(xValue, yValue1, 3, 0, TWOPI, true);
		fg.closePath();
	fg.fill();
	fg.strokeStyle = GREEN;
		fg.beginPath();
		fg.moveTo(xValue, yValue1);
		fg.lineTo(xValue, yValue2);
	fg.stroke();
	// GR potential
	xValue = r;
	yValue1 = 410.0;
	yValue2 = yValue1 + 180.0 * (E2 - vE) / (E2 - Vmin);
	fg.clearRect(xValue - 5.0, yValue1 - 5.0, 10.0, yValue2 + 10.0);
	if ((xValue > Rs)) {
		fg.fillStyle = BLUE;
			fg.beginPath();
			fg.arc(xValue, yValue1, 3, 0, TWOPI, true);
			fg.closePath();
		fg.fill();
		fg.strokeStyle = BLUE;
			fg.beginPath();
			fg.moveTo(xValue, yValue1);
			fg.lineTo(xValue, yValue2);
		fg.stroke();
	}
};

