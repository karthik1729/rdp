var Bus, Cell, Component, Connection, D, Data, Entity, Event, Flow, Glitch, NameSpace, S, Signal, Store, Symbol, System, T, Token, Wire, clone, mixins, start, stop, uuid,
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

  Token.prototype.value = function() {
    return this.value;
  };

  Token.prototype.by = function(index) {
    if (index != null) {
      if (this.signs[index] != null) {
        return this.signs[index];
      } else {
        return S("Unknown");
      }
    }
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
      return this.signs.push(sign);
    } else {
      return this.signs.push(S("Unknown"));
    }
  };

  return Token;

})(Data);

start = function(sign, props) {
  return new Token("start", sign, props);
};

stop = function(sign, props) {
  return new Token("stop", sign, props);
};

T = function(value, sign, props) {
  return new Token(value, sign, props);
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
    this.r = {};
  }

  System.prototype.top = function(index) {
    if (index != null) {
      if (this.state[index] != null) {
        return this.state[index];
      } else {
        return S("Unknown");
      }
    }
    if (this.state.length > 0) {
      return this.state[this.state.length - 1];
    } else {
      return S("Unknown");
    }
  };

  System.prototype.input = function(data, inlet) {
    return data;
  };

  System.prototype.output = function(data, outlet) {
    return data;
  };

  System.prototype.STOP = function(stop_token) {};

  System.prototype.push = function(data, inlet_name) {
    var input_data;
    inlet_name = inlet_name || "sysin";
    input_data = this.input(data, inlet_name);
    if (input_data instanceof Glitch) {
      return this.error(input_data);
    } else {
      return this.process(input_data, inlet_name);
    }
  };

  System.prototype.goto_with = function(inlet_name, data) {
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
    var output_data;
    outlet_name = outlet_name || "sysout";
    output_data = this.output(data, outlet_name);
    if (output_data instanceof Glitch) {
      this.error(output_data);
      return;
    }
    return this.send(output_data, outlet_name);
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
    this.source = this.flow.systems.symbol(source);
    this.sink = this.flow.systems.symbol(sink);
    this.wire = wire || new Wire(this.source.object.outlets.symbol("sysout"), this.sink.object.inlets.symbol("sysin"));
  }

  Connection.prototype.transmit = function(data) {
    return this.sink.object.push(data, this.wire.inlet.name);
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
      _results.push(obj.raise(signal));
    }
    return _results;
  };

  return Bus;

})(NameSpace);

