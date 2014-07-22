module.exports = function (name) {

    this.inputValidator = function (data, inlet, conflict) {
        if (this.symbol) {
            var symbol = this.symbol.name;
        } else {
            var symbol = "Unknown";
        }

        console.log("tracing inlet -- " + inlet + " -- from " + symbol);
        console.log(data);
        console.log("tracing end");

        if (conflict) {
            return conflict(data, inlet);
        } else {
            return data;
        }
    }

   this.outputValidator = function (data, outlet, conflict) {
        if (this.symbol) {
            var symbol = this.symbol.name;
        } else {
            var symbol = "Unknown";
        }

        console.log("tracing outlet -- " + outlet + " -- from " + symbol);
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

