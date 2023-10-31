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

var DISPLAY = {
    msRefresh: 10,
    // Misc. constants
    BLACK: "#000000",
    RED: "#ff0000",
    GREEN: "#00ff00",
    BLUE: "#0000ff",
    YELLOW: "#ffff00",
    CYAN: "#008080",
    MAGENTA: "#800080",
    ORANGE: "#ff4000",
    WHITE: "#ffffff",
    GREY: "#a0a0a0",
    n: 0,
    ballSize: 3,
    blank: 4,
    vY: 100,
    phiBH: 0.0,
    pointX: function (r, phi) {
        return this.originX + r * Math.cos(phi);
    },
    pointY: function (r, phi) {
        return this.originY + r * Math.sin(phi);
    },
    line: function (c, colour, x1, y1, x2, y2) {
        c.strokeStyle = colour;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
    },
    ball: function (c, colour, x, y, radius) {
        c.fillStyle = colour;
        c.beginPath();
        c.arc(x, y, radius, 0, GLOBALS.TWOPI, true);
        c.closePath();
        c.fill();
    },
    circle: function (c, colour, x, y, radius) {
        c.strokeStyle = colour;
        c.beginPath();
        c.arc(x, y, radius, 0, GLOBALS.TWOPI, true);
        c.closePath();
        c.stroke();
    },
    circularGradient: function (c, x, y, inner, outer) {
        let grd = c.createRadialGradient(x, y, 0, x, y, Math.sqrt(x * x + y * y));
        grd.addColorStop(0, inner);
        grd.addColorStop(1, outer);
        c.fillStyle = grd;
        c.fillRect(0, 0, 2 * x, 2 * y);
    },
    linearGradient: function (c, x, y, inner, outer) {
        let grd = DISPLAY.bgV.createLinearGradient(0, 0, DISPLAY.pSize, 0);
        grd.addColorStop(0, inner);
        grd.addColorStop(1, outer);
        DISPLAY.bgV.fillStyle = grd;
        DISPLAY.bgV.fillRect(0, 0, DISPLAY.pSize, DISPLAY.pSize);
    },
    varTable: function () {
        let tau = this.n * GLOBALS.step * GLOBALS.M / GLOBALS.c;
        if (! NEWTON.collided) {
            NEWTON.rText.innerHTML = (GLOBALS.M * NEWTON.r).toFixed(3);
            NEWTON.phiText.innerHTML = GLOBALS.phiDegrees(NEWTON.phi);
            NEWTON.tText.innerHTML = tau.toFixed(1);
            NEWTON.vText.innerHTML = NEWTON.speed().toFixed(6);
        }
        if (! GR.collided) {
            GR.tText.innerHTML = (GLOBALS.M * GR.t / GLOBALS.c).toFixed(1);
            GR.rText.innerHTML = (GLOBALS.M * GR.r).toFixed(3);
            GR.phiText.innerHTML = GLOBALS.phiDegrees(GR.phi);
            GR.tauText.innerHTML = tau.toFixed(1);
            GR.tDotText.innerHTML = GR.tDot.toFixed(3);
            GR.rDotText.innerHTML = GR.rDot.toFixed(3);
            GR.phiDotText.innerHTML = (GR.phiDot / GLOBALS.M).toFixed(3);
            GR.vText.innerHTML = GR.speed().toFixed(6);
        }
    },
    plotRotation: function () {
        let circle = GLOBALS.circle(GLOBALS.ergosphere) * GLOBALS.M * DISPLAY.scale;
        this.phiBH += GLOBALS.deltaPhi(GLOBALS.ergosphere);
        let X = this.pointX(circle, this.phiBH);
        let Y = this.pointY(circle, this.phiBH);
        this.tracks.clearRect(this.X - this.blank, this.Y - this.blank, 2 * this.blank, 2 * this.blank);
        this.ball(this.tracks, this.WHITE, X, Y, 2);
        this.X = X;
        this.Y = Y;
    },
    errorColour: function (m) {
        let error = GLOBALS.dB(GLOBALS.h(m), m.h0);
        return error < -120.0 ? m.colour : (error < -90.0 ? this.YELLOW : (error < -60.0 ? this.ORANGE : this.RED));
    },
    plotOrbit: function (m) {
        let r = GLOBALS.circle(m.r) * GLOBALS.M * this.scale;
        let X = this.pointX(r, m.phi);
        let Y = this.pointY(r, m.phi);
        m.fg.clearRect(m.X - this.blank, m.Y - this.blank, 2 * this.blank, 2 * this.blank);
        this.ball(m.fg, this.errorColour(m), X, Y, this.ballSize);
        this.showTracks && this.line(this.tracks, m.colour, m.X, m.Y, X, Y);
        m.X = X;
        m.Y = Y;
    },
    energyBar: function () {
        this.line(DISPLAY.bgV, this.BLACK, Math.floor(GLOBALS.horizon * GLOBALS.M * this.scale), this.vY, this.originX, this.vY);
    },
    cV: function (m, r) {
        return this.vY + this.pScale * this.pSize * (m.energyBar - m.V(r));
    },
    plotV: function (m) {
        let v = this.cV(m, m.r);
        let r = GLOBALS.circle(m.r) * GLOBALS.M * this.scale;
        m.fgV.clearRect(GLOBALS.circle(m.rOld) * GLOBALS.M * this.scale - this.blank, this.vY - this.blank, 2 * this.blank, v + 2 * this.blank);
        this.line(m.fgV, m.colour, r, v, r, this.vY);
        this.ball(m.fgV, this.errorColour(m), r, this.vY, this.ballSize);
    },
    plotSpeed: function (m) {  // dTau/dt plot for GR
        let xValue = DISPLAY.pSize - 5;
        let tDotValue = DISPLAY.pSize * (1.0 - m.speed());
        m.fgV.clearRect(xValue - 3, 0, xValue + 3, DISPLAY.pSize);
        this.line(m.fgV, m.colour, xValue, DISPLAY.pSize, xValue, tDotValue);
        this.ball(m.fgV, m.colour, xValue, tDotValue, this.ballSize);
    },
    potential: function (m) {
        DISPLAY.bgV.strokeStyle = m.colour;
        DISPLAY.bgV.beginPath();
        for (let i = this.pSize; i > 0; i -= 1) {
            let r = i / (GLOBALS.M * this.scale);
            DISPLAY.bgV.lineTo(i, this.cV(m, Math.sqrt(r * r - GLOBALS.a * GLOBALS.a)));
        }
        DISPLAY.bgV.stroke();
    },
};
