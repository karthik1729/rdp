var Bus, Cell, Component, Connection, D, Data, Entity, Event, Flow, Glitch, NameSpace, S, Signal, StopToken, Store, Symbol, System, T, Token, Wire, clone, mixins, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

uuid = require("node-uuid");

clone = require("clone");

mixins = require("./lib/mixins.js");

Symbol = (function() {
  function Symbol(name, object, ns, attrs) {
    this.name = name;
    this.object = object;
    this.ns = ns;
    if (attrs != null) {
      this.attrs(attrs);
    }
  }

  Symbol.prototype.attrs = function(kv) {
    var k, v, _i, _len, _results;
    _results = [];
    for (v = _i = 0, _len = kv.length; _i < _len; v = ++_i) {
      k = kv[v];
      _results.push(this[k] = v);
    }
    return _results;
  };

  Symbol.prototype.is = function(symbol) {
    if (symbol.name === this.name) {
      if (symbol.object === this.object) {
        return true;
      }
      if ((symbol.object === null) && (this.object === null)) {
        return true;
      }
    } else {
      return false;
    }
  };

  Symbol.prototype.toString = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

  return Symbol;

})();

S = function(name, object, ns, attrs) {
  return new Symbol(name, object, ns, attrs);
};

NameSpace = (function() {
  function NameSpace(name, sep) {
    this.name = name;
    this.elements = {};
    this.sep = sep || ".";
  }

  NameSpace.prototype.bind = function(symbol, object) {
    var name;
    name = symbol.name;
    symbol.object = object;
    object.symbol = symbol;
    this.elements[name] = symbol;
    symbol.ns = this;
    return symbol;
  };

  NameSpace.prototype.unbind = function(name) {
    var symbol;
    symbol = this.elements[name];
    delete this.elements[name];
    symbol.ns = void 0;
    return symbol;
  };

  NameSpace.prototype.symbol = function(name) {
    return this.elements[name];
  };

  NameSpace.prototype.has = function(name) {
    if (this.elements[name] != null) {
      return true;
    } else {
      return false;
    }
  };

  NameSpace.prototype.object = function(name) {
    return this.elements[name].object;
  };

  NameSpace.prototype.symbols = function() {
    var k, symbols, v, _ref;
    symbols = [];
    _ref = this.elements;
    for (k in _ref) {
      v = _ref[k];
      symbols.push(v);
    }
    return symbols;
  };

  NameSpace.prototype.objects = function() {
    var k, objects, v, _ref;
    objects = [];
    _ref = this.elements;
    for (k in _ref) {
      v = _ref[k];
      objects.push(v.object);
    }
    return objects;
  };

  return NameSpace;

})();

Data = (function() {
  function Data(props) {
    if (props != null) {
      this.props(props);
    }
  }

  Data.prototype.props = function(kv) {
    var k, v;
    for (k in kv) {
      v = kv[k];
      this[k] = v;
    }
    return this.validator;
  };

  Data.prototype.validator = function() {
    return this;
  };

  return Data;

})();

D = function(props) {
  return new Data();
};

Signal = (function(_super) {
  __extends(Signal, _super);

  function Signal(name, payload, props) {
    this.name = name;
    this.payload = payload;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    Event.__super__.constructor.call(this, name, message, props);
    this.ts = new Date().getTime();
  }

  return Event;

})(Signal);

Glitch = (function(_super) {
  __extends(Glitch, _super);

  function Glitch(name, context, props) {
    this.name = name;
    this.context = context;
    Glitch.__super__.constructor.call(this, props);
  }

  return Glitch;

})(Data);

Token = (function(_super) {
  __extends(Token, _super);

  function Token(value, sign, props) {
    Token.__super__.constructor.call(this, props);
    this.signs = [];
    this.stamp(sign, value);
  }

  Token.prototype.by = function() {
    if (this.signs.length > 0) {
      return this.signs[this.signs.length - 1];
    } else {
      return S("Unknown");
    }
  };

  Token.prototype.stamp = function(sign, value) {
    if (value) {
      if (this[value]) {
        delete this[value];
      }
      this.value = value;
      if (typeof this.value === "string") {
        this[this.value] = true;
      }
    }
    if (sign != null) {
      return this.signs.push(value, sign);
    } else {
      return this.signs.push(S("Unknown"));
    }
  };

  return Token;

})(Data);

