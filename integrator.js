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

var SYMPLECTIC = {
    initialize: function (order) {
        this.order = order;
    },
    integrate: function (order, model, cd) {
        if (order > 2) {
            order -= 2;
            fwd = 1.0 / (4.0 - 4.0**(1.0 / (order + 1)));
            for (stage = 0; stage < 5; stage++) {
                integrate(order, model, (stage == 2 ? 1.0 - 4.0 * fwd : fwd) * cd);
            }
        } else {
            model.updateQ(cd * 0.5);
            model.updateP(cd);
            model.updateQ(cd * 0.5);
        }
    }
};