Flow = (function() {
  function Flow(connectionClass, storeClass, busClass) {
    storeClass = storeClass || Store;
    busClass = busClass || Bus;
    this.connectionClass = connectionClass || Connection;
    this.store = new storeClass();
    this.bus = new busClass("systems");
    this.systems = this.bus;
    this.connections = new NameSpace("bus.connections");
  }

  Flow.prototype.connect = function(source, sink, wire, symbol) {
    var connection, name, outlet, _i, _len, _ref, _results;
    connection = new this.connectionClass(source, sink, this, wire);
    if (!symbol) {
      name = "" + source + "::" + connection.wire.outlet.name + "-" + sink + "::" + connection.wire.inlet.name;
      symbol = new Symbol(name);
    }
    this.connections.bind(symbol, connection);
    _ref = connection.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === connection.wire.outlet.name) {
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
    _ref = connection.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === connection.wire.outlet.name) {
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

exports.start = start;

exports.stop = stop;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLHFLQUFBO0VBQUE7Ozt1SkFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLFdBQVIsQ0FBUCxDQUFBOztBQUFBLEtBQ0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQURSLENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUixDQUZULENBQUE7O0FBQUE7QUFNaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLEVBQUEsR0FBSSxTQUFDLE1BQUQsR0FBQTtBQUNBLElBQUEsSUFBRyxNQUFNLENBQUMsSUFBUCxLQUFlLElBQUMsQ0FBQSxJQUFuQjtBQUNJLE1BQUEsSUFBRyxNQUFNLENBQUMsTUFBUCxLQUFpQixJQUFDLENBQUEsTUFBckI7QUFDSSxlQUFPLElBQVAsQ0FESjtPQUFBO0FBRUEsTUFBQSxJQUFHLENBQUMsTUFBTSxDQUFDLE1BQVAsS0FBaUIsSUFBbEIsQ0FBQSxJQUE0QixDQUFDLElBQUMsQ0FBQSxNQUFELEtBQVcsSUFBWixDQUEvQjtBQUNJ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OWJmLENBQUE7O0FBQUEsT0ErYk8sQ0FBQyxNQUFSLEdBQWlCLE1BL2JqQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsidXVpZCA9IHJlcXVpcmUgXCJub2RlLXV1aWRcIlxuY2xvbmUgPSByZXF1aXJlIFwiY2xvbmVcIlxubWl4aW5zID0gcmVxdWlyZSBcIi4vbGliL21peGlucy5qc1wiXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIGlzOiAoc3ltYm9sKSAtPlxuICAgICAgICBpZiBzeW1ib2wubmFtZSBpcyBAbmFtZVxuICAgICAgICAgICAgaWYgc3ltYm9sLm9iamVjdCBpcyBAb2JqZWN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIGlmIChzeW1ib2wub2JqZWN0IGlzIG51bGwpIGFuZCAoQG9iamVjdCBpcyBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdG9TdHJpbmc6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcblxuICAgIGJpbmQ6IChzeW1ib2wsIG9iamVjdCkgLT5cbiAgICAgICAgbmFtZSA9IHN5bWJvbC5uYW1lXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSBvYmplY3RcbiAgICAgICAgb2JqZWN0LnN5bWJvbCA9IHN5bWJvbFxuICAgICAgICBAZWxlbWVudHNbbmFtZV0gPSBzeW1ib2xcbiAgICAgICAgc3ltYm9sLm5zID0gdGhpc1xuICAgICAgICBzeW1ib2xcblxuICAgIHVuYmluZDogKG5hbWUpIC0+XG4gICAgICAgIHN5bWJvbCA9IEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBkZWxldGUgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIHN5bWJvbC5ucyA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2xcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIEBlbGVtZW50c1tuYW1lXVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGVsZW1lbnRzW25hbWVdP1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvYmplY3Q6IChuYW1lKSAtPlxuICAgICAgICBAZWxlbWVudHNbbmFtZV0ub2JqZWN0XG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIGlmIHByb3BzP1xuICAgICAgICAgICAgQHByb3BzKHByb3BzKVxuXG4gICAgcHJvcHM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgIEB2YWxpZGF0b3JcblxuICAgIHZhbGlkYXRvcjogLT5cbiAgICAgICAgdGhpc1xuXG5EID0gKHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRGF0YSgpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihuYW1lLCBtZXNzYWdlLCBwcm9wcylcbiAgICAgICAgQHRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQGNvbnRleHQsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAc3RhbXAoc2lnbiwgdmFsdWUpXG5cbiAgICB2YWx1ZTogLT5cbiAgICAgICAgQHZhbHVlXG5cbiAgICBieTogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgaWYgQHNpZ25zW2luZGV4XT9cbiAgICAgICAgICAgICAgIHJldHVybiBAc2lnbnNbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gUyhcIlVua25vd25cIilcblxuICAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICBAc2lnbnNbQHNpZ25zLmxlbmd0aCAtIDFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgUyhcIlVua25vd25cIilcblxuICAgIHN0YW1wOiAoc2lnbiwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlXG4gICAgICAgICAgICBpZiBAW3ZhbHVlXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBAW3ZhbHVlXVxuICAgICAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgICAgIGlmIHR5cGVvZiBAdmFsdWUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgaWYgc2lnbj9cbiAgICAgICAgICAgIEBzaWducy5wdXNoKHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbnN0YXJ0ID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdGFydFwiLCBzaWduLCBwcm9wcylcblxuc3RvcCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RvcFwiLCBzaWduLCBwcm9wcylcblxuVCA9ICh2YWx1ZSwgc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbih2YWx1ZSwgc2lnbiwgcHJvcHMpXG5cbmNsYXNzIENvbXBvbmVudCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihuYW1lKVxuXG5cbmNsYXNzIEVudGl0eSBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBAaWQgPSB1dWlkLnY0KClcbiAgICAgICAgQGNvbXBvbmVudHMgPSBuZXcgTmFtZVNwYWNlKFwiY29tcG9uZW50c1wiKVxuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgY29tcG9uZW50KSAtPlxuICAgICAgICBAY29tcG9uZW50cy5iaW5kKHN5bWJvbCwgY29tcG9uZW50KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMudW5iaW5kKG5hbWUpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAY29tcG9uZW50cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAY29tcG9uZW50cy5zeW1ib2wobmFtZSlcblxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKGNvbXBvbmVudCkgLT5cbiAgICAgICAgc3VwZXIgY29tcG9uZW50XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LWFkZGVkXCIsIHtjb21wb25lbnQ6IGNvbXBvbmVudCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LXJlbW92ZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIHN5c3RlbSkgLT5cbiAgICAgICAgQG9ic2VydmVycy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgZm9yZ2V0OiAobmFtZSkgLT5cbiAgICAgICAgQG9ic2VydmVycy51bmJpbmQobmFtZSlcblxuICAgIHN0ZXA6IChmbiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjbG9uZTogKCkgLT5cbiAgICAgICAgcmV0dXJuIGNsb25lKHRoaXMpXG5cblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBmbG93LCBAY29uZikgLT5cbiAgICAgICAgQGlubGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJpbmxldHNcIilcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNpblwiKSxbXSlcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJmZWVkYmFja1wiKSxbXSlcbiAgICAgICAgQG91dGxldHMgPSBuZXcgTmFtZVNwYWNlKFwib3V0bGV0c1wiKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNvdXRcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2VyclwiKSxbXSlcblxuICAgICAgICBAc3RhdGUgPSBbXVxuICAgICAgICBAciA9IHt9XG5cbiAgICB0b3A6IChpbmRleCkgLT5cbiAgICAgICAgaWYgaW5kZXg/XG4gICAgICAgICAgICBpZiBAc3RhdGVbaW5kZXhdP1xuICAgICAgICAgICAgICAgIHJldHVybiBAc3RhdGVbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIFMoXCJVbmtub3duXCIpXG5cbiAgICAgICAgaWYgQHN0YXRlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBAc3RhdGVbQHN0YXRlLmxlbmd0aCAtIDFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBTKFwiVW5rbm93blwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgICAgIGlubGV0X25hbWUgPSBpbmxldF9uYW1lIHx8IFwic3lzaW5cIlxuXG4gICAgICAgIGlucHV0X2RhdGEgPSBAaW5wdXQoZGF0YSwgaW5sZXRfbmFtZSlcblxuICAgICAgICBpZiBpbnB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IoaW5wdXRfZGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHByb2Nlc3MgaW5wdXRfZGF0YSwgaW5sZXRfbmFtZVxuXG4gICAgZ290b193aXRoOiAoaW5sZXRfbmFtZSwgZGF0YSkgLT5cbiAgICAgICAgQHB1c2goZGF0YSwgaW5sZXRfbmFtZSlcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuICAgICAgICBAZW1pdChkYXRhLCBcInN0ZG91dFwiKVxuXG4gICAgc2VuZDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBmb3Igb3V0bGV0IGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgPT0gb3V0bGV0X25hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVtaXQ6IChkYXRhLCBvdXRsZXRfbmFtZSkgLT5cbiAgICAgICAgb3V0bGV0X25hbWUgPSBvdXRsZXRfbmFtZSB8fCBcInN5c291dFwiXG5cbiAgICAgICAgb3V0cHV0X2RhdGEgPSBAb3V0cHV0KGRhdGEsIG91dGxldF9uYW1lKVxuXG4gICAgICAgIGlmIG91dHB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3Iob3V0cHV0X2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc2VuZChvdXRwdXRfZGF0YSwgb3V0bGV0X25hbWUpXG5cblxuICAgIGVycm9yOiAoZGF0YSkgLT5cbiAgICAgICAgQHNlbmQoZGF0YSwgXCJzeXNlcnJcIilcblxuICAgIHJhaXNlOiAoc2lnbmFsKSAtPlxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgcmVhY3Q6IChzaWduYWwpIC0+XG5cbiAgICBzaG93OiAoZGF0YSkgLT5cblxuXG5jbGFzcyBXaXJlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBvdXRsZXQsIEBpbmxldCkgLT5cblxuXG5jbGFzcyBDb25uZWN0aW9uXG5cbiAgICBjb25zdHJ1Y3RvcjogKHNvdXJjZSwgIHNpbmssIEBmbG93LCB3aXJlKSAtPlxuICAgICAgICBAc291cmNlID0gQGZsb3cuc3lzdGVtcy5zeW1ib2woc291cmNlKVxuICAgICAgICBAc2luayA9IEBmbG93LnN5c3RlbXMuc3ltYm9sKHNpbmspXG4gICAgICAgIEB3aXJlID0gd2lyZSB8fCBuZXcgV2lyZShAc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbChcInN5c291dFwiKSwgQHNpbmsub2JqZWN0LmlubGV0cy5zeW1ib2woXCJzeXNpblwiKSlcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQHdpcmUuaW5sZXQubmFtZSlcblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoc3ltYm9sLCB0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgW11cbiAgICAgICAgZW50aXR5ID0gbmV3IEVudGl0eSh0YWdzLCBwcm9wcylcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIHN5bWJvbFxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLmhhcyhuYW1lKVxuXG4gICAgZW50aXR5OiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChuYW1lKVxuXG4gICAgaWQ6IChpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaWQgaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHJlbW92ZUlkOiAoaWQpIC0+XG4gICAgICAgIGZvciBlbnRpdHlfc3ltYm9sIGluIEBlbnRpdGllcy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIGVudGl0eV9zeW1ib2wub2JqZWN0IGlzIGlkXG4gICAgICAgICAgICAgICAgQGVudGl0aWVzLnVuYmluZChlbnRpdHlfc3ltYm9sLm5hbWUpXG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHRhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIGVudGl0aWVzXG5cbmNsYXNzIEJ1cyBleHRlbmRzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBzdXBlcihAbmFtZSwgc2VwKVxuXG4gICAgdHJpZ2dlcjogKHNpZ25hbCkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cygpXG4gICAgICAgICAgICAgIG9iai5yYWlzZShzaWduYWwpXG5cbmNsYXNzIEZsb3dcblxuICAgIGNvbnN0cnVjdG9yOiAoY29ubmVjdGlvbkNsYXNzLCBzdG9yZUNsYXNzLCBidXNDbGFzcykgLT5cbiAgICAgICAgc3RvcmVDbGFzcyA9IHN0b3JlQ2xhc3MgfHwgU3RvcmVcbiAgICAgICAgYnVzQ2xhc3MgPSBidXNDbGFzcyB8fCBCdXNcbiAgICAgICAgQGNvbm5lY3Rpb25DbGFzcyA9IGNvbm5lY3Rpb25DbGFzcyB8fCBDb25uZWN0aW9uXG4gICAgICAgIEBzdG9yZSA9IG5ldyBzdG9yZUNsYXNzKClcbiAgICAgICAgQGJ1cyA9IG5ldyBidXNDbGFzcyhcInN5c3RlbXNcIilcbiAgICAgICAgQHN5c3RlbXMgPSBAYnVzXG4gICAgICAgIEBjb25uZWN0aW9ucyA9IG5ldyBOYW1lU3BhY2UoXCJidXMuY29ubmVjdGlvbnNcIilcblxuICAgIGNvbm5lY3Q6IChzb3VyY2UsIHNpbmssIHdpcmUsIHN5bWJvbCkgLT5cblxuICAgICAgICBjb25uZWN0aW9uID0gbmV3IEBjb25uZWN0aW9uQ2xhc3Moc291cmNlLCBzaW5rLCB0aGlzLCB3aXJlKVxuICAgICAgICBpZiAhc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gXCIje3NvdXJjZX06OiN7Y29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lfS0je3Npbmt9Ojoje2Nvbm5lY3Rpb24ud2lyZS5pbmxldC5uYW1lfVwiXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy5iaW5kKHN5bWJvbCwgY29ubmVjdGlvbilcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgY29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdC5wdXNoKHN5bWJvbClcblxuICAgIHBpcGU6IChzb3VyY2UsIHdpcmUsIHNpbmspIC0+XG4gICAgICAgIEBjb25uZWN0KHNvdXJjZSwgc2luaywgd2lyZSlcblxuICAgIGRpc2Nvbm5lY3Q6IChuYW1lKSAtPlxuICAgICAgICBjb25uZWN0aW9uID0gQGNvbm5lY3Rpb24obmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLnVuYmluZChuYW1lKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyBjb25uZWN0aW9uLndpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9ucyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbnMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSBjb25uZWN0aW9uc1xuXG5cbiAgICBjb25uZWN0aW9uOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbm5lY3Rpb25zLm9iamVjdChuYW1lKVxuXG4gICAgaGFzQ29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5oYXMobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAYnVzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAYnVzLmhhcyhuYW1lKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN5c3RlbSA9IEBidXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5wdXNoKEBTVE9QKVxuICAgICAgICBAYnVzLnVuYmluZChuYW1lKVxuXG5leHBvcnRzLlN5bWJvbCA9IFN5bWJvbFxuZXhwb3J0cy5OYW1lU3BhY2UgPSBOYW1lU3BhY2VcbmV4cG9ydHMuUyA9IFNcbmV4cG9ydHMuRGF0YSA9IERhdGFcbmV4cG9ydHMuRCA9IERcbmV4cG9ydHMuU2lnbmFsID0gU2lnbmFsXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuc3RhcnQgPSBzdGFydFxuZXhwb3J0cy5zdG9wID0gc3RvcFxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5Db21wb25lbnQgPSBDb21wb25lbnRcbmV4cG9ydHMuRW50aXR5ID0gRW50aXR5XG5leHBvcnRzLkNlbGwgPSBDZWxsXG5leHBvcnRzLlN5c3RlbSA9IFN5c3RlbVxuZXhwb3J0cy5XaXJlID0gV2lyZVxuZXhwb3J0cy5Db25uZWN0aW9uID0gQ29ubmVjdGlvblxuZXhwb3J0cy5TdG9yZSA9IFN0b3JlXG5leHBvcnRzLkJ1cyA9IEJ1c1xuZXhwb3J0cy5GbG93ID0gRmxvd1xuZXhwb3J0cy5taXhpbnMgPSBtaXhpbnNcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9