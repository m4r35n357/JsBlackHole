/*
    Copyright (C) 2013-2021  Ian Smith <m4r35n357@gmail.com>

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

    As additional permission under GNU GPL version 3 section 7, you
    may distribute non-source (e.g., minimized or compacted) forms of
    that code without the copy of the GNU GPL normally required by
    section 4, provided you include this license notice and a URL
    through which recipients can access the Corresponding Source.
*/

/*jslint white: true, browser: true, safe: true */

"use strict";

var GLOBALS = {
    debug: false,
    TWOPI: 2.0 * Math.PI,
    LOG10: Math.log(10.0),
    rSolar: 700000000.0,
    ergosphere: 2.0,
    dB: function (val, ref) {
        return 10.0 * Math.log(Math.abs((val - ref) / ref)) / this.LOG10;
    },
    circle: function (r) {
        return Math.sqrt(r * r + this.a * this.a);
    },
    deltaPhi: function (r) {  // omega = - g_t_phi / g_phi_phi
        return this.Rs * this.a * this.c / (r * r * r + (r + this.Rs) * this.a * this.a) * this.step;
    },
    phiDegrees: function (phiRadians) {
        return (phiRadians * 360.0 / this.TWOPI % 360).toFixed(0) + "&deg;";
    },
    phiDMS: function (phiRadians) {
        let totalDegrees = phiRadians * 360.0 / this.TWOPI;
        let circularDegrees = totalDegrees - Math.floor(totalDegrees / 360.0) * 360;
        let minutes = (circularDegrees - Math.floor(circularDegrees)) * 60;
        let seconds = (minutes - Math.floor(minutes)) * 60;
        return circularDegrees.toFixed(0) + "&deg;" + minutes.toFixed(0) + "&#39;" + seconds.toFixed(0) + "&#34;";
    },
    h: function (m) {  // the radial "Hamiltonian"
        return 0.5 * m.rDot * m.rDot + m.V(m.r);
    },
    photonSphere: function (a) {
        if (this.prograde) {
            return 2.0 * (1.0 + Math.cos(2.0 / 3.0 * Math.acos(- Math.abs(a))));
        } else {
            return 2.0 * (1.0 + Math.cos(2.0 / 3.0 * Math.acos(Math.abs(a))));
        }
    },
    isco: function (a) {
        let z1 = 1.0 + Math.pow(1.0 - a * a, 1.0 / 3.0) * (Math.pow(1.0 + a, 1.0 / 3.0) + Math.pow(1.0 - a, 1.0 / 3.0));
        let z2 = Math.sqrt(3.0 * a * a + z1 * z1);
        if (this.prograde) {
            return 3.0 + z2 - Math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2));
        } else {
            return 3.0 + z2 + Math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2));
        }
    },
    getParameter: function (id) {
        var parameter;
        var element = document.getElementById(id);
        if (this.params.has(id)) {
            parameter = this.params.get(id);
            console.log(" URL " + id + ": " + parameter);
            element.value = parameter;
        }
        parameter = parseFloat(element.value);
        console.log("PAGE " + id + ": " + parameter);
        return parameter;
    },
    getHtmlValues: function () {
        this.params = new URL(window.location.toLocaleString()).searchParams;
        this.debug && console.info("Restarting . . . ");
        this.step = this.getParameter('timestep');
        this.lFac = this.getParameter('lfactor') / 100.0;
        this.c = this.getParameter('c');
        this.G = this.getParameter('G');
        this.M = this.getParameter('mass') * this.G / (this.c * this.c);
        this.Rs = 2.0 * this.M;
        this.debug && console.info(this.name + ".M: " + this.M.toFixed(3));
        this.r = this.getParameter('radius') / this.M;
        this.debug && console.info(this.name + ".r: " + this.r.toFixed(1));
        this.a = this.getParameter('spin');
        this.debug && console.info(this.name + ".a: " + this.a.toFixed(1));
        this.order = this.getParameter('order');
        this.debug && console.info(this.name + ".order: " + this.order);
        this.prograde = (this.a >= 0.0) ? true : false;
        this.horizon = 1.0 + Math.sqrt(1.0 - this.a * this.a);
        this.debug && console.info(this.name + ".horizon: " + this.horizon.toFixed(3));
    },
    initialize: function (m) {
        m.collided = false;
        m.r = this.r;
        m.rOld = this.r;
        m.phi = 0.0;
        m.inwards = true;
    },
    integrate: function (order, m, c_d) {
        if (order > 2) {
            order -= 2;
            let fwd = 1.0 / (4.0 - 4.0**(1.0 / (order + 1)));
            for (let stage = 0; stage < 5; stage += 1) {
                this.integrate(order, m, (stage === 2 ? 1.0 - 4.0 * fwd : fwd) * c_d);
            }
        } else {
            m.updateQ(c_d * 0.5);
            m.updateP(c_d);
            m.updateQ(c_d * 0.5);
        }
    },
    update: function (m) {
        if (m.r > this.horizon) {
            m.rOld = m.r;
            this.integrate(this.order, m, this.step);
            if (((m.r > m.rOld) && (m.inwards)) || ((m.r < m.rOld) && (!m.inwards))) {
                let phiDegrees = this.phiDMS(m.phi);
                if (m.inwards === true) {
                    m.rMinText.innerHTML = (this.M * m.r).toFixed(3);
                    m.pText.innerHTML = phiDegrees;
                    this.debug && console.log(m.name + ": Perihelion");
                } else {
                    m.rMaxText.innerHTML = (this.M * m.r).toFixed(3);
                    m.aText.innerHTML = phiDegrees;
                    this.debug && console.log(m.name + ": Aphelion");
                }
                m.inwards = !m.inwards;
                let h = this.h(m);
                this.debug && console.log("H0: " + m.h0.toExponential(6) + ", H: " + h.toExponential(6) + ", E: " + this.dB(h, m.h0).toFixed(1) + "dBh0");
            }
        } else {
            m.collided = true;
            this.debug && console.info(m.name + " - collided\n");
        }
    },
};