StopToken = (function(_super) {
  __extends(StopToken, _super);

  function StopToken(sign, props) {
    StopToken.__super__.constructor.call(this, "stop", sign, props);
  }

  return StopToken;

})(Token);

T = function(value, props) {
  return new Token(value, props);
};

Component = (function(_super) {
  __extends(Component, _super);

  function Component(name, props) {
    this.name = name;
    Component.__super__.constructor.call(this, name);
  }

  return Component;

})(Data);

Entity = (function(_super) {
  __extends(Entity, _super);

  function Entity(tags, props) {
    this.tags = tags;
    this.id = uuid.v4();
    this.components = new NameSpace("components");
    Entity.__super__.constructor.call(this, props);
  }

  Entity.prototype.add = function(symbol, component) {
    return this.components.bind(symbol, component);
  };

  Entity.prototype.remove = function(name) {
    return this.components.unbind(name);
  };

  Entity.prototype.has = function(name) {
    return this.components.has(name);
  };

  Entity.prototype.part = function(name) {
    return this.components.symbol(name);
  };

  return Entity;

})(Data);

Cell = (function(_super) {
  __extends(Cell, _super);

  function Cell(tags, props) {
    Cell.__super__.constructor.call(this, tags, props);
    this.observers = new NameSpace("observers");
  }

  Cell.prototype.notify = function(event) {
    var ob, _i, _len, _ref, _results;
    _ref = this.observers.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ob = _ref[_i];
      _results.push(ob.raise(event));
    }
    return _results;
  };

  Cell.prototype.add = function(component) {
    var event;
    Cell.__super__.add.call(this, component);
    event = new Event("component-added", {
      component: component,
      cell: this
    });
    return this.notify(event);
  };

  Cell.prototype.remove = function(name) {
    var event;
    Cell.__super__.remove.call(this, name);
    event = new Event("component-removed", {
      component: component,
      cell: this
    });
    return this.notify(event);
  };

  Cell.prototype.observe = function(symbol, system) {
    return this.observers.bind(symbol, system);
  };

  Cell.prototype.forget = function(name) {
    return this.observers.unbind(name);
  };

  Cell.prototype.step = function() {
    var args, fn;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return fn.apply(this, args);
  };

  Cell.prototype.clone = function() {
    return clone(this);
  };

  return Cell;

})(Entity);

System = (function() {
  function System(flow, conf) {
    this.flow = flow;
    this.conf = conf;
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
    this.state = [];
    this.registers = {};
  }

  System.prototype.top = function() {
    if (this.state.length > 0) {
      return this.state[this.state.length - 1];
    } else {
      return S("Unknown");
    }
  };

  System.prototype.inputValidator = function(data, inlet) {
    return data;
  };

  System.prototype.outputValidator = function(data, outlet) {
    return data;
  };

  System.prototype.STOP = function(stop_token) {};

  System.prototype.push = function(data, inlet_name) {
    var validated_data;
    if (data instanceof StopToken) {
      this.STOP(data);
      return;
    }
    inlet_name = inlet_name || "sysin";
    validated_data = this.inputValidator(data, inlet_name);
    if (validated_data instanceof Glitch) {
      return this.error(validated_data);
    } else {
      return this.process(data, inlet_name);
    }
  };

  System.prototype.goto = function(inlet_name, data) {
    return this.push(data, inlet_name);
  };

  System.prototype.process = function(data, inlet_name) {
    return this.emit(data, "stdout");
  };

  System.prototype.send = function(data, outlet_name) {
    var connection, outlet, _i, _len, _ref, _results;
    _ref = this.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === outlet_name) {
        _results.push((function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = outlet.object;
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            connection = _ref1[_j];
            _results1.push(connection.object.transmit(data));
          }
          return _results1;
        })());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  System.prototype.emit = function(data, outlet_name) {
    var validated_data;
    outlet_name = outlet_name || "sysout";
    validated_data = this.outputValidator(data, outlet_name);
    if (validated_data instanceof Glitch) {
      this.error(validated_data);
      return;
    }
    return this.send(data, outlet_name);
  };

  System.prototype.error = function(data) {
    return this.send(data, "syserr");
  };

  System.prototype.raise = function(signal) {
    return this.react(signal);
  };

  System.prototype.react = function(signal) {};

  System.prototype.show = function(data) {};

  return System;

})();

