module.exports = function (name) {

    this.input = function (data, inlet, conflict) {
        if (this.symbol) {
            var symbol = this.symbol.name;
        } else {
            var symbol = "Unknown";
        }

        console.log("tracing inlet -- " + inlet + " -- of " + symbol);
        console.log(data);
        console.log("tracing end");

        if (conflict) {
            return conflict(data, inlet);
        } else {
            return data;
        }
    }

   this.output = function (data, outlet, conflict) {
        if (this.symbol) {
            var symbol = this.symbol.name;
        } else {
            var symbol = "Unknown";
        }

        console.log("tracing outlet -- " + outlet + " -- of " + symbol);
        console.log(data);
        console.log("tracing end");

        if (conflict) {
            return conflict(data, outlet);
        } else {
            return data;
        }
    }

    this.raise = function (signal, conflict) {
        console.log("tracing event " + signal.name);
        console.log(signal.payload);
        console.log("tracing end");
        if (conflict) {
            return conflict(signal);
        }
    }
}

