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

var drawBackground = function () {
    let isco = GLOBALS.circle(GLOBALS.isco(GLOBALS.a)) * GLOBALS.M * DISPLAY.scale;
    let photonSphere = GLOBALS.circle(GLOBALS.photonSphere(GLOBALS.a)) * GLOBALS.M * DISPLAY.scale;
    let ergosphere = GLOBALS.circle(GLOBALS.ergosphere) * GLOBALS.M * DISPLAY.scale;
    let horizon = GLOBALS.circle(GLOBALS.horizon) * GLOBALS.M * DISPLAY.scale;
    // Initialize orbit canvases
    DISPLAY.bg.clearRect(0, 0, DISPLAY.oSize, DISPLAY.oSize);
    DISPLAY.tracks.clearRect(0, 0, DISPLAY.oSize, DISPLAY.oSize);
    NEWTON.fg.clearRect(0, 0, DISPLAY.oSize, DISPLAY.oSize);
    GR.fg.clearRect(0, 0, DISPLAY.oSize, DISPLAY.oSize);
    DISPLAY.circularGradient(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, DISPLAY.GREY, DISPLAY.BLACK);
    // Solar perimeter
    DISPLAY.bg.strokeStyle = DISPLAY.YELLOW;
        DISPLAY.bg.beginPath();
        DISPLAY.bg.arc(DISPLAY.originX, DISPLAY.originY, DISPLAY.scale * GLOBALS.rSolar, 0, GLOBALS.TWOPI, true);
        DISPLAY.bg.closePath();
    DISPLAY.bg.stroke();
    // ISCO
    GLOBALS.debug && console.info("ISCO: " + isco.toFixed(1));
    DISPLAY.bg.globalAlpha = 0.1;
    DISPLAY.ball(DISPLAY.bg, DISPLAY.WHITE, DISPLAY.originX, DISPLAY.originY, isco);
    // Ergoregion
    DISPLAY.bg.globalAlpha = 1.0;
    DISPLAY.ball(DISPLAY.bg, DISPLAY.CYAN, DISPLAY.originX, DISPLAY.originY, ergosphere);
    // Photon sphere
    DISPLAY.circle(DISPLAY.bg, DISPLAY.ORANGE, DISPLAY.originX, DISPLAY.originY, photonSphere);
    // Gravitational radius
    DISPLAY.ball(DISPLAY.bg, DISPLAY.BLACK, DISPLAY.originX, DISPLAY.originY, horizon);
    // Initialize potential canvases
    DISPLAY.bgV.clearRect(0, 0, DISPLAY.pSize, DISPLAY.pSize);
    NEWTON.fgV.clearRect(0, 0, DISPLAY.pSize, DISPLAY.pSize);
    GR.fgV.clearRect(0, 0, DISPLAY.pSize, DISPLAY.pSize);
    DISPLAY.linearGradient(DISPLAY.bg, DISPLAY.originX, DISPLAY.originY, DISPLAY.GREY, DISPLAY.BLACK);
    // ISCO
    DISPLAY.bgV.globalAlpha = 0.1;
    DISPLAY.bgV.fillStyle = DISPLAY.WHITE;
    DISPLAY.bgV.fillRect(0, 0, isco, DISPLAY.pSize);
    // Ergoregion
    DISPLAY.bgV.globalAlpha = 1.0;
    DISPLAY.bgV.fillStyle = DISPLAY.CYAN;
    DISPLAY.bgV.fillRect(0, 0, ergosphere, DISPLAY.pSize);
    // Photon sphere
    DISPLAY.bgV.strokeStyle = DISPLAY.ORANGE;
        DISPLAY.bgV.beginPath();
        DISPLAY.bgV.moveTo(photonSphere, 0);
        DISPLAY.bgV.lineTo(photonSphere, DISPLAY.pSize);
    DISPLAY.bgV.stroke();
    // Effective potentials
    DISPLAY.potential(NEWTON);
    DISPLAY.potential(GR);
    // Horizon
    DISPLAY.bgV.fillStyle = DISPLAY.BLACK;
    DISPLAY.bgV.fillRect(0, 0, horizon, DISPLAY.pSize);
    // Solar perimeter
    DISPLAY.bgV.strokeStyle = DISPLAY.YELLOW;
        DISPLAY.bgV.beginPath();
        DISPLAY.bgV.moveTo(GLOBALS.rSolar * DISPLAY.scale, 0);
        DISPLAY.bgV.lineTo(GLOBALS.rSolar * DISPLAY.scale, DISPLAY.pSize);
    DISPLAY.bgV.stroke();
    DISPLAY.energyBar();
    // Constants of motion for table
    NEWTON.lText.innerHTML = (GLOBALS.M * NEWTON.L).toFixed(6);
    GR.eText.innerHTML = (GR.E).toFixed(6);
    GR.lText.innerHTML = (GLOBALS.M * GR.L).toFixed(6);
    GR.rsText.innerHTML = (GLOBALS.M * GLOBALS.horizon).toFixed(3);
    // time step counter
    DISPLAY.n = 0;
};