Wire = (function() {
  function Wire(outlet, inlet) {
    this.outlet = outlet;
    this.inlet = inlet;
  }

  return Wire;

})();

Connection = (function() {
  function Connection(source, sink, flow, wire) {
    this.flow = flow;
    this.source = this.flow.systems.object(source);
    this.sink = this.flow.systems.object(sink);
    this.wire = wire || new Wire("sysout", "sysin");
  }

  Connection.prototype.transmit = function(data) {
    return this.sink.push(data, this.wire.inlet);
  };

  return Connection;

})();

Store = (function() {
  function Store() {
    this.entities = new NameSpace("entities");
  }

  Store.prototype.add = function(symbol, tags, props) {
    var entity;
    tags = tags || [];
    entity = new Entity(tags, props);
    this.entities.bind(symbol, entity);
    return symbol;
  };

  Store.prototype.has = function(name) {
    return this.entities.has(name);
  };

  Store.prototype.entity = function(name) {
    return this.entities.object(name);
  };

  Store.prototype.remove = function(name) {
    return this.entities.unbind(name);
  };

  Store.prototype.id = function(id) {
    var entity, _i, _len, _ref;
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      if (entity.id === id) {
        return entity;
      }
    }
    return null;
  };

  Store.prototype.removeId = function(id) {
    var entity_symbol, _i, _len, _ref;
    _ref = this.entities.symbols();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity_symbol = _ref[_i];
      if (entity_symbol.object === id) {
        this.entities.unbind(entity_symbol.name);
      }
    }
    return null;
  };

  Store.prototype.tags = function(tags) {
    var entities, entity, tag, _i, _j, _len, _len1, _ref;
    entities = [];
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      for (_j = 0, _len1 = tags.length; _j < _len1; _j++) {
        tag = tags[_j];
        if (__indexOf.call(entity.tags, tag) >= 0) {
          entities.push(entity);
        }
      }
    }
    return entities;
  };

  return Store;

})();

Bus = (function(_super) {
  __extends(Bus, _super);

  function Bus(name, sep) {
    this.name = name;
    Bus.__super__.constructor.call(this, this.name, sep);
  }

  Bus.prototype.trigger = function(signal) {
    var obj, _i, _len, _ref, _results;
    _ref = this.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      console.log("sss");
      _results.push(obj.raise(signal));
    }
    return _results;
  };

  return Bus;

})(NameSpace);

