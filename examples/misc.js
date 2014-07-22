var O_O = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");


if (O_O.S("foo").is(O_O.S("foo"))) {
    console.log("symbol comparison works");
} else {
    console.log("symbol comparison does not work");
}

if (O_O.S("foo").is(O_O.S("bar"))) {
    console.log("symbol comparison does not work");
} else {
    console.log("symbol comparison works");
}

