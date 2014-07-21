var Bus, Cell, Component, Connection, D, Data, Entity, Event, Flow, Glitch, NameSpace, S, Signal, Store, Symbol, System, T, Token, Wire, clone, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

uuid = require("node-uuid");

clone = require("clone");

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

  Symbol.prototype.toString = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

  return Symbol;

})();

S = function(name, object, ns, props) {
  return new Symbol(name, object, ns, props);
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

  function Signal(name, message, props) {
    this.name = name;
    this.message = message;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    this.name = name;
    this.payload = payload;
    this.ts = new Date().getTime();
    Event.__super__.constructor.call(this, props);
  }

  return Event;

})(Data);

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

  function Token(value, props) {
    this.value = value;
    if (typeof this.value === "string") {
      this[this.value] = true;
    }
    Token.__super__.constructor.call(this, props);
  }

  return Token;

})(Data);

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
  function System(flow) {
    this.flow = flow;
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
    this.state = [];
    this.registers = {};
  }

  System.prototype.start = function(conf) {
    this.conf = conf;
  };

  System.prototype.stop = function() {};

  System.prototype.inputValidator = function(data, inlet) {
    console.log(this.symbol.name);
    console.log(data);
    return data;
  };

  System.prototype.outputValidator = function(data, outlet) {
    console.log(this.symbol.name);
    console.log(data);
    return data;
  };

  System.prototype.push = function(data, inlet_name) {
    var validated_data;
    inlet_name = inlet_name || "sysin";
    validated_data = this.inputValidator(data, "inlet");
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

  System.prototype.raise = function(event) {};

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

Bus = (function() {
  function Bus() {
    this.systems = new NameSpace("bus");
  }

  Bus.prototype.add = function(symbol, SystemClass, conf) {
    var sytem;
    sytem = new SystemClass(this, conf);
    return this.systems.bind(symbol, sytem);
  };

  Bus.prototype.remove = function(name) {
    return this.systems.unbind(name);
  };

  Bus.prototype.trigger = function(event) {
    var obj, _i, _len, _ref, _results;
    _ref = this.systems.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      _results.push(obj.raise(event));
    }
    return _results;
  };

  return Bus;

})();