var NEWTON = {
    name: "NEWTON",
    initialize: function (a, lFac, debug) {
        this.circular(this.r);
        debug && console.info(this.name + ".L: " + this.L.toFixed(3));
        this.L2 = this.L * this.L;
        this.energyBar = this.V(this.r);
        debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
        this.L = this.L * lFac;
        this.L2 = this.L * this.L;
        let V0 = this.V(this.r); // using (possibly) adjusted L from above
        this.rDot = - Math.sqrt(2.0 * (this.energyBar - V0));
        this.h0 =  0.5 * this.rDot * this.rDot + V0;
    },
    speed: function () {
        return Math.sqrt(this.rDot * this.rDot + this.r * this.r * this.phiDot * this.phiDot);
    },
    circular: function (r) {  // L for a circular orbit of r
        this.L = Math.sqrt(r);
    },
    V: function (r) {  // the Effective V
        return - 1.0 / r + this.L2 / (2.0 * r * r);
    },
    updateQ: function (c) {  // update radial position
        this.r += c * this.rDot;
        this.phiDot = this.L / (this.r * this.r);
        this.phi += c * this.phiDot;
    },
    updateP: function (d) {  // update radial momentum
        let r2 = this.r * this.r;
        this.rDot -= d * (1.0 / r2 - this.L2 / (r2 * this.r));
    },
};

var GR = { // can be spinning
    name: "GR",
    initialize: function (a, lFac, debug) {
        this.circular(this.r, a);
        debug && console.info(this.name + ".L: " + this.L.toFixed(12));
        debug && console.info(this.name + ".E: " + this.E.toFixed(12));
        this.constants(this.L, this.E, a);
        this.energyBar = this.V(this.r);
        debug && console.info(this.name + ".energyBar: " + this.energyBar.toFixed(6));
        this.L = this.L * lFac;
        this.constants(this.L, this.E, a);
        this.t = 0.0;
        this.tDot = 1.0;
        let V0 = this.V(this.r); // using (possibly) adjusted L from above
        this.rDot = - Math.sqrt(2.0 * (this.energyBar - V0));
        this.h0 =  0.5 * this.rDot * this.rDot + V0;
    },
    speed: function () {
        return Math.sqrt(1.0 - 1.0 / (this.tDot * this.tDot));
    },
    circular: function (r, a) {  // L and E for a circular orbit of r
        let sqrtR = Math.sqrt(r);
        let tmp = Math.sqrt(r * r - 3.0 * r + 2.0 * a * sqrtR);
        this.L = (r * r - 2.0 * a * sqrtR + a * a) / (sqrtR * tmp);
        this.E = (r * r - 2.0 * r + a * sqrtR) / (r * tmp);
    },
    constants: function (L, E, a) {
        this.k1 = L * L - a * a * (E * E - 1.0);
        this.k2 = (L - a * E) * (L - a * E);
        this.a2 = a * a;
        this.twoAE = 2.0 * a * E;
        this.twoAL = 2.0 * a * L;
    },
    V: function (r) {  // the Effective Potential
        return - 1.0 / r + this.k1 / (2.0 * r * r) - this.k2 / (r * r * r);
    },
    updateQ: function (c) {  // update radial position
        this.r += c * this.rDot;
        let r2 = this.r * this.r;
        let delta = r2 + this.a2 - 2.0 * this.r;
        this.tDot = ((r2 + this.a2 * (1.0 + 2.0 / this.r)) * this.E - this.twoAL / this.r) / delta;
        this.t += c * this.tDot;
        this.phiDot = ((1.0 - 2.0 / this.r) * this.L + this.twoAE / this.r) / delta;
        this.phi += c * this.phiDot;
    },
    updateP: function (d) {  // update radial momentum
        let r2 = this.r * this.r;
        this.rDot -= d * (1.0 / r2 - this.k1 / (r2 * this.r) + 3.0 * this.k2 / (r2 * r2));
    },
};
