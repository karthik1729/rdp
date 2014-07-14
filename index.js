var Bus, Cell, Component, Connection, D, Data, DiscreteSystem, Entity, Error, Event, Flow, GO, NameSpace, S, Store, Symbol, System, T, Token, Wire, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

uuid = require("node-uuid");

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
    return this.symbols[name];
  };

  NameSpace.prototype.object = function(name) {
    return this.symbols[name].object;
  };

  NameSpace.prototype.symbols = function(name) {
    var k, symbols, v, _i, _len, _ref;
    symbols = [];
    _ref = this.elements;
    for (v = _i = 0, _len = _ref.length; _i < _len; v = ++_i) {
      k = _ref[v];
      symbols.push(v);
    }
    return symbols;
  };

  NameSpace.prototype.objects = function(name) {
    var k, objects, v, _i, _len, _ref;
    objects = [];
    _ref = this.elements;
    for (v = _i = 0, _len = _ref.length; _i < _len; v = ++_i) {
      k = _ref[v];
      objects.push(v.value);
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
    var k, v, _i, _len, _results;
    _results = [];
    for (v = _i = 0, _len = kv.length; _i < _len; v = ++_i) {
      k = kv[v];
      _results.push(this[k] = v);
    }
    return _results;
  };

  return Data;

})();

D = function(props) {
  return new Data();
};

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    this.name = name;
    this.payload = payload;
    Event.__super__.constructor.call(this, props);
  }

  return Event;

})(Data);

Error = (function(_super) {
  __extends(Error, _super);

  function Error(name, context, props) {
    this.name = name;
    this.context = context;
    Error.__super__.constructor.call(this, props);
  }

  return Error;

})(Data);

Token = (function(_super) {
  __extends(Token, _super);

  function Token(value, props) {
    this.value = value;
    Token.__super__.constructor.call(this, props);
  }

  Token.prototype.stamp = function(value) {
    return this.value = value;
  };

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
    this.uuid = uuid.v4();
    this.components = new NameSpace(name + ".components");
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
    this.observers = new NameSpace(name + ".observers");
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
      component: component
    });
    return this.notify(event);
  };

  Cell.prototype.remove = function(name) {
    var event;
    Cell.__super__.remove.call(this, name);
    event = new Event("component-removed", {
      component: component
    });
    return this.notify(event);
  };

  Cell.prototype.observe = function(symbol, discreteSystem) {
    return this.observers.bind(symbol, discreteSystem);
  };

  Cell.prototype.forget = function(name) {
    return this.observers.unbind(name);
  };

  return Cell;

})(Entity);

System = (function() {
  function System(flow, conf) {
    this.flow = flow;
    this.conf = conf;
    this.inlets = new NameSpace("inlets");
    this.inlets.bind([new Symbol("sysin")], []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind([new Symbol("sysout")], []);
    this.outlets.bind([new Symbol("syserr")], []);
  }

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
    if (validated_data instanceof Error) {
      return this.error(validated_data);
    } else {
      return this.process(data, inlet_name);
    }
  };

  System.prototype.process = function(data, inlet_name) {};

  System.prototype.emit = function(data, outlet_name) {
    var connection, outlet, validated_data, _i, _len, _ref, _results;
    outlet_name = outlet || "sysout";
    validated_data = this.outputValidator(data, outlet);
    if (validated_data instanceof Error) {
      this.error(validated_data);
      return;
    }
    _ref = this.outlets.objects();
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

  System.prototype.error = function(error) {
    var connection, outlet, _i, _len, _ref, _results;
    _ref = this.outlets.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === "syserr") {
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

  return System;

})();

DiscreteSystem = (function() {
  function DiscreteSystem(flow, conf) {
    this.flow = flow;
    this.conf = conf;
  }

  DiscreteSystem.prototype.raise = function(event) {};

  return DiscreteSystem;

})();

GO = (function(_super) {
  __extends(GO, _super);

  function GO(flow, conf) {
    this.flow = flow;
    this.conf = conf;
  }

  GO.prototype.show = function(data) {};

  return GO;

})(DiscreteSystem);

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

  Store.prototype.entityByID = function(uuid) {
    var entity, _i, _len, _ref;
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      if (entity.uuid === uuid) {
        return entity;
      }
    }
    return null;
  };

  Store.prototype.removeById = function(name) {
    var entity_symbol, _i, _len, _ref;
    _ref = this.entities.symbols();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity_symbol = _ref[_i];
      if (entity_symbol.object === uuid) {
        this.entities.unbind(entity_symbol.name);
      }
    }
    return null;
  };

  Store.prototype.entitiesByTags = function(tags) {
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
    this.discreteSystems = new NameSpace("systems.discrete");
  }

  Bus.prototype.add = function(symbol, discreteSystemClass, conf) {
    var discrete_sytem;
    discrete_sytem = new discreteSystemClass(this, conf);
    return this.discreteSystems.bind(symbol, discrete_sytem);
  };

  Bus.prototype.remove = function(name) {
    return this.discreteSystems.unbind(name);
  };

  Bus.prototype.trigger = function(event) {
    var obj, _i, _len, _ref, _results;
    _ref = this.discreteSystems.objects();
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

  Flow.prototype.connect = function(source, sink, wire) {
    var connection, name, outlet, symbol, _i, _len, _ref, _results;
    name = "" + source + "::" + wire.outlet + "-" + sink + "::" + wire.inlet;
    symbol = new Symbol(name);
    connection = new Connection(source, sink, this, wire);
    this.connections.bind(symbol, connection);
    _ref = connection.source.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === wire.outlet) {
        _results.push(outlet.object.push(symbol));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
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
    system = new systemClass(this, conf);
    return this.systems.bind(symbol, system);
  };

  Flow.prototype.system = function(name) {
    return this.systems.object(name);
  };

  Flow.prototype.remove = function(name) {
    return this.systems.unbind(symbol, system);
  };

  return Flow;

})();