Flow = (function() {
  function Flow() {
    this.bus = new Bus();
    this.store = new Store();
    this.systems = new NameSpace("systems");
    this.connections = new NameSpace("systems.connections");
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

  Flow.prototype.add = function(symbol, systemClass, conf) {
    var system;
    system = new systemClass(this);
    system.start(conf);
    return this.systems.bind(symbol, system);
  };

  Flow.prototype.system = function(name) {
    return this.systems.object(name);
  };

  Flow.prototype.remove = function(name) {
    var system;
    system = this.systems.object(name);
    system.stop();
    return this.systems.unbind(name);
  };

  return Flow;

})();

exports.Symbol = Symbol;

exports.NameSpace = NameSpace;

exports.S = S;

exports.Data = Data;

exports.D = D;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLGdKQUFBO0VBQUE7Ozt1SkFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLFdBQVIsQ0FBUCxDQUFBOztBQUFBLEtBQ0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQURSLENBQUE7O0FBQUE7QUFLaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLFFBQUEsR0FBVSxTQUFBLEdBQUE7QUFDUCxJQUFBLElBQUcsZUFBSDtBQUNJLGFBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLEdBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLElBQUMsQ0FBQSxJQUE3QixDQURKO0tBQUEsTUFBQTtBQUdJLGFBQU8sSUFBQyxDQUFBLElBQVIsQ0FISjtLQURPO0VBQUEsQ0FSVixDQUFBOztnQkFBQTs7SUFMSixDQUFBOztBQUFBLENBbUJBLEdBQUksU0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLEVBQWYsRUFBbUIsS0FBbkIsR0FBQTtBQUNBLFNBQVcsSUFBQSxNQUFB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LENBQUE7O0FBQUEsT0FzWE8sQ0FBQyxNQUFSLEdBQWlCLE1BdFhqQixDQUFBOztBQUFBLE9BdVhPLENBQUMsS0FBUixHQUFnQixLQXZYaEIsQ0FBQTs7QUFBQSxPQXdYTyxDQUFDLENBQVIsR0FBWSxDQXhYWixDQUFBOztBQUFBLE9BeVhPLENBQUMsU0FBUixHQUFvQixTQXpYcEIsQ0FBQTs7QUFBQSxPQTBYTyxDQUFDLE1BQVIsR0FBaUIsTUExWGpCLENBQUE7O0FBQUEsT0EyWE8sQ0FBQyxJQUFSLEdBQWUsSUEzWGYsQ0FBQTs7QUFBQSxPQTRYTyxDQUFDLE1BQVIsR0FBaUIsTUE1WGpCLENBQUE7O0FBQUEsT0E2WE8sQ0FBQyxJQUFSLEdBQWUsSUE3WGYsQ0FBQTs7QUFBQSxPQThYTyxDQUFDLFVBQVIsR0FBcUIsVUE5WHJCLENBQUE7O0FBQUEsT0ErWE8sQ0FBQyxLQUFSLEdBQWdCLEtBL1hoQixDQUFBOztBQUFBLE9BZ1lPLENBQUMsR0FBUixHQUFjLEdBaFlkLENBQUE7O0FBQUEsT0FpWU8sQ0FBQyxJQUFSLEdBQWUsSUFqWWYsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbInV1aWQgPSByZXF1aXJlIFwibm9kZS11dWlkXCJcbmNsb25lID0gcmVxdWlyZSBcImNsb25lXCJcblxuY2xhc3MgU3ltYm9sXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAb2JqZWN0LCBAbnMsIGF0dHJzKSAtPlxuICAgICAgICBpZiBhdHRycz9cbiAgICAgICAgICAgIEBhdHRycyhhdHRycylcblxuICAgIGF0dHJzOiAoa3YpIC0+XG4gICAgICAgIGZvciBrLCB2IGluIGt2XG4gICAgICAgICAgICBAW2tdID0gdlxuXG4gICAgdG9TdHJpbmc6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBwcm9wcylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcblxuICAgIGJpbmQ6IChzeW1ib2wsIG9iamVjdCkgLT5cbiAgICAgICAgbmFtZSA9IHN5bWJvbC5uYW1lXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSBvYmplY3RcbiAgICAgICAgb2JqZWN0LnN5bWJvbCA9IHN5bWJvbFxuICAgICAgICBAZWxlbWVudHNbbmFtZV0gPSBzeW1ib2xcbiAgICAgICAgc3ltYm9sLm5zID0gdGhpc1xuICAgICAgICBzeW1ib2xcblxuICAgIHVuYmluZDogKG5hbWUpIC0+XG4gICAgICAgIHN5bWJvbCA9IEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBkZWxldGUgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIHN5bWJvbC5ucyA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2xcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIEBlbGVtZW50c1tuYW1lXVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGVsZW1lbnRzW25hbWVdP1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvYmplY3Q6IChuYW1lKSAtPlxuICAgICAgICBAZWxlbWVudHNbbmFtZV0ub2JqZWN0XG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIGlmIHByb3BzP1xuICAgICAgICAgICAgQHByb3BzKHByb3BzKVxuXG4gICAgcHJvcHM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgIEB2YWxpZGF0b3JcblxuICAgIHZhbGlkYXRvcjogLT5cbiAgICAgICAgdGhpc1xuXG5EID0gKHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRGF0YSgpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBtZXNzYWdlLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBAdHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEdsaXRjaCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBjb250ZXh0LCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh2YWx1ZSwgcHJvcHMpICAtPlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgICBpZiB0eXBlb2YgQHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cblQgPSAodmFsdWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHByb3BzKVxuXG5jbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIobmFtZSlcblxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEB0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgQGlkID0gdXVpZC52NCgpXG4gICAgICAgIEBjb21wb25lbnRzID0gbmV3IE5hbWVTcGFjZShcImNvbXBvbmVudHNcIilcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBhZGQ6IChzeW1ib2wsIGNvbXBvbmVudCkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMuYmluZChzeW1ib2wsIGNvbXBvbmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLnVuYmluZChuYW1lKVxuXG4gICAgcGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLnN5bWJvbChuYW1lKVxuXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLnJhaXNlKGV2ZW50KVxuXG4gICAgYWRkOiAoY29tcG9uZW50KSAtPlxuICAgICAgICBzdXBlciBjb21wb25lbnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJjb21wb25lbnQtYWRkZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJjb21wb25lbnQtcmVtb3ZlZFwiLCB7Y29tcG9uZW50OiBjb21wb25lbnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuXG5jbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGZsb3cpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG5cbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHJlZ2lzdGVycyA9IHt9XG5cbiAgICBzdGFydDogKEBjb25mKSAtPlxuXG4gICAgc3RvcDogKCkgLT5cblxuICAgIGlucHV0VmFsaWRhdG9yOiAoZGF0YSwgaW5sZXQpIC0+XG4gICAgICAgIGNvbnNvbGUubG9nKEBzeW1ib2wubmFtZSlcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0VmFsaWRhdG9yOiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBjb25zb2xlLmxvZyhAc3ltYm9sLm5hbWUpXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGRhdGFcblxuICAgIHB1c2g6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgICAgIGlubGV0X25hbWUgPSBpbmxldF9uYW1lIHx8IFwic3lzaW5cIlxuXG4gICAgICAgIHZhbGlkYXRlZF9kYXRhID0gQGlucHV0VmFsaWRhdG9yKGRhdGEsIFwiaW5sZXRcIilcblxuICAgICAgICBpZiB2YWxpZGF0ZWRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKHZhbGlkYXRlZF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBkYXRhLCBpbmxldF9uYW1lXG5cbiAgICBnb3RvOiAoaW5sZXRfbmFtZSwgZGF0YSkgLT5cbiAgICAgICAgQHB1c2goZGF0YSwgaW5sZXRfbmFtZSlcblxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0X25hbWUpIC0+XG4gICAgICAgIEBlbWl0KGRhdGEsIFwic3Rkb3V0XCIpXG5cbiAgICBzZW5kOiAoZGF0YSwgb3V0bGV0X25hbWUpIC0+XG4gICAgICAgIGZvciBvdXRsZXQgaW4gQG91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSA9PSBvdXRsZXRfbmFtZVxuICAgICAgICAgICAgICAgIGZvciBjb25uZWN0aW9uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBvdXRsZXRfbmFtZSA9IG91dGxldF9uYW1lIHx8IFwic3lzb3V0XCJcblxuICAgICAgICB2YWxpZGF0ZWRfZGF0YSA9IEBvdXRwdXRWYWxpZGF0b3IoZGF0YSwgb3V0bGV0X25hbWUpXG5cbiAgICAgICAgaWYgdmFsaWRhdGVkX2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcih2YWxpZGF0ZWRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzZW5kKGRhdGEsIG91dGxldF9uYW1lKVxuXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBzZW5kKGRhdGEsIFwic3lzZXJyXCIpXG5cbiAgICByYWlzZTogKGV2ZW50KSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cblxuY2xhc3MgV2lyZVxuXG4gICAgY29uc3RydWN0b3I6IChAb3V0bGV0LCBAaW5sZXQpIC0+XG5cblxuY2xhc3MgQ29ubmVjdGlvblxuXG4gICAgY29uc3RydWN0b3I6IChzb3VyY2UsICBzaW5rLCBAZmxvdywgd2lyZSkgLT5cbiAgICAgICAgQHNvdXJjZSA9IEBmbG93LnN5c3RlbXMub2JqZWN0KHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAZmxvdy5zeXN0ZW1zLm9iamVjdChzaW5rKVxuICAgICAgICBAd2lyZSA9IHdpcmUgfHwgbmV3IFdpcmUoXCJzeXNvdXRcIiwgXCJzeXNpblwiKVxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5wdXNoKGRhdGEsIEB3aXJlLmlubGV0KVxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICB0YWdzID0gdGFncyB8fCBbXVxuICAgICAgICBlbnRpdHkgPSBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgc3ltYm9sXG5cbiAgICBlbnRpdHk6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKG5hbWUpXG5cbiAgICBpZDogKGlkKSAtPlxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5pZCBpcyBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBlbnRpdHlcblxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgcmVtb3ZlSWQ6IChpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eV9zeW1ib2wgaW4gQGVudGl0aWVzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5X3N5bWJvbC5vYmplY3QgaXMgaWRcbiAgICAgICAgICAgICAgICBAZW50aXRpZXMudW5iaW5kKGVudGl0eV9zeW1ib2wubmFtZSlcblxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICByZXR1cm4gZW50aXRpZXNcblxuY2xhc3MgQnVzXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQHN5c3RlbXMgPSBuZXcgTmFtZVNwYWNlKFwiYnVzXCIpXG5cbiAgICBhZGQ6IChzeW1ib2wsIFN5c3RlbUNsYXNzLCBjb25mKSAtPlxuICAgICAgICBzeXRlbSA9IG5ldyBTeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAc3lzdGVtcy5iaW5kKHN5bWJvbCwgc3l0ZW0pXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAc3lzdGVtcy51bmJpbmQobmFtZSlcblxuICAgIHRyaWdnZXI6IChldmVudCkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAc3lzdGVtcy5vYmplY3RzKClcbiAgICAgICAgICAgICAgICBvYmoucmFpc2UoZXZlbnQpXG5cbmNsYXNzIEZsb3dcblxuICAgIGNvbnN0cnVjdG9yOiAoKSAtPlxuICAgICAgICBAYnVzID0gbmV3IEJ1cygpXG4gICAgICAgIEBzdG9yZSA9IG5ldyBTdG9yZSgpXG4gICAgICAgIEBzeXN0ZW1zID0gbmV3IE5hbWVTcGFjZShcInN5c3RlbXNcIilcbiAgICAgICAgQGNvbm5lY3Rpb25zID0gbmV3IE5hbWVTcGFjZShcInN5c3RlbXMuY29ubmVjdGlvbnNcIilcblxuICAgIGNvbm5lY3Q6IChzb3VyY2UsIHNpbmssIHdpcmUsIHN5bWJvbCkgLT5cblxuICAgICAgICBjb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24oc291cmNlLCBzaW5rLCB0aGlzLCB3aXJlKVxuICAgICAgICBpZiAhc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gXCIje3NvdXJjZX06OiN7Y29ubmVjdGlvbi53aXJlLm91dGxldH0tI3tzaW5rfTo6I3tjb25uZWN0aW9uLndpcmUuaW5sZXR9XCJcbiAgICAgICAgICAgIHN5bWJvbCA9IG5ldyBTeW1ib2wobmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLmJpbmQoc3ltYm9sLCBjb25uZWN0aW9uKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIGNvbm5lY3Rpb24ud2lyZS5vdXRsZXRcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0LnB1c2goc3ltYm9sKVxuXG4gICAgcGlwZTogKHNvdXJjZSwgd2lyZSwgc2luaykgLT5cbiAgICAgICAgQGNvbm5lY3Qoc291cmNlLCBzaW5rLCB3aXJlKVxuXG4gICAgZGlzY29ubmVjdDogKG5hbWUpIC0+XG4gICAgICAgIGNvbm5lY3Rpb24gPSBAY29ubmVjdGlvbihuYW1lKVxuICAgICAgICBAY29ubmVjdGlvbnMudW5iaW5kKG5hbWUpXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiBjb25uZWN0aW9uLnNvdXJjZS5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXRcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9ucyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbnMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSBjb25uZWN0aW9uc1xuXG5cbiAgICBjb25uZWN0aW9uOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbm5lY3Rpb25zLm9iamVjdChuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMpXG4gICAgICAgIHN5c3RlbS5zdGFydChjb25mKVxuICAgICAgICBAc3lzdGVtcy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQHN5c3RlbXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzeXN0ZW0gPSBAc3lzdGVtcy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnN0b3AoKVxuICAgICAgICBAc3lzdGVtcy51bmJpbmQobmFtZSlcblxuZXhwb3J0cy5TeW1ib2wgPSBTeW1ib2xcbmV4cG9ydHMuTmFtZVNwYWNlID0gTmFtZVNwYWNlXG5leHBvcnRzLlMgPSBTXG5leHBvcnRzLkRhdGEgPSBEYXRhXG5leHBvcnRzLkQgPSBEXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuVCA9IFRcbmV4cG9ydHMuQ29tcG9uZW50ID0gQ29tcG9uZW50XG5leHBvcnRzLkVudGl0eSA9IEVudGl0eVxuZXhwb3J0cy5DZWxsID0gQ2VsbFxuZXhwb3J0cy5TeXN0ZW0gPSBTeXN0ZW1cbmV4cG9ydHMuV2lyZSA9IFdpcmVcbmV4cG9ydHMuQ29ubmVjdGlvbiA9IENvbm5lY3Rpb25cbmV4cG9ydHMuU3RvcmUgPSBTdG9yZVxuZXhwb3J0cy5CdXMgPSBCdXNcbmV4cG9ydHMuRmxvdyA9IEZsb3dcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9