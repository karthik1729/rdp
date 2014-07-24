var O_O = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");

yx.__extends(ArrayGenerator, O_O.System);

function ArrayGenerator(pl, conf) {

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

function RangeAverageFilter (pl, conf) {
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

function ConsoleDumper(pl, conf) {
    ConsoleDumper.__super__.constructor.apply(this, arguments);
}

ConsoleDumper.prototype.push = function (data) {
    console.log(data);
}

var pl = new O_O.Pipeline("ag");

pl.add( O_O.S("gen1"), ArrayGenerator);
pl.add( O_O.S("range-avg1"), RangeAverageFilter)

pl.connect( "gen1", "range-avg1");
pl.add( O_O.S("condump"), ConsoleDumper)
pl.connect( "range-avg1", "condump");

pl.systems.object("gen1").push( O_O.T("start"));