exports.Symbol = Symbol;

exports.S = S;

exports.Token = Token;

exports.T = T;

exports.NameSpace = NameSpace;

exports.System = System;

exports.DiscreteSystem = DiscreteSystem;

exports.Wire = Wire;

exports.Connection = Connection;

exports.Event = Event;

exports.Entity = Entity;

exports.Error = Error;

exports.Bus = Bus;

exports.Flow = Flow;

exports.GO = GO;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLG9KQUFBO0VBQUE7O3VKQUFBOztBQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsV0FBUixDQUFQLENBQUE7O0FBQUE7QUFJaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLFFBQUEsR0FBVSxTQUFBLEdBQUE7QUFDUCxJQUFBLElBQUcsZUFBSDtBQUNJLGFBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLEdBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLElBQUMsQ0FBQSxJQUE3QixDQURKO0tBQUEsTUFBQTtBQUdJLGFBQU8sSUFBQyxDQUFBLElBQVIsQ0FISjtLQURPO0VBQUEsQ0FSVixDQUFBOztnQkFBQTs7SUFKSixDQUFBOztBQUFBLENBa0JBLEdBQUksU0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLEVBQWYsRUFBbUIsS0FBbkIsR0FBQTtBQUNBLFNBQVcsSUFBQSxNQUFBLENBQU8sSUFBUCxFQUFhLE1BQWIsRUFBcUIsRUFBckIsRUFBeUIsS0FB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QSxPQXlWTyxDQUFDLElBQVIsR0FBZSxJQXpWZixDQUFBOztBQUFBLE9BMFZPLENBQUMsRUFBUixHQUFhLEVBMVZiLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpXG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QpIC0+XG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBAc3ltYm9sc1tuYW1lXVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgQHN5bWJvbHNbbmFtZV0ub2JqZWN0XG5cbiAgICBzeW1ib2xzOiAobmFtZSkgLT5cbiAgICAgICBzeW1ib2xzID0gW11cblxuICAgICAgIGZvciBrLHYgaW4gQGVsZW1lbnRzXG4gICAgICAgICAgIHN5bWJvbHMucHVzaCh2KVxuXG4gICAgICAgc3ltYm9sc1xuXG4gICAgb2JqZWN0czogKG5hbWUpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IGluIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi52YWx1ZSlcblxuICAgICAgIG9iamVjdHNcblxuXG5jbGFzcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHByb3BzKSAtPlxuICAgICAgICBpZiBwcm9wcz9cbiAgICAgICAgICAgIEBwcm9wcyhwcm9wcylcblxuICAgIHByb3BzOiAoa3YpIC0+XG4gICAgICAgIGZvciBrLCB2IGluIGt2XG4gICAgICAgICAgICBAW2tdID0gdlxuXG5EID0gKHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRGF0YSgpXG5cblxuY2xhc3MgRXZlbnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBFcnJvciBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBjb250ZXh0LCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAdmFsdWUsIHByb3BzKSAgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBzdGFtcDogKHZhbHVlKSAtPlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuXG5UID0gKHZhbHVlLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKHZhbHVlLCBwcm9wcylcblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKG5hbWUpXG5cblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAdGFncywgcHJvcHMpIC0+XG4gICAgICAgIEB1dWlkID0gdXVpZC52NCgpXG4gICAgICAgIEBjb21wb25lbnRzID0gbmV3IE5hbWVTcGFjZShuYW1lICsgXCIuY29tcG9uZW50c1wiKVxuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgY29tcG9uZW50KSAtPlxuICAgICAgICBAY29tcG9uZW50cy5iaW5kKHN5bWJvbCwgY29tcG9uZW50KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMudW5iaW5kKG5hbWUpXG5cbiAgICBwYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMuc3ltYm9sKG5hbWUpXG5cblxuY2xhc3MgQ2VsbCBleHRlbmRzIEVudGl0eVxuXG4gICAgY29uc3RydWN0b3I6ICh0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIodGFncywgcHJvcHMpXG4gICAgICAgIEBvYnNlcnZlcnM9IG5ldyBOYW1lU3BhY2UobmFtZSArIFwiLm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKGNvbXBvbmVudCkgLT5cbiAgICAgICAgc3VwZXIgY29tcG9uZW50XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LWFkZGVkXCIsIHtjb21wb25lbnQ6IGNvbXBvbmVudH0pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LXJlbW92ZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50fSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIGRpc2NyZXRlU3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBkaXNjcmV0ZVN5c3RlbSlcblxuICAgIGZvcmdldDogKG5hbWUpIC0+XG4gICAgICAgIEBvYnNlcnZlcnMudW5iaW5kKG5hbWUpXG5cblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBmbG93LCBAY29uZikgLT5cbiAgICAgICAgQGlubGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJpbmxldHNcIilcbiAgICAgICAgQGlubGV0cy5iaW5kKFtuZXcgU3ltYm9sKFwic3lzaW5cIildLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQoW25ldyBTeW1ib2woXCJzeXNvdXRcIildLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKFtuZXcgU3ltYm9sKFwic3lzZXJyXCIpXSxbXSlcblxuICAgIGlucHV0VmFsaWRhdG9yOiAoZGF0YSwgaW5sZXQpIC0+XG4gICAgICAgIGNvbnNvbGUubG9nKEBzeW1ib2wubmFtZSlcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0VmFsaWRhdG9yOiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBjb25zb2xlLmxvZyhAc3ltYm9sLm5hbWUpXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGRhdGFcblxuICAgIHB1c2g6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgICAgIGlubGV0X25hbWUgPSBpbmxldF9uYW1lIHx8IFwic3lzaW5cIlxuXG4gICAgICAgIHZhbGlkYXRlZF9kYXRhID0gQGlucHV0VmFsaWRhdG9yKGRhdGEsIFwiaW5sZXRcIilcblxuICAgICAgICBpZiB2YWxpZGF0ZWRfZGF0YSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGRhdGEsIGlubGV0X25hbWVcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBvdXRsZXRfbmFtZSA9IG91dGxldCB8fCBcInN5c291dFwiXG5cbiAgICAgICAgdmFsaWRhdGVkX2RhdGEgPSBAb3V0cHV0VmFsaWRhdG9yKGRhdGEsIG91dGxldClcblxuICAgICAgICBpZiB2YWxpZGF0ZWRfZGF0YSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBmb3Igb3V0bGV0IGluIEBvdXRsZXRzLm9iamVjdHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgPT0gb3V0bGV0X25hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IChkYXRhKVxuXG4gICAgZXJyb3I6IChlcnJvcikgLT5cbiAgICAgICAgZm9yIG91dGxldCBpbiBAb3V0bGV0cy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lID09IFwic3lzZXJyXCJcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IChkYXRhKVxuXG5cbmNsYXNzIERpc2NyZXRlU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBmbG93LCBAY29uZikgLT5cblxuICAgIHJhaXNlOiAoZXZlbnQpIC0+XG5cblxuY2xhc3MgR08gZXh0ZW5kcyBEaXNjcmV0ZVN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAZmxvdywgQGNvbmYpIC0+XG4gICAgc2hvdzogKGRhdGEpIC0+XG5cblxuY2xhc3MgV2lyZVxuXG4gICAgY29uc3RydWN0b3I6IChAb3V0bGV0LCBAaW5sZXQpIC0+XG5cblxuY2xhc3MgQ29ubmVjdGlvblxuXG4gICAgY29uc3RydWN0b3I6IChzb3VyY2UsICBzaW5rLCBAZmxvdywgd2lyZSkgLT5cbiAgICAgICAgQHNvdXJjZSA9IEBmbG93LnN5c3RlbXMub2JqZWN0KHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAZmxvdy5zeXN0ZW1zLm9iamVjdChzaW5rKVxuICAgICAgICBAd2lyZSA9IHdpcmUgfHwgbmV3IFdpcmUoXCJzeXNvdXRcIiwgXCJzeXNpblwiKVxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5wdXNoKGRhdGEsIEB3aXJlLmlubGV0KVxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICB0YWdzID0gdGFncyB8fCBbXVxuICAgICAgICBlbnRpdHkgPSBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgc3ltYm9sXG5cbiAgICBlbnRpdHk6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKG5hbWUpXG5cbiAgICBlbnRpdHlCeUlEOiAodXVpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkudXVpZCBpcyB1dWlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVudGl0eVxuXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICByZW1vdmVCeUlkOiAobmFtZSkgLT5cbiAgICAgICAgZm9yIGVudGl0eV9zeW1ib2wgaW4gQGVudGl0aWVzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5X3N5bWJvbC5vYmplY3QgaXMgdXVpZFxuICAgICAgICAgICAgICAgIEBlbnRpdGllcy51bmJpbmQoZW50aXR5X3N5bWJvbC5uYW1lKVxuXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICBlbnRpdGllc0J5VGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICByZXR1cm4gZW50aXRpZXNcblxuY2xhc3MgQnVzXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGRpc2NyZXRlU3lzdGVtcyA9IG5ldyBOYW1lU3BhY2UoXCJzeXN0ZW1zLmRpc2NyZXRlXCIpXG5cbiAgICBhZGQ6IChzeW1ib2wsIGRpc2NyZXRlU3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIGRpc2NyZXRlX3N5dGVtID0gbmV3IGRpc2NyZXRlU3lzdGVtQ2xhc3ModGhpcywgY29uZilcbiAgICAgICAgQGRpc2NyZXRlU3lzdGVtcy5iaW5kKHN5bWJvbCwgZGlzY3JldGVfc3l0ZW0pXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAZGlzY3JldGVTeXN0ZW1zLnVuYmluZChuYW1lKVxuXG4gICAgdHJpZ2dlcjogKGV2ZW50KSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBkaXNjcmV0ZVN5c3RlbXMub2JqZWN0cygpXG4gICAgICAgICAgICAgICAgb2JqLnJhaXNlKGV2ZW50KVxuXG5jbGFzcyBGbG93XG5cbiAgICBjb25zdHJ1Y3RvcjogKCkgLT5cbiAgICAgICAgQGJ1cyA9IG5ldyBCdXMoKVxuICAgICAgICBAc3RvcmUgPSBuZXcgU3RvcmUoKVxuICAgICAgICBAc3lzdGVtcyA9IG5ldyBOYW1lU3BhY2UoXCJzeXN0ZW1zXCIpXG4gICAgICAgIEBjb25uZWN0aW9ucyA9IG5ldyBOYW1lU3BhY2UoXCJzeXN0ZW1zLmNvbm5lY3Rpb25zXCIpXG5cbiAgICBjb25uZWN0OiAoc291cmNlLCBzaW5rLCB3aXJlKSAtPlxuXG4gICAgICAgIG5hbWUgPSBcIiN7c291cmNlfTo6I3t3aXJlLm91dGxldH0tI3tzaW5rfTo6I3t3aXJlLmlubGV0fVwiXG4gICAgICAgIHN5bWJvbCA9IG5ldyBTeW1ib2wobmFtZSlcbiAgICAgICAgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKHNvdXJjZSwgc2luaywgdGhpcywgd2lyZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLmJpbmQoc3ltYm9sLCBjb25uZWN0aW9uKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0XG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdC5wdXNoKHN5bWJvbClcblxuICAgIGRpc2Nvbm5lY3Q6IChuYW1lKSAtPlxuICAgICAgICBjb25uZWN0aW9uID0gQGNvbm5lY3Rpb24obmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLnVuYmluZChuYW1lKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnMgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBjb25uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgY29ubi5uYW1lICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zLnB1c2goY29ubilcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0ID0gY29ubmVjdGlvbnNcblxuXG4gICAgY29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5vYmplY3QobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAc3lzdGVtcy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQHN5c3RlbXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAc3lzdGVtcy51bmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLlMgPSBTXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuVCA9IFRcbmV4cG9ydHMuTmFtZVNwYWNlID0gTmFtZVNwYWNlXG5leHBvcnRzLlN5c3RlbSA9IFN5c3RlbVxuZXhwb3J0cy5EaXNjcmV0ZVN5c3RlbSA9IERpc2NyZXRlU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLkNvbm5lY3Rpb24gPSBDb25uZWN0aW9uXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuRW50aXR5ID0gRW50aXR5XG5leHBvcnRzLkVycm9yID0gRXJyb3JcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkZsb3cgPSBGbG93XG5leHBvcnRzLkdPID0gR09cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9