var plotModel = function (model) {
    if (! model.collided) {
        GLOBALS.update(model);
        DISPLAY.plotOrbit(model);
        DISPLAY.plotV(model);
    }
}

var drawForeground = function () {  // main loop
    DISPLAY.refreshId && window.cancelAnimationFrame(DISPLAY.refreshId);
    if ((DISPLAY.n % 10) === 0) {
        DISPLAY.varTable();
    }
    DISPLAY.plotRotation(); // BH spin direction indicator
    plotModel(NEWTON);
    plotModel(GR);
    DISPLAY.plotSpeed(NEWTON);
    DISPLAY.plotSpeed(GR);
    DISPLAY.n += 1;
    DISPLAY.refreshId = window.requestAnimationFrame(drawForeground);
};

var setupModel = function (model, colour) {
    GLOBALS.initialize(model);
    model.initialize(GLOBALS.a, GLOBALS.lFac, GLOBALS.debug);
    model.X = DISPLAY.pointX(GLOBALS.M * DISPLAY.scale * model.r, model.phi);
    model.Y = DISPLAY.pointY(GLOBALS.M * DISPLAY.scale * model.r, model.phi);
    model.colour = colour;
}

var scenarioChange = function () {  // refresh form data
    GLOBALS.getHtmlValues();
    DISPLAY.scale = GLOBALS.getFloatById('scale');
    DISPLAY.pScale = GLOBALS.getFloatById('pscale');
    document.getElementById('showTracks').checked ? DISPLAY.showTracks = true : DISPLAY.showTracks = false;
    document.getElementById('toggleDebug').checked ? GLOBALS.debug = true : GLOBALS.debug = false;
    setupModel(NEWTON, DISPLAY.GREEN);
    setupModel(GR, DISPLAY.BLUE);
    drawBackground();
    drawForeground();  // start things moving
    return false;  // don't reload from scratch
};

window.onload = function () {  // load static DOM elements
    let orbitPlot = document.getElementById('tracks');
    DISPLAY.oSize = orbitPlot.width;
    DISPLAY.originX = orbitPlot.width / 2;
    DISPLAY.originY = orbitPlot.height / 2;
    DISPLAY.tracks = orbitPlot.getContext('2d');
    DISPLAY.pSize = document.getElementById('bgpot').width;
    NEWTON.fg = document.getElementById('fgorbitn').getContext('2d');
    GR.fg = document.getElementById('fgorbitgr').getContext('2d');
    DISPLAY.bg = document.getElementById('bgorbit').getContext('2d');
    DISPLAY.bgV = document.getElementById('bgpot').getContext('2d');
    NEWTON.fgV = document.getElementById('fgpotn').getContext('2d');
    GR.fgV = document.getElementById('fgpotgr').getContext('2d');
    NEWTON.eText = document.getElementById('eNEWTON');
    NEWTON.lText = document.getElementById('lNEWTON');
    NEWTON.tText = document.getElementById('timeNEWTON');
    NEWTON.rText = document.getElementById('rNEWTON');
    NEWTON.phiText = document.getElementById('phiNEWTON');
    NEWTON.rMinText = document.getElementById('rminNEWTON');
    NEWTON.pText = document.getElementById('pNEWTON');
    NEWTON.rMaxText = document.getElementById('rmaxNEWTON');
    NEWTON.aText = document.getElementById('aNEWTON');
    NEWTON.vText = document.getElementById('vNEWTON');
    GR.rsText = document.getElementById('rs');
    GR.eText = document.getElementById('eGR');
    GR.lText = document.getElementById('lGR');
    GR.tText = document.getElementById('tGR');
    GR.rText = document.getElementById('rGR');
    GR.phiText = document.getElementById('phiGR');
    GR.tauText = document.getElementById('tauGR');
    GR.rMinText = document.getElementById('rminGR');
    GR.pText = document.getElementById('pGR');
    GR.rMaxText = document.getElementById('rmaxGR');
    GR.aText = document.getElementById('aGR');
    GR.tDotText = document.getElementById('tdotGR');
    GR.rDotText = document.getElementById('rdotGR');
    GR.phiDotText = document.getElementById('phidotGR');
    GR.tauDotText = document.getElementById('taudotGR');
    GR.vText = document.getElementById('vGR');
    document.getElementById('scenarioForm').onsubmit = scenarioChange;
    scenarioChange();  // start thimgs moving
};