Flow = (function() {
  function Flow() {
    this.store = new Store();
    this.bus = new Bus("systems");
    this.systems = this.bus;
    this.connections = new NameSpace("bus.connections");
    this.STOP = new StopToken();
  }

  Flow.prototype.connect = function(source, sink, wire, symbol) {
    var connection, name, outlet, _i, _len, _ref, _results;
    connection = new Connection(source, sink, this, wire);
    if (!symbol) {
      name = "" + source + "::" + connection.wire.outlet + "-" + sink + "::" + connection.wire.inlet;
      symbol = new Symbol(name);
    }
    this.connections.bind(symbol, connection);
    _ref = connection.source.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === connection.wire.outlet) {
        _results.push(outlet.object.push(symbol));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Flow.prototype.pipe = function(source, wire, sink) {
    return this.connect(source, sink, wire);
  };

  Flow.prototype.disconnect = function(name) {
    var conn, connection, connections, outlet, _i, _j, _len, _len1, _ref, _ref1, _results;
    connection = this.connection(name);
    this.connections.unbind(name);
    _ref = connection.source.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === wire.outlet) {
        connections = [];
        _ref1 = outlet.object;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          conn = _ref1[_j];
          if (conn.name !== name) {
            connections.push(conn);
          }
        }
        _results.push(outlet.object = connections);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Flow.prototype.connection = function(name) {
    return this.connections.object(name);
  };

  Flow.prototype.hasConnection = function(name) {
    return this.connections.has(name);
  };

  Flow.prototype.add = function(symbol, systemClass, conf) {
    var system;
    system = new systemClass(this, conf);
    return this.bus.bind(symbol, system);
  };

  Flow.prototype.has = function(name) {
    return this.bus.has(name);
  };

  Flow.prototype.system = function(name) {
    return this.bus.object(name);
  };

  Flow.prototype.remove = function(name) {
    var system;
    system = this.bus.object(name);
    system.push(this.STOP);
    return this.bus.unbind(name);
  };

  return Flow;

})();

exports.Symbol = Symbol;

exports.NameSpace = NameSpace;

exports.S = S;

exports.Data = Data;

exports.D = D;

exports.Signal = Signal;

exports.Event = Event;

exports.Glitch = Glitch;

exports.Token = Token;

exports.T = T;

exports.Component = Component;

exports.Entity = Entity;

exports.Cell = Cell;

exports.System = System;

exports.Wire = Wire;

exports.Connection = Connection;

exports.Store = Store;

exports.Bus = Bus;

exports.Flow = Flow;

exports.mixins = mixins;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLG1LQUFBO0VBQUE7Ozt1SkFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLFdBQVIsQ0FBUCxDQUFBOztBQUFBLEtBQ0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQURSLENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUixDQUZULENBQUE7O0FBQUE7QUFNaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLEVBQUEsR0FBSSxTQUFDLE1BQUQsR0FBQTtBQUNBLElBQUEsSUFBRyxNQUFNLENBQUMsSUFBUCxLQUFlLElBQUMsQ0FBQSxJQUFuQjtBQUNJLE1BQUEsSUFBRyxNQUFNLENBQUMsTUFBUCxLQUFpQixJQUFDLENBQUEsTUFBckI7QUFDSSxlQUFPLElBQVAsQ0FESjtPQUFBO0FBRUEsTUFBQSxJQUFHLENBQUMsTUFBTSxDQUFDLE1BQVAsS0FBaUIsSUFBbEIsQ0FBQSxJQUE0QixDQUFDLElBQUMsQ0FBQSxNQUFELEtBQVcsSUFBWixDQUEvQjtBQUNJ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QUFBLE9BNGFPLENBQUMsSUFBUixHQUFlLElBNWFmLENBQUE7O0FBQUEsT0E2YU8sQ0FBQyxVQUFSLEdBQXFCLFVBN2FyQixDQUFBOztBQUFBLE9BOGFPLENBQUMsS0FBUixHQUFnQixLQTlhaEIsQ0FBQTs7QUFBQSxPQSthTyxDQUFDLEdBQVIsR0FBYyxHQS9hZCxDQUFBOztBQUFBLE9BZ2JPLENBQUMsSUFBUixHQUFlLElBaGJmLENBQUE7O0FBQUEsT0FpYk8sQ0FBQyxNQUFSLEdBQWlCLE1BamJqQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsidXVpZCA9IHJlcXVpcmUgXCJub2RlLXV1aWRcIlxuY2xvbmUgPSByZXF1aXJlIFwiY2xvbmVcIlxubWl4aW5zID0gcmVxdWlyZSBcIi4vbGliL21peGlucy5qc1wiXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIGlzOiAoc3ltYm9sKSAtPlxuICAgICAgICBpZiBzeW1ib2wubmFtZSBpcyBAbmFtZVxuICAgICAgICAgICAgaWYgc3ltYm9sLm9iamVjdCBpcyBAb2JqZWN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIGlmIChzeW1ib2wub2JqZWN0IGlzIG51bGwpIGFuZCAoQG9iamVjdCBpcyBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdG9TdHJpbmc6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcblxuICAgIGJpbmQ6IChzeW1ib2wsIG9iamVjdCkgLT5cbiAgICAgICAgbmFtZSA9IHN5bWJvbC5uYW1lXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSBvYmplY3RcbiAgICAgICAgb2JqZWN0LnN5bWJvbCA9IHN5bWJvbFxuICAgICAgICBAZWxlbWVudHNbbmFtZV0gPSBzeW1ib2xcbiAgICAgICAgc3ltYm9sLm5zID0gdGhpc1xuICAgICAgICBzeW1ib2xcblxuICAgIHVuYmluZDogKG5hbWUpIC0+XG4gICAgICAgIHN5bWJvbCA9IEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBkZWxldGUgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIHN5bWJvbC5ucyA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2xcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIEBlbGVtZW50c1tuYW1lXVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGVsZW1lbnRzW25hbWVdP1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvYmplY3Q6IChuYW1lKSAtPlxuICAgICAgICBAZWxlbWVudHNbbmFtZV0ub2JqZWN0XG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIGlmIHByb3BzP1xuICAgICAgICAgICAgQHByb3BzKHByb3BzKVxuXG4gICAgcHJvcHM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgIEB2YWxpZGF0b3JcblxuICAgIHZhbGlkYXRvcjogLT5cbiAgICAgICAgdGhpc1xuXG5EID0gKHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRGF0YSgpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihuYW1lLCBtZXNzYWdlLCBwcm9wcylcbiAgICAgICAgQHRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQGNvbnRleHQsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAc3RhbXAoc2lnbiwgdmFsdWUpXG5cbiAgICBieTogLT5cbiAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICBAc2lnbnNbQHNpZ25zLmxlbmd0aCAtIDFdXG4gICAgICAgZWxzZVxuICAgICAgICAgICBTKFwiVW5rbm93blwiKVxuXG4gICAgc3RhbXA6IChzaWduLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIGlmIEBbdmFsdWVdXG4gICAgICAgICAgICAgICAgZGVsZXRlIEBbdmFsdWVdXG4gICAgICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgICAgICAgaWYgdHlwZW9mIEB2YWx1ZSBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgQFtAdmFsdWVdID0gdHJ1ZVxuICAgICAgICBpZiBzaWduP1xuICAgICAgICAgICAgQHNpZ25zLnB1c2godmFsdWUsIHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbmNsYXNzIFN0b3BUb2tlbiBleHRlbmRzIFRva2VuXG5cbiAgICBjb25zdHJ1Y3RvcjogKHNpZ24sIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihcInN0b3BcIiwgc2lnbiwgcHJvcHMpXG5cblQgPSAodmFsdWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHByb3BzKVxuXG5jbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIobmFtZSlcblxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEB0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgQGlkID0gdXVpZC52NCgpXG4gICAgICAgIEBjb21wb25lbnRzID0gbmV3IE5hbWVTcGFjZShcImNvbXBvbmVudHNcIilcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBhZGQ6IChzeW1ib2wsIGNvbXBvbmVudCkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMuYmluZChzeW1ib2wsIGNvbXBvbmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMuaGFzKG5hbWUpXG5cbiAgICBwYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMuc3ltYm9sKG5hbWUpXG5cblxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKGNvbXBvbmVudCkgLT5cbiAgICAgICAgc3VwZXIgY29tcG9uZW50XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LWFkZGVkXCIsIHtjb21wb25lbnQ6IGNvbXBvbmVudCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LXJlbW92ZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIHN5c3RlbSkgLT5cbiAgICAgICAgQG9ic2VydmVycy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgZm9yZ2V0OiAobmFtZSkgLT5cbiAgICAgICAgQG9ic2VydmVycy51bmJpbmQobmFtZSlcblxuICAgIHN0ZXA6IChmbiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjbG9uZTogKCkgLT5cbiAgICAgICAgcmV0dXJuIGNsb25lKHRoaXMpXG5cblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBmbG93LCBAY29uZikgLT5cbiAgICAgICAgQGlubGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJpbmxldHNcIilcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNpblwiKSxbXSlcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJmZWVkYmFja1wiKSxbXSlcbiAgICAgICAgQG91dGxldHMgPSBuZXcgTmFtZVNwYWNlKFwib3V0bGV0c1wiKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNvdXRcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2VyclwiKSxbXSlcblxuICAgICAgICBAc3RhdGUgPSBbXVxuICAgICAgICBAcmVnaXN0ZXJzID0ge31cblxuICAgIHRvcDogLT5cbiAgICAgICAgaWYgQHN0YXRlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgUyhcIlVua25vd25cIilcblxuICAgIGlucHV0VmFsaWRhdG9yOiAoZGF0YSwgaW5sZXQpIC0+XG4gICAgICAgIGRhdGFcblxuICAgIG91dHB1dFZhbGlkYXRvcjogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgU1RPUDogKHN0b3BfdG9rZW4pLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgICAgIGlmIGRhdGEgaW5zdGFuY2VvZiBTdG9wVG9rZW5cbiAgICAgICAgICAgIEBTVE9QKGRhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpbmxldF9uYW1lID0gaW5sZXRfbmFtZSB8fCBcInN5c2luXCJcblxuICAgICAgICB2YWxpZGF0ZWRfZGF0YSA9IEBpbnB1dFZhbGlkYXRvcihkYXRhLCBpbmxldF9uYW1lKVxuXG4gICAgICAgIGlmIHZhbGlkYXRlZF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGRhdGEsIGlubGV0X25hbWVcblxuICAgIGdvdG86IChpbmxldF9uYW1lLCBkYXRhKSAtPlxuICAgICAgICBAcHVzaChkYXRhLCBpbmxldF9uYW1lKVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0X25hbWUpIC0+XG4gICAgICAgIEBlbWl0KGRhdGEsIFwic3Rkb3V0XCIpXG5cbiAgICBzZW5kOiAoZGF0YSwgb3V0bGV0X25hbWUpIC0+XG4gICAgICAgIGZvciBvdXRsZXQgaW4gQG91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSA9PSBvdXRsZXRfbmFtZVxuICAgICAgICAgICAgICAgIGZvciBjb25uZWN0aW9uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBvdXRsZXRfbmFtZSA9IG91dGxldF9uYW1lIHx8IFwic3lzb3V0XCJcblxuICAgICAgICB2YWxpZGF0ZWRfZGF0YSA9IEBvdXRwdXRWYWxpZGF0b3IoZGF0YSwgb3V0bGV0X25hbWUpXG5cbiAgICAgICAgaWYgdmFsaWRhdGVkX2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcih2YWxpZGF0ZWRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzZW5kKGRhdGEsIG91dGxldF9uYW1lKVxuXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBzZW5kKGRhdGEsIFwic3lzZXJyXCIpXG5cbiAgICByYWlzZTogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIHJlYWN0OiAoc2lnbmFsKSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cblxuY2xhc3MgV2lyZVxuXG4gICAgY29uc3RydWN0b3I6IChAb3V0bGV0LCBAaW5sZXQpIC0+XG5cblxuY2xhc3MgQ29ubmVjdGlvblxuXG4gICAgY29uc3RydWN0b3I6IChzb3VyY2UsICBzaW5rLCBAZmxvdywgd2lyZSkgLT5cbiAgICAgICAgQHNvdXJjZSA9IEBmbG93LnN5c3RlbXMub2JqZWN0KHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAZmxvdy5zeXN0ZW1zLm9iamVjdChzaW5rKVxuICAgICAgICBAd2lyZSA9IHdpcmUgfHwgbmV3IFdpcmUoXCJzeXNvdXRcIiwgXCJzeXNpblwiKVxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5wdXNoKGRhdGEsIEB3aXJlLmlubGV0KVxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICB0YWdzID0gdGFncyB8fCBbXVxuICAgICAgICBlbnRpdHkgPSBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgc3ltYm9sXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMuaGFzKG5hbWUpXG5cbiAgICBlbnRpdHk6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKG5hbWUpXG5cbiAgICBpZDogKGlkKSAtPlxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5pZCBpcyBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBlbnRpdHlcblxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgcmVtb3ZlSWQ6IChpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eV9zeW1ib2wgaW4gQGVudGl0aWVzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5X3N5bWJvbC5vYmplY3QgaXMgaWRcbiAgICAgICAgICAgICAgICBAZW50aXRpZXMudW5iaW5kKGVudGl0eV9zeW1ib2wubmFtZSlcblxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICByZXR1cm4gZW50aXRpZXNcblxuY2xhc3MgQnVzIGV4dGVuZHMgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIHN1cGVyKEBuYW1lLCBzZXApXG5cbiAgICB0cmlnZ2VyOiAoc2lnbmFsKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzc3NcIilcbiAgICAgICAgICAgICAgb2JqLnJhaXNlKHNpZ25hbClcblxuY2xhc3MgRmxvd1xuXG4gICAgY29uc3RydWN0b3I6ICgpIC0+XG4gICAgICAgIEBzdG9yZSA9IG5ldyBTdG9yZSgpXG4gICAgICAgIEBidXMgPSBuZXcgQnVzKFwic3lzdGVtc1wiKVxuICAgICAgICBAc3lzdGVtcyA9IEBidXNcbiAgICAgICAgQGNvbm5lY3Rpb25zID0gbmV3IE5hbWVTcGFjZShcImJ1cy5jb25uZWN0aW9uc1wiKVxuICAgICAgICBAU1RPUCA9IG5ldyBTdG9wVG9rZW4oKVxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgd2lyZSwgc3ltYm9sKSAtPlxuXG4gICAgICAgIGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihzb3VyY2UsIHNpbmssIHRoaXMsIHdpcmUpXG4gICAgICAgIGlmICFzeW1ib2xcbiAgICAgICAgICAgIG5hbWUgPSBcIiN7c291cmNlfTo6I3tjb25uZWN0aW9uLndpcmUub3V0bGV0fS0je3Npbmt9Ojoje2Nvbm5lY3Rpb24ud2lyZS5pbmxldH1cIlxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAY29ubmVjdGlvbnMuYmluZChzeW1ib2wsIGNvbm5lY3Rpb24pXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiBjb25uZWN0aW9uLnNvdXJjZS5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgY29ubmVjdGlvbi53aXJlLm91dGxldFxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgY29ubmVjdGlvbiA9IEBjb25uZWN0aW9uKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyB3aXJlLm91dGxldFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9ucy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IGNvbm5lY3Rpb25zXG5cblxuICAgIGNvbm5lY3Rpb246IChuYW1lKSAtPlxuICAgICAgICBAY29ubmVjdGlvbnMub2JqZWN0KG5hbWUpXG5cbiAgICBoYXNDb25uZWN0aW9uOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbm5lY3Rpb25zLmhhcyhuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMsIGNvbmYpXG4gICAgICAgIEBidXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBidXMuaGFzKG5hbWUpXG5cbiAgICBzeXN0ZW06IChuYW1lKSAtPlxuICAgICAgICBAYnVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQGJ1cy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnB1c2goQFNUT1ApXG4gICAgICAgIEBidXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5TaWduYWwgPSBTaWduYWxcbmV4cG9ydHMuRXZlbnQgPSBFdmVudFxuZXhwb3J0cy5HbGl0Y2ggPSBHbGl0Y2hcbmV4cG9ydHMuVG9rZW4gPSBUb2tlblxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5Db21wb25lbnQgPSBDb21wb25lbnRcbmV4cG9ydHMuRW50aXR5ID0gRW50aXR5XG5leHBvcnRzLkNlbGwgPSBDZWxsXG5leHBvcnRzLlN5c3RlbSA9IFN5c3RlbVxuZXhwb3J0cy5XaXJlID0gV2lyZVxuZXhwb3J0cy5Db25uZWN0aW9uID0gQ29ubmVjdGlvblxuZXhwb3J0cy5TdG9yZSA9IFN0b3JlXG5leHBvcnRzLkJ1cyA9IEJ1c1xuZXhwb3J0cy5GbG93ID0gRmxvd1xuZXhwb3J0cy5taXhpbnMgPSBtaXhpbnNcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9