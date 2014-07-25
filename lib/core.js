var Board, Bus, C, Cell, Connection, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, start, stop, uuid, xpath,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

uuid = require("node-uuid");

clone = require("clone");

xpath = require('xpath');

dom = require('xmldom').DOMParser;

Symbol = (function() {
  function Symbol(name, object, ns, attrs) {
    this.name = name;
    this.object = object;
    this.ns = ns;
    if (attrs != null) {
      this.attrs(attrs);
    }
  }

  Symbol.prototype.full_name = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

  Symbol.prototype.attr = function(k, v) {
    if (v) {
      return this[k] = v;
    } else {
      return this[k];
    }
  };

  Symbol.prototype.op = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return f.apply(this, args);
  };

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
    if (this.has(name)) {
      return this.elements[name];
    } else {
      return S("NotFound");
    }
  };

  NameSpace.prototype.has = function(name) {
    if (this.elements[name] != null) {
      return true;
    } else {
      return false;
    }
  };

  NameSpace.prototype.object = function(name) {
    if (this.has(name)) {
      return this.elements[name].object;
    } else {
      return G("NotFound");
    }
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
    this.__slots = [];
    if (props != null) {
      this.props(props);
    }
  }

  Data.prototype.is = function(data) {
    var all_slots, name, _i, _len, _ref;
    all_slots = this.slots();
    _ref = data.slots();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      if (data.slot(name) === !this.slot(name)) {
        return false;
      }
    }
    return true;
  };

  Data.prototype.props = function(kv) {
    var k, name, properties, v, _i, _len, _ref;
    if (kv) {
      for (k in kv) {
        v = kv[k];
        this[k] = v;
        if (__indexOf.call(this.slots(), k) < 0) {
          this.slots(k);
        }
      }
      return this.validate();
    } else {
      properties = [];
      _ref = this.slots();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        properties.push(this[name]);
      }
      return properties;
    }
  };

  Data.prototype.slots = function(name) {
    if (name) {
      return this.__slots.push(name);
    } else {
      return this.__slots;
    }
  };

  Data.prototype.slot = function(name, value) {
    if (value) {
      this[name] = value;
      if (__indexOf.call(this.slots(), name) < 0) {
        this.slots(name);
      }
      if (this.validate()) {
        return value;
      } else {
        return G("Invalid");
      }
    } else {
      if (this.has(name)) {
        return this[name];
      } else {
        return G("NotFound");
      }
    }
  };

  Data.prototype.has = function(name) {
    if (__indexOf.call(this.slots(), name) >= 0) {
      return true;
    } else {
      return false;
    }
  };

  Data.prototype.validate = function() {
    return true;
  };

  Data.prototype.__serialize_scalar = function(scalar) {
    var e, type, xml, _i, _len;
    xml = "";
    if (Array.isArray(scalar)) {
      type = "array";
      xml += "<scalar type='" + type + "'>";
      xml += "<list>";
      for (_i = 0, _len = scalar.length; _i < _len; _i++) {
        e = scalar[_i];
        xml += this.__serialize_scalar(e);
      }
      xml += "</list>";
      xml += "</scalar>";
    } else {
      type = typeof scalar;
      xml += "<scalar type='" + type + "'>" + (scalar.toString()) + "</scalar>";
    }
    return xml;
  };

  Data.prototype.serialize = function() {
    var name, scalar, xml, _i, _len, _ref;
    xml = "";
    _ref = this.slots();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      xml += "<property slot='" + name + "'>";
      scalar = this.slot(name);
      xml += this.__serialize_scalar(scalar);
      xml += '</property>';
    }
    return xml;
  };

  return Data;

})();

D = function(props) {
  return new Data(props);
};

Signal = (function(_super) {
  __extends(Signal, _super);

  function Signal(name, payload, props) {
    props = props || {};
    props.name = name;
    props.payload = payload;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    props = props || {};
    pops.ts = new Date().getTime();
    Event.__super__.constructor.call(this, name, payload, props);
  }

  return Event;

})(Signal);

Glitch = (function(_super) {
  __extends(Glitch, _super);

  function Glitch(name, context, props) {
    props = props || {};
    props.name = name;
    props.contenxt = contenxt;
    Glitch.__super__.constructor.call(this, props);
  }

  return Glitch;

})(Data);

G = function(name, props) {
  return new Glitch(name, props);
};

Token = (function(_super) {
  __extends(Token, _super);

  function Token(value, sign, props) {
    Token.__super__.constructor.call(this, props);
    this.signs = [];
    this.stamp(sign, value);
  }

  Token.prototype.is = function(t) {
    return false;
  };

  Token.prototype.value = function() {
    return this.value;
  };

  Token.prototype.stamp_by = function(index) {
    if (index != null) {
      if (this.signs[index] != null) {
        return this.signs[index];
      } else {
        return S("NotFound");
      }
    }
    if (this.signs.length > 0) {
      return this.signs[this.signs.length - 1];
    } else {
      return S("NotFound");
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

Part = (function(_super) {
  __extends(Part, _super);

  function Part(name, props) {
    this.name = name;
    Part.__super__.constructor.call(this, props);
  }

  Part.prototype.serialize = function() {
    xml += "<part name='" + this.name + "'>";
    xml += Part.__super__.serialize.call(this);
    return xml += '</part>';
  };

  return Part;

})(Data);

P = function(name, props) {
  return new Part(name, props);
};

Entity = (function(_super) {
  __extends(Entity, _super);

  function Entity(tags, props) {
    this.parts = new NameSpace("parts");
    props = props || {};
    props.id = props.id || uuid.v4();
    tags = tags || props.tags || [];
    props.tags = tags;
    Entity.__super__.constructor.call(this, props);
  }

  Entity.prototype.add = function(symbol, part) {
    return this.parts.bind(symbol, part);
  };

  Entity.prototype.remove = function(name) {
    return this.parts.unbind(name);
  };

  Entity.prototype.hasPart = function(name) {
    return this.parts.has(name);
  };

  Entity.prototype.part = function(name) {
    return this.parts.symbol(name);
  };

  Entity.prototype.serialize = function() {
    var part, xml;
    xml = "<entity>";
    xml += '<parts>';
    for (part in this.parts.objects()) {
      xml += part.serialize();
    }
    xml += '</parts>';
    xml += Entity.__super__.serialize.call(this);
    return xml += '</entity>';
  };

  return Entity;

})(Data);

E = function(tags, props) {
  return new Entity(tags, props);
};

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

  Cell.prototype.add = function(part) {
    var event;
    Cell.__super__.add.call(this, part);
    event = new Event("part-added", {
      part: part,
      cell: this
    });
    return this.notify(event);
  };

  Cell.prototype.remove = function(name) {
    var event;
    Cell.__super__.remove.call(this, name);
    event = new Event("part-removed", {
      part: part,
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

C = function(tags, props) {
  return new Cell(tags, props);
};

System = (function() {
  function System(b, conf) {
    this.b = b;
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
        return S("NotFound");
      }
    }
    if (this.state.length > 0) {
      return this.state[this.state.length - 1];
    } else {
      return S("NotFound");
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

  System.prototype.interrupt = function(signal) {
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
  function Connection(source, sink, b, wire) {
    this.source = source;
    this.sink = sink;
    this.b = b;
    this.wire = wire;
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

  Store.prototype.add = function(entity) {
    var symbol;
    symbol = S(entity.id);
    this.entities.bind(symbol, entity);
    return entity;
  };

  Store.prototype.snapshot = function() {
    var entity, xml, _i, _len, _ref;
    xml = '<?xml version = "1.0" standalone="yes"?>';
    xml += "<snapshot>";
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      xml += entity.serialize();
    }
    xml += "</snapshot>";
    return xml;
  };

  Store.prototype.op = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return f.apply(this, args);
  };

  Store.prototype.__process_scalar = function(scalar) {
    var el, el_value, list_scalars, text, type, value, _i, _len;
    type = scalar.getAttribute("type");
    text = scalar.textContent;
    if (type === "number") {
      value = Number(text);
    } else if (type === "string") {
      value = String(text);
    } else if (type === "boolean") {
      value = Boolean(text);
    } else if (type === "array") {
      list_scalars = xpath.select("list/scalar", scalar);
      value = [];
      for (_i = 0, _len = list_scalars.length; _i < _len; _i++) {
        el = list_scalars[_i];
        el_value = this.__process_scalar(el);
        value.push(el_value);
      }
    }
    return value;
  };

  Store.prototype.__process_prop = function(prop) {
    var entity_prop, scalar, slot, value;
    entity_prop = {};
    slot = prop.getAttribute("slot");
    scalar = xpath.select("scalar", prop);
    value = this.__process_scalar(scalar[0]);
    entity_prop.slot = slot;
    entity_prop.value = value;
    return entity_prop;
  };

  Store.prototype.recover = function(xml) {
    var doc, entities, entities_list, entity, entity_part, entity_prop, entity_props, name, new_entity, part, part_prop, part_props, parts, prop, props, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _results;
    doc = new dom().parseFromString(xml);
    entities = xpath.select("//entity", doc);
    entities_list = [];
    for (_i = 0, _len = entities.length; _i < _len; _i++) {
      entity = entities[_i];
      entity_props = {};
      props = xpath.select("property", entity);
      for (_j = 0, _len1 = props.length; _j < _len1; _j++) {
        prop = props[_j];
        entity_prop = this.__process_prop(prop);
        entity_props[entity_prop.slot] = entity_prop.value;
      }
      new_entity = new Entity(null, entity_props);
      parts = xpath.select("part", entity);
      for (_k = 0, _len2 = parts.length; _k < _len2; _k++) {
        part = parts[_k];
        name = part.getAttribute("name");
        part_props = {};
        props = xpath.select("property", part);
        for (_l = 0, _len3 = props.length; _l < _len3; _l++) {
          prop = props[_l];
          part_prop = this.__process_prop(prop);
          part_props[part_prop.slot] = part_prop.value;
        }
        entity_part = new Part(name, part_props);
        new_entity.add(entity_part);
      }
      entities_list.push(new_entity);
    }
    _results = [];
    for (_m = 0, _len4 = entities_list.length; _m < _len4; _m++) {
      entity = entities_list[_m];
      _results.push(this.add(entity));
    }
    return _results;
  };

  Store.prototype.has = function(id) {
    return this.entities.has(id);
  };

  Store.prototype.entity = function(id) {
    return this.entities.object(id);
  };

  Store.prototype.remove = function(id) {
    return this.entities.unbind(id);
  };

  Store.prototype.by_prop = function(prop) {
    var entities, entity, _i, _len, _ref;
    entities = [];
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      if (entity.has(prop.slot)) {
        if (entity.slot(prop.slot) === prop.value) {
          entities.push(entity);
        }
      }
    }
    if (entities.length > 0) {
      return entities;
    } else {
      return G("NotFound");
    }
  };

  Store.prototype.first_by_prop = function(prop) {
    var entities;
    entities = this.by_prop(prop);
    if (entities instanceof Glitch) {
      return entities;
    } else {
      return entities[0];
    }
  };

  Store.prototype.by_tags = function(tags) {
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
    if (entities.length > 0) {
      return entities;
    } else {
      return G("NotFound");
    }
  };

  Store.prototype.first_by_tags = function(tags) {
    var entities;
    entities = this.by_tags(tags);
    if (entities instanceof Glitch) {
      return entities;
    } else {
      return entities[0];
    }
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
      if (obj instanceof System) {
        _results.push(obj.raise(signal));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return Bus;

})(NameSpace);

Board = (function() {
  function Board(name, connectionClass, storeClass, busClass) {
    storeClass = storeClass || Store;
    busClass = busClass || Bus;
    this.connectionClass = connectionClass || Connection;
    this.store = new storeClass();
    this.connections = new NameSpace("bus.connections");
    this.bus = new busClass("systems");
    this.systems = this.bus;
    this.bus.bind(S("connections"), this.connections);
    this.bus.bind(S("store"), this.store);
  }

  Board.prototype.connect = function(source, sink, wire, symbol) {
    var connection, name, outlet, _i, _len, _ref, _results;
    source = this.systems.symbol(source);
    sink = this.systems.symbol(sink);
    wire = wire || new Wire(source.object.outlets.symbol("sysout"), sink.object.inlets.symbol("sysin"));
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

  Board.prototype.pipe = function(source, wire, sink) {
    return this.connect(source, sink, wire);
  };

  Board.prototype.disconnect = function(name) {
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

  Board.prototype.connection = function(name) {
    return this.connections.object(name);
  };

  Board.prototype.hasConnection = function(name) {
    return this.connections.has(name);
  };

  Board.prototype.add = function(symbol, systemClass, conf) {
    var system;
    system = new systemClass(this, conf);
    return this.bus.bind(symbol, system);
  };

  Board.prototype.has = function(name) {
    return this.bus.has(name);
  };

  Board.prototype.system = function(name) {
    return this.bus.object(name);
  };

  Board.prototype.remove = function(name) {
    var system;
    system = this.bus.object(name);
    system.push(this.STOP);
    return this.bus.unbind(name);
  };

  return Board;

})();

exports.Symbol = Symbol;

exports.NameSpace = NameSpace;

exports.S = S;

exports.Data = Data;

exports.D = D;

exports.Signal = Signal;

exports.Event = Event;

exports.Glitch = Glitch;

exports.G = G;

exports.Token = Token;

exports.start = start;

exports.stop = stop;

exports.T = T;

exports.Part = Part;

exports.P = P;

exports.Entity = Entity;

exports.E = E;

exports.Cell = Cell;

exports.C = C;

exports.System = System;

exports.Wire = Wire;

exports.Connection = Connection;

exports.Store = Store;

exports.Bus = Bus;

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxpTEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLEtBR0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQUhSLENBQUE7O0FBQUEsR0FJQSxHQUFNLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsU0FKeEIsQ0FBQTs7QUFBQTtBQVFpQixFQUFBLGdCQUFFLElBQUYsRUFBUyxNQUFULEVBQWtCLEVBQWxCLEVBQXNCLEtBQXRCLEdBQUE7QUFDVCxJQURVLElBQUMsQ0FBQSxPQUFBLElBQ1gsQ0FBQTtBQUFBLElBRGlCLElBQUMsQ0FBQSxTQUFBLE1BQ2xCLENBQUE7QUFBQSxJQUQwQixJQUFDLENBQUEsS0FBQSxFQUMzQixDQUFBO0FBQUEsSUFBQSxJQUFHLGFBQUg7QUFDSSxNQUFBLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBUCxDQUFBLENBREo7S0FEUztFQUFBLENBQWI7O0FBQUEsbUJBSUEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNSLElBQUEsSUFBRyxlQUFIO0FBQ0ksYUFBTyxJQUFDLENBQUEsRUFBRSxDQUFDLElBQUosR0FBVyxJQUFDLENBQUEsRUFBRSxDQUFDLEdBQWYsR0FBcUIsSUFBQyxDQUFBLElBQTdCLENBREo7S0FBQSxNQUFBO0FBR0ksYUFBTyxJQUFDLENBQUEsSUFBUixDQUhKO0tBRFE7RUFBQSxDQUpYLENBQUE7O0FBQUEsbUJBVUEsSUFBQSxHQUFNLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNGLElBQUEsSUFBRyxDQUFIO2FBQ0ksSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBRFg7S0FBQSxNQUFBO2FBR0ksSUFBRSxDQUFBLENBQUEsRUFITjtLQURFO0VBQUEsQ0FWTixDQUFB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QUE7O0FBQUEsT0Fzb0JPLENBQUMsS0FBUixHQUFnQixLQXRvQmhCLENBQUE7O0FBQUEsT0F1b0JPLENBQUMsS0FBUixHQUFnQixLQXZvQmhCLENBQUE7O0FBQUEsT0F3b0JPLENBQUMsSUFBUixHQUFlLElBeG9CZixDQUFBOztBQUFBLE9BeW9CTyxDQUFDLENBQVIsR0FBWSxDQXpvQlosQ0FBQTs7QUFBQSxPQTBvQk8sQ0FBQyxJQUFSLEdBQWUsSUExb0JmLENBQUE7O0FBQUEsT0Eyb0JPLENBQUMsQ0FBUixHQUFZLENBM29CWixDQUFBOztBQUFBLE9BNG9CTyxDQUFDLE1BQVIsR0FBaUIsTUE1b0JqQixDQUFBOztBQUFBLE9BNm9CTyxDQUFDLENBQVIsR0FBWSxDQTdvQlosQ0FBQTs7QUFBQSxPQThvQk8sQ0FBQyxJQUFSLEdBQWUsSUE5b0JmLENBQUE7O0FBQUEsT0Erb0JPLENBQUMsQ0FBUixHQUFZLENBL29CWixDQUFBOztBQUFBLE9BZ3BCTyxDQUFDLE1BQVIsR0FBaUIsTUFocEJqQixDQUFBOztBQUFBLE9BaXBCTyxDQUFDLElBQVIsR0FBZSxJQWpwQmYsQ0FBQTs7QUFBQSxPQWtwQk8sQ0FBQyxVQUFSLEdBQXFCLFVBbHBCckIsQ0FBQTs7QUFBQSxPQW1wQk8sQ0FBQyxLQUFSLEdBQWdCLEtBbnBCaEIsQ0FBQTs7QUFBQSxPQW9wQk8sQ0FBQyxHQUFSLEdBQWMsR0FwcEJkLENBQUE7O0FBQUEsT0FxcEJPLENBQUMsS0FBUixHQUFnQixLQXJwQmhCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG5cbnhwYXRoID0gcmVxdWlyZSgneHBhdGgnKVxuZG9tID0gcmVxdWlyZSgneG1sZG9tJykuRE9NUGFyc2VyXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBmdWxsX25hbWU6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuICAgIGF0dHI6IChrLCB2KSAtPlxuICAgICAgICBpZiB2XG4gICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAW2tdXG5cbiAgICBvcDogKGYsIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIGlzOiAoc3ltYm9sKSAtPlxuICAgICAgICBpZiBzeW1ib2wubmFtZSBpcyBAbmFtZVxuICAgICAgICAgICAgaWYgc3ltYm9sLm9iamVjdCBpcyBAb2JqZWN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIGlmIChzeW1ib2wub2JqZWN0IGlzIG51bGwpIGFuZCAoQG9iamVjdCBpcyBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpXG5cbiMgc2hvdWxkIGJlIGEgc2V0XG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QpIC0+XG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBAZWxlbWVudHNbbmFtZV0/XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpIGlzIG5vdCBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBpZiBrdlxuICAgICAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgICAgIGlmIGsgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgICAgIEBzbG90cyhrKVxuICAgICAgICAgICAgcmV0dXJuIEB2YWxpZGF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbXVxuICAgICAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2goQFtuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzXG5cbiAgICBzbG90czogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdmFsaWRhdGU6IC0+XG4gICAgICAgIHRydWVcblxuICAgIF9fc2VyaWFsaXplX3NjYWxhcjogKHNjYWxhcikgLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICBpZiBBcnJheS5pc0FycmF5KHNjYWxhcilcbiAgICAgICAgICAgIHR5cGUgPSBcImFycmF5XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxsaXN0PlwiXG4gICAgICAgICAgICBmb3IgZSBpbiBzY2FsYXJcbiAgICAgICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihlKVxuICAgICAgICAgICAgeG1sICs9IFwiPC9saXN0PlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8L3NjYWxhcj5cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIHNjYWxhclxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je3NjYWxhci50b1N0cmluZygpfTwvc2NhbGFyPlwiXG4gICAgICAgIHhtbFxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICB4bWwgKz0gXCI8cHJvcGVydHkgc2xvdD0nI3tuYW1lfSc+XCJcbiAgICAgICAgICAgIHNjYWxhciAgPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoc2NhbGFyKVxuICAgICAgICAgICAgeG1sICs9ICc8L3Byb3BlcnR5PidcbiAgICAgICAgeG1sXG5cbkQgPSAocHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBEYXRhKHByb3BzKVxuXG5jbGFzcyBTaWduYWwgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLm5hbWUgPSBuYW1lXG4gICAgICAgIHByb3BzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBFdmVudCBleHRlbmRzIFNpZ25hbFxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwb3BzLnRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgc3VwZXIobmFtZSwgcGF5bG9hZCwgcHJvcHMpXG5cbmNsYXNzIEdsaXRjaCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMuY29udGVueHQgPSBjb250ZW54dFxuICAgICAgICBzdXBlcihwcm9wcylcblxuRyA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEdsaXRjaChuYW1lLCBwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAc3RhbXAoc2lnbiwgdmFsdWUpXG5cbiAgICBpczogKHQpIC0+XG4gICAgICAgIGZhbHNlXG5cbiAgICB2YWx1ZTogLT5cbiAgICAgICAgQHZhbHVlXG5cbiAgICBzdGFtcF9ieTogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgaWYgQHNpZ25zW2luZGV4XT9cbiAgICAgICAgICAgICAgIHJldHVybiBAc2lnbnNbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICAgICAgaWYgQHNpZ25zLmxlbmd0aCA+IDBcbiAgICAgICAgICAgcmV0dXJuIEBzaWduc1tAc2lnbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzdGFtcDogKHNpZ24sIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZVxuICAgICAgICAgICAgaWYgQFt2YWx1ZV1cbiAgICAgICAgICAgICAgICBkZWxldGUgQFt2YWx1ZV1cbiAgICAgICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgICBpZiB0eXBlb2YgQHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICBAW0B2YWx1ZV0gPSB0cnVlXG4gICAgICAgIGlmIHNpZ24/XG4gICAgICAgICAgICBAc2lnbnMucHVzaChzaWduKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2lnbnMucHVzaChTKFwiVW5rbm93blwiKSlcblxuXG5zdGFydCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RhcnRcIiwgc2lnbiwgcHJvcHMpXG5cbnN0b3AgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0b3BcIiwgc2lnbiwgcHJvcHMpXG5cblQgPSAodmFsdWUsIHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHNpZ24sIHByb3BzKVxuXG5jbGFzcyBQYXJ0IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgKz0gXCI8cGFydCBuYW1lPScje0BuYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnQ+J1xuXG5QID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgUGFydChuYW1lLCBwcm9wcylcblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgQHBhcnRzID0gbmV3IE5hbWVTcGFjZShcInBhcnRzXCIpXG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMuaWQgPSBwcm9wcy5pZCB8fCB1dWlkLnY0KClcbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgcHJvcHMudGFncyB8fCBbXVxuICAgICAgICBwcm9wcy50YWdzID0gdGFnc1xuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgcGFydCkgLT5cbiAgICAgICAgQHBhcnRzLmJpbmQoc3ltYm9sLCBwYXJ0KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzUGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuc3ltYm9sKG5hbWUpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPGVudGl0eT5cIlxuICAgICAgICB4bWwgKz0gJzxwYXJ0cz4nXG4gICAgICAgIGZvciBwYXJ0IG9mIEBwYXJ0cy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBwYXJ0LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0cz4nXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9lbnRpdHk+J1xuXG5FID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKHBhcnQpIC0+XG4gICAgICAgIHN1cGVyIHBhcnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LWFkZGVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LXJlbW92ZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuQyA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IENlbGwodGFncywgcHJvcHMpXG5cbmNsYXNzIFN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAYiwgQGNvbmYpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG5cbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgICAgIGlubGV0X25hbWUgPSBpbmxldF9uYW1lIHx8IFwic3lzaW5cIlxuXG4gICAgICAgIGlucHV0X2RhdGEgPSBAaW5wdXQoZGF0YSwgaW5sZXRfbmFtZSlcblxuICAgICAgICBpZiBpbnB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IoaW5wdXRfZGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHByb2Nlc3MgaW5wdXRfZGF0YSwgaW5sZXRfbmFtZVxuXG4gICAgZ290b193aXRoOiAoaW5sZXRfbmFtZSwgZGF0YSkgLT5cbiAgICAgICAgQHB1c2goZGF0YSwgaW5sZXRfbmFtZSlcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuICAgICAgICBAZW1pdChkYXRhLCBcInN0ZG91dFwiKVxuXG4gICAgc2VuZDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBmb3Igb3V0bGV0IGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgPT0gb3V0bGV0X25hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVtaXQ6IChkYXRhLCBvdXRsZXRfbmFtZSkgLT5cbiAgICAgICAgb3V0bGV0X25hbWUgPSBvdXRsZXRfbmFtZSB8fCBcInN5c291dFwiXG5cbiAgICAgICAgb3V0cHV0X2RhdGEgPSBAb3V0cHV0KGRhdGEsIG91dGxldF9uYW1lKVxuXG4gICAgICAgIGlmIG91dHB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3Iob3V0cHV0X2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc2VuZChvdXRwdXRfZGF0YSwgb3V0bGV0X25hbWUpXG5cblxuICAgIGVycm9yOiAoZGF0YSkgLT5cbiAgICAgICAgQHNlbmQoZGF0YSwgXCJzeXNlcnJcIilcblxuICAgIHJhaXNlOiAoc2lnbmFsKSAtPlxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgaW50ZXJydXB0OiAoc2lnbmFsKSAtPlxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgcmVhY3Q6IChzaWduYWwpIC0+XG5cbiAgICBzaG93OiAoZGF0YSkgLT5cblxuXG5jbGFzcyBXaXJlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBvdXRsZXQsIEBpbmxldCkgLT5cblxuXG5jbGFzcyBDb25uZWN0aW9uXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBzb3VyY2UsIEBzaW5rLCBAYiwgQHdpcmUpIC0+XG5cblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQHdpcmUuaW5sZXQubmFtZSlcblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoZW50aXR5KSAtPlxuICAgICAgICBzeW1ib2wgPSBTKGVudGl0eS5pZClcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIGVudGl0eVxuXG4gICAgc25hcHNob3Q6ICgpIC0+XG4gICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgeG1sICs9IFwiPHNuYXBzaG90PlwiXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IGVudGl0eS5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L3NuYXBzaG90PlwiXG4gICAgICAgIHJldHVybiB4bWxcblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIF9fcHJvY2Vzc19zY2FsYXI6IChzY2FsYXIpIC0+XG4gICAgICAgIHR5cGUgPSBzY2FsYXIuZ2V0QXR0cmlidXRlKFwidHlwZVwiKVxuICAgICAgICB0ZXh0ID0gc2NhbGFyLnRleHRDb250ZW50XG4gICAgICAgIGlmIHR5cGUgaXMgXCJudW1iZXJcIlxuICAgICAgICAgICAgdmFsdWUgPSBOdW1iZXIodGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImJvb2xlYW5cIlxuICAgICAgICAgICAgdmFsdWUgPSBCb29sZWFuKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImFycmF5XCJcbiAgICAgICAgICAgIGxpc3Rfc2NhbGFycyA9IHhwYXRoLnNlbGVjdChcImxpc3Qvc2NhbGFyXCIsIHNjYWxhcilcbiAgICAgICAgICAgIHZhbHVlID0gW11cbiAgICAgICAgICAgIGZvciBlbCBpbiBsaXN0X3NjYWxhcnNcbiAgICAgICAgICAgICAgICBlbF92YWx1ZSA9IEBfX3Byb2Nlc3Nfc2NhbGFyKGVsKVxuICAgICAgICAgICAgICAgIHZhbHVlLnB1c2goZWxfdmFsdWUpXG5cbiAgICAgICAgcmV0dXJuIHZhbHVlXG5cbiAgICBfX3Byb2Nlc3NfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0eV9wcm9wID0ge31cbiAgICAgICAgc2xvdCA9IHByb3AuZ2V0QXR0cmlidXRlKFwic2xvdFwiKVxuICAgICAgICBzY2FsYXIgPSB4cGF0aC5zZWxlY3QoXCJzY2FsYXJcIiwgcHJvcClcbiAgICAgICAgdmFsdWUgPSBAX19wcm9jZXNzX3NjYWxhcihzY2FsYXJbMF0pXG4gICAgICAgIGVudGl0eV9wcm9wLnNsb3QgPSBzbG90XG4gICAgICAgIGVudGl0eV9wcm9wLnZhbHVlID0gdmFsdWVcbiAgICAgICAgZW50aXR5X3Byb3BcblxuICAgIHJlY292ZXI6ICh4bWwpIC0+XG4gICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICBlbnRpdGllcyA9IHhwYXRoLnNlbGVjdChcIi8vZW50aXR5XCIsIGRvYylcbiAgICAgICAgZW50aXRpZXNfbGlzdCA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNcbiAgICAgICAgICAgIGVudGl0eV9wcm9wcyA9IHt9XG4gICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3AgPSBAX19wcm9jZXNzX3Byb3AocHJvcClcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcHNbZW50aXR5X3Byb3Auc2xvdF0gPSBlbnRpdHlfcHJvcC52YWx1ZVxuXG4gICAgICAgICAgICBuZXdfZW50aXR5ID0gbmV3IEVudGl0eShudWxsLCBlbnRpdHlfcHJvcHMpXG5cbiAgICAgICAgICAgIHBhcnRzID0geHBhdGguc2VsZWN0KFwicGFydFwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcGFydCBpbiBwYXJ0c1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwYXJ0LmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIHBhcnQpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wID0gQF9fcHJvY2Vzc19wcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIHBhcnRfcHJvcHNbcGFydF9wcm9wLnNsb3RdID0gcGFydF9wcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgZW50aXR5X3BhcnQgPSBuZXcgUGFydChuYW1lLCBwYXJ0X3Byb3BzKVxuICAgICAgICAgICAgICAgIG5ld19lbnRpdHkuYWRkKGVudGl0eV9wYXJ0KVxuXG4gICAgICAgICAgICBlbnRpdGllc19saXN0LnB1c2gobmV3X2VudGl0eSlcblxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzX2xpc3RcbiAgICAgICAgICAgIEBhZGQoZW50aXR5KVxuXG4gICAgaGFzOiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy5oYXMoaWQpXG5cbiAgICBlbnRpdHk6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChpZClcblxuICAgIHJlbW92ZTogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKGlkKVxuXG4gICAgYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaGFzKHByb3Auc2xvdClcbiAgICAgICAgICAgICAgICBpZiBlbnRpdHkuc2xvdChwcm9wLnNsb3QpIGlzIHByb3AudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpXG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3Byb3AocHJvcClcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG4gICAgYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfdGFncyh0YWdzKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cbmNsYXNzIEJ1cyBleHRlbmRzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBzdXBlcihAbmFtZSwgc2VwKVxuXG4gICAgdHJpZ2dlcjogKHNpZ25hbCkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cygpXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBTeXN0ZW1cbiAgICAgICAgICAgICAgICBvYmoucmFpc2Uoc2lnbmFsKVxuXG5jbGFzcyBCb2FyZFxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBjb25uZWN0aW9uQ2xhc3MsIHN0b3JlQ2xhc3MsIGJ1c0NsYXNzKSAtPlxuICAgICAgICBzdG9yZUNsYXNzID0gc3RvcmVDbGFzcyB8fCBTdG9yZVxuICAgICAgICBidXNDbGFzcyA9IGJ1c0NsYXNzIHx8IEJ1c1xuXG4gICAgICAgIEBjb25uZWN0aW9uQ2xhc3MgPSBjb25uZWN0aW9uQ2xhc3MgfHwgQ29ubmVjdGlvblxuICAgICAgICBAc3RvcmUgPSBuZXcgc3RvcmVDbGFzcygpXG4gICAgICAgIEBjb25uZWN0aW9ucyA9IG5ldyBOYW1lU3BhY2UoXCJidXMuY29ubmVjdGlvbnNcIilcblxuICAgICAgICBAYnVzID0gbmV3IGJ1c0NsYXNzKFwic3lzdGVtc1wiKVxuICAgICAgICBAc3lzdGVtcyA9IEBidXNcbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJjb25uZWN0aW9uc1wiKSwgIEBjb25uZWN0aW9ucylcbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJzdG9yZVwiKSwgQHN0b3JlKVxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgd2lyZSwgc3ltYm9sKSAtPlxuICAgICAgICBzb3VyY2UgPSBAc3lzdGVtcy5zeW1ib2woc291cmNlKVxuICAgICAgICBzaW5rID0gQHN5c3RlbXMuc3ltYm9sKHNpbmspXG4gICAgICAgIHdpcmUgPSB3aXJlIHx8IG5ldyBXaXJlKHNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2woXCJzeXNvdXRcIiksIHNpbmsub2JqZWN0LmlubGV0cy5zeW1ib2woXCJzeXNpblwiKSlcbiAgICAgICAgY29ubmVjdGlvbiA9IG5ldyBAY29ubmVjdGlvbkNsYXNzKHNvdXJjZSwgc2luaywgdGhpcywgd2lyZSlcbiAgICAgICAgaWYgIXN5bWJvbFxuICAgICAgICAgICAgbmFtZSA9IFwiI3tzb3VyY2V9Ojoje2Nvbm5lY3Rpb24ud2lyZS5vdXRsZXQubmFtZX0tI3tzaW5rfTo6I3tjb25uZWN0aW9uLndpcmUuaW5sZXQubmFtZX1cIlxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAY29ubmVjdGlvbnMuYmluZChzeW1ib2wsIGNvbm5lY3Rpb24pXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiBjb25uZWN0aW9uLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIGNvbm5lY3Rpb24ud2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgY29ubmVjdGlvbiA9IEBjb25uZWN0aW9uKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgY29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnMgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBjb25uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgY29ubi5uYW1lICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zLnB1c2goY29ubilcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0ID0gY29ubmVjdGlvbnNcblxuXG4gICAgY29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5vYmplY3QobmFtZSlcblxuICAgIGhhc0Nvbm5lY3Rpb246IChuYW1lKSAtPlxuICAgICAgICBAY29ubmVjdGlvbnMuaGFzKG5hbWUpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHN5c3RlbUNsYXNzLCBjb25mKSAtPlxuICAgICAgICBzeXN0ZW0gPSBuZXcgc3lzdGVtQ2xhc3ModGhpcywgY29uZilcbiAgICAgICAgQGJ1cy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5oYXMobmFtZSlcblxuICAgIHN5c3RlbTogKG5hbWUpIC0+XG4gICAgICAgIEBidXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzeXN0ZW0gPSBAYnVzLm9iamVjdChuYW1lKVxuICAgICAgICBzeXN0ZW0ucHVzaChAU1RPUClcbiAgICAgICAgQGJ1cy51bmJpbmQobmFtZSlcblxuZXhwb3J0cy5TeW1ib2wgPSBTeW1ib2xcbmV4cG9ydHMuTmFtZVNwYWNlID0gTmFtZVNwYWNlXG5leHBvcnRzLlMgPSBTXG5leHBvcnRzLkRhdGEgPSBEYXRhXG5leHBvcnRzLkQgPSBEXG5leHBvcnRzLlNpZ25hbCA9IFNpZ25hbFxuZXhwb3J0cy5FdmVudCA9IEV2ZW50XG5leHBvcnRzLkdsaXRjaCA9IEdsaXRjaFxuZXhwb3J0cy5HID0gR1xuZXhwb3J0cy5Ub2tlbiA9IFRva2VuXG5leHBvcnRzLnN0YXJ0ID0gc3RhcnRcbmV4cG9ydHMuc3RvcCA9IHN0b3BcbmV4cG9ydHMuVCA9IFRcbmV4cG9ydHMuUGFydCA9IFBhcnRcbmV4cG9ydHMuUCA9IFBcbmV4cG9ydHMuRW50aXR5ID0gRW50aXR5XG5leHBvcnRzLkUgPSBFXG5leHBvcnRzLkNlbGwgPSBDZWxsXG5leHBvcnRzLkMgPSBDXG5leHBvcnRzLlN5c3RlbSA9IFN5c3RlbVxuZXhwb3J0cy5XaXJlID0gV2lyZVxuZXhwb3J0cy5Db25uZWN0aW9uID0gQ29ubmVjdGlvblxuZXhwb3J0cy5TdG9yZSA9IFN0b3JlXG5leHBvcnRzLkJ1cyA9IEJ1c1xuZXhwb3J0cy5Cb2FyZCA9IEJvYXJkXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==