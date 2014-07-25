RDP -- Reactive Data (Flow) Processing
======================================

Read [this](http://lexical.foobar.systems/rdp.html).

Install
=======

`npm install rdp`

API
===

var O_O = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");

yx.__extends(ArrayGenerator, O_O.System);

function ArrayGenerator(b, conf) {

    ArrayGenerator.__super__.constructor.apply(this, arguments);
    this.values = [];

    var i = 1;
    do {
        this.values.push(i++);
    } while(i < 100);

}

ArrayGenerator.prototype.push = function (token) {
    if (token.start) {
        _.map(this.values, function (e) {
            this.emit(e);
        }.bind(this));
    }
}

yx.__extends(RangeAverageFilter, O_O.System);

function RangeAverageFilter (b, conf) {
    RangeAverageFilter.__super__.constructor.apply(this, arguments);
    this.range = [];
}

RangeAverageFilter.prototype.push = function (data) {
    var range = this.range;

    range.push(data);

    if (range.length == 5) {
        var sum = 0;
        _.map(range, function (e) {
            sum += e;
        });

        var avg = sum / 5;

        this.emit(avg);
        this.range = [];
    }
}

yx.__extends(ConsoleDumper, O_O.System);

function ConsoleDumper(b, conf) {
    ConsoleDumper.__super__.constructor.apply(this, arguments);
}

ConsoleDumper.prototype.push = function (data) {
    console.log(data);
}

var b = new O_O.Board("ag");

b.add( O_O.S("gen1"), ArrayGenerator);
b.add( O_O.S("range-avg1"), RangeAverageFilter)

b.connect( "gen1", "range-avg1");
b.add( O_O.S("condump"), ConsoleDumper)
b.connect( "range-avg1", "condump");

b.systems.object("gen1").push( O_O.T("start"));



Status
======

Alpha

( This readme was generated with edde )

