var Board, Bus, C, Cell, Connection, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, mixins, start, stop, uuid, xpath,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

uuid = require("node-uuid");

clone = require("clone");

mixins = require("./mixins.js");

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

exports.mixins = mixins;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx5TEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLE1BR0EsR0FBUyxPQUFBLENBQVEsYUFBUixDQUhULENBQUE7O0FBQUEsS0FLQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBTFIsQ0FBQTs7QUFBQSxHQU1BLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQU54QixDQUFBOztBQUFBO0FBVWlCLEVBQUEsZ0JBQUUsSUFBRixFQUFTLE1BQVQsRUFBa0IsRUFBbEIsRUFBc0IsS0FBdEIsR0FBQTtBQUNULElBRFUsSUFBQyxDQUFBLE9BQUEsSUFDWCxDQUFBO0FBQUEsSUFEaUIsSUFBQyxDQUFBLFNBQUEsTUFDbEIsQ0FBQTtBQUFBLElBRDBCLElBQUMsQ0FBQSxLQUFBLEVBQzNCLENBQUE7QUFBQSxJQUFBLElBQUcsYUFBSDtBQUNJLE1BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLENBQUEsQ0FESjtLQURTO0VBQUEsQ0FBYjs7QUFBQSxtQkFJQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1IsSUFBQSxJQUFHLGVBQUg7QUFDSSxhQUFPLElBQUMsQ0FBQSxFQUFFLENBQUMsSUFBSixHQUFXLElBQUMsQ0FBQSxFQUFFLENBQUMsR0FBZixHQUFxQixJQUFDLENBQUEsSUFBN0IsQ0FESjtLQUFBLE1BQUE7QUFHSSxhQUFPLElBQUMsQ0FBQSxJQUFSLENBSEo7S0FEUTtFQUFBLENBSlgsQ0FBQTs7QUFBQSxtQkFVQSxJQUFBLEdBQU0sU0FBQyxDQUFELEVBQUksQ0FBSixHQUFBO0FBQ0YsSUFBQSxJQUFHLENBQUg7YUFDSSxJQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU8sRUFEWDtLQUFBLE1BQUE7YUFH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QUFBOztBQUFBLE9BdW9CTyxDQUFDLENBQVIsR0FBWSxDQXZvQlosQ0FBQTs7QUFBQSxPQXdvQk8sQ0FBQyxLQUFSLEdBQWdCLEtBeG9CaEIsQ0FBQTs7QUFBQSxPQXlvQk8sQ0FBQyxLQUFSLEdBQWdCLEtBem9CaEIsQ0FBQTs7QUFBQSxPQTBvQk8sQ0FBQyxJQUFSLEdBQWUsSUExb0JmLENBQUE7O0FBQUEsT0Eyb0JPLENBQUMsQ0FBUixHQUFZLENBM29CWixDQUFBOztBQUFBLE9BNG9CTyxDQUFDLElBQVIsR0FBZSxJQTVvQmYsQ0FBQTs7QUFBQSxPQTZvQk8sQ0FBQyxDQUFSLEdBQVksQ0E3b0JaLENBQUE7O0FBQUEsT0E4b0JPLENBQUMsTUFBUixHQUFpQixNQTlvQmpCLENBQUE7O0FBQUEsT0Erb0JPLENBQUMsQ0FBUixHQUFZLENBL29CWixDQUFBOztBQUFBLE9BZ3BCTyxDQUFDLElBQVIsR0FBZSxJQWhwQmYsQ0FBQTs7QUFBQSxPQWlwQk8sQ0FBQyxDQUFSLEdBQVksQ0FqcEJaLENBQUE7O0FBQUEsT0FrcEJPLENBQUMsTUFBUixHQUFpQixNQWxwQmpCLENBQUE7O0FBQUEsT0FtcEJPLENBQUMsSUFBUixHQUFlLElBbnBCZixDQUFBOztBQUFBLE9Bb3BCTyxDQUFDLFVBQVIsR0FBcUIsVUFwcEJyQixDQUFBOztBQUFBLE9BcXBCTyxDQUFDLEtBQVIsR0FBZ0IsS0FycEJoQixDQUFBOztBQUFBLE9Bc3BCTyxDQUFDLEdBQVIsR0FBYyxHQXRwQmQsQ0FBQTs7QUFBQSxPQXVwQk8sQ0FBQyxLQUFSLEdBQWdCLEtBdnBCaEIsQ0FBQTs7QUFBQSxPQXdwQk8sQ0FBQyxNQUFSLEdBQWlCLE1BeHBCakIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbInV1aWQgPSByZXF1aXJlIFwibm9kZS11dWlkXCJcbmNsb25lID0gcmVxdWlyZSBcImNsb25lXCJcblxubWl4aW5zID0gcmVxdWlyZSBcIi4vbWl4aW5zLmpzXCJcblxueHBhdGggPSByZXF1aXJlKCd4cGF0aCcpXG5kb20gPSByZXF1aXJlKCd4bWxkb20nKS5ET01QYXJzZXJcblxuY2xhc3MgU3ltYm9sXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAb2JqZWN0LCBAbnMsIGF0dHJzKSAtPlxuICAgICAgICBpZiBhdHRycz9cbiAgICAgICAgICAgIEBhdHRycyhhdHRycylcblxuICAgIGZ1bGxfbmFtZTogLT5cbiAgICAgICBpZiBAbnM/XG4gICAgICAgICAgIHJldHVybiBAbnMubmFtZSArIEBucy5zZXAgKyBAbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBAbmFtZVxuXG4gICAgYXR0cjogKGssIHYpIC0+XG4gICAgICAgIGlmIHZcbiAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBba11cblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIGF0dHJzOiAoa3YpIC0+XG4gICAgICAgIGZvciBrLCB2IGluIGt2XG4gICAgICAgICAgICBAW2tdID0gdlxuXG4gICAgaXM6IChzeW1ib2wpIC0+XG4gICAgICAgIGlmIHN5bWJvbC5uYW1lIGlzIEBuYW1lXG4gICAgICAgICAgICBpZiBzeW1ib2wub2JqZWN0IGlzIEBvYmplY3RcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgaWYgKHN5bWJvbC5vYmplY3QgaXMgbnVsbCkgYW5kIChAb2JqZWN0IGlzIG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcblxuICAgIGJpbmQ6IChzeW1ib2wsIG9iamVjdCkgLT5cbiAgICAgICAgbmFtZSA9IHN5bWJvbC5uYW1lXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSBvYmplY3RcbiAgICAgICAgb2JqZWN0LnN5bWJvbCA9IHN5bWJvbFxuICAgICAgICBAZWxlbWVudHNbbmFtZV0gPSBzeW1ib2xcbiAgICAgICAgc3ltYm9sLm5zID0gdGhpc1xuICAgICAgICBzeW1ib2xcblxuICAgIHVuYmluZDogKG5hbWUpIC0+XG4gICAgICAgIHN5bWJvbCA9IEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBkZWxldGUgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIHN5bWJvbC5ucyA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2xcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBTKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBlbGVtZW50c1tuYW1lXT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdLm9iamVjdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cblxuY2xhc3MgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChwcm9wcykgLT5cbiAgICAgICAgQF9fc2xvdHMgPSBbXVxuICAgICAgICBpZiBwcm9wcz9cbiAgICAgICAgICAgIEBwcm9wcyhwcm9wcylcblxuICAgIGlzOiAoZGF0YSkgLT5cbiAgICAgICAgYWxsX3Nsb3RzID0gQHNsb3RzKClcbiAgICAgICAgZm9yIG5hbWUgaW4gZGF0YS5zbG90cygpXG4gICAgICAgICAgICBpZiBkYXRhLnNsb3QobmFtZSkgaXMgbm90IEBzbG90KG5hbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgIHByb3BzOiAoa3YpIC0+XG4gICAgICAgIGlmIGt2XG4gICAgICAgICAgICBmb3IgaywgdiBvZiBrdlxuICAgICAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgICAgICAgICAgaWYgayBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICAgICAgQHNsb3RzKGspXG4gICAgICAgICAgICByZXR1cm4gQHZhbGlkYXRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvcGVydGllcyA9IFtdXG4gICAgICAgICAgICBmb3IgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChAW25hbWVdKVxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXNcblxuICAgIHNsb3RzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgQF9fc2xvdHMucHVzaChuYW1lKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAX19zbG90c1xuXG4gICAgc2xvdDogKG5hbWUsIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZVxuICAgICAgICAgICAgQFtuYW1lXSA9IHZhbHVlXG4gICAgICAgICAgICBpZiBuYW1lIG5vdCBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgIEBzbG90cyhuYW1lKVxuICAgICAgICAgICAgaWYgQHZhbGlkYXRlKClcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiSW52YWxpZFwiKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICAgICAgQFtuYW1lXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB2YWxpZGF0ZTogLT5cbiAgICAgICAgdHJ1ZVxuXG4gICAgX19zZXJpYWxpemVfc2NhbGFyOiAoc2NhbGFyKSAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkoc2NhbGFyKVxuICAgICAgICAgICAgdHlwZSA9IFwiYXJyYXlcIlxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPGxpc3Q+XCJcbiAgICAgICAgICAgIGZvciBlIGluIHNjYWxhclxuICAgICAgICAgICAgICAgIHhtbCArPSBAX19zZXJpYWxpemVfc2NhbGFyKGUpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2xpc3Q+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjwvc2NhbGFyPlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2Ygc2NhbGFyXG4gICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPiN7c2NhbGFyLnRvU3RyaW5nKCl9PC9zY2FsYXI+XCJcbiAgICAgICAgeG1sXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHhtbCArPSBcIjxwcm9wZXJ0eSBzbG90PScje25hbWV9Jz5cIlxuICAgICAgICAgICAgc2NhbGFyICA9IEBzbG90KG5hbWUpXG4gICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihzY2FsYXIpXG4gICAgICAgICAgICB4bWwgKz0gJzwvcHJvcGVydHk+J1xuICAgICAgICB4bWxcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEocHJvcHMpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHBvcHMudHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgICBzdXBlcihuYW1lLCBwYXlsb2FkLCBwcm9wcylcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBjb250ZXh0LCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBwcm9wcy5jb250ZW54dCA9IGNvbnRlbnh0XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5HID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgR2xpdGNoKG5hbWUsIHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHNpZ24sIHByb3BzKSAgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG4gICAgICAgIEBzaWducyA9IFtdXG4gICAgICAgIEBzdGFtcChzaWduLCB2YWx1ZSlcblxuICAgIGlzOiAodCkgLT5cbiAgICAgICAgZmFsc2VcblxuICAgIHZhbHVlOiAtPlxuICAgICAgICBAdmFsdWVcblxuICAgIHN0YW1wX2J5OiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICBpZiBAc2lnbnNbaW5kZXhdP1xuICAgICAgICAgICAgICAgcmV0dXJuIEBzaWduc1tpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICByZXR1cm4gQHNpZ25zW0BzaWducy5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIHN0YW1wOiAoc2lnbiwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlXG4gICAgICAgICAgICBpZiBAW3ZhbHVlXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBAW3ZhbHVlXVxuICAgICAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgICAgIGlmIHR5cGVvZiBAdmFsdWUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgaWYgc2lnbj9cbiAgICAgICAgICAgIEBzaWducy5wdXNoKHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbnN0YXJ0ID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdGFydFwiLCBzaWduLCBwcm9wcylcblxuc3RvcCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RvcFwiLCBzaWduLCBwcm9wcylcblxuVCA9ICh2YWx1ZSwgc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbih2YWx1ZSwgc2lnbiwgcHJvcHMpXG5cbmNsYXNzIFBhcnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCArPSBcIjxwYXJ0IG5hbWU9JyN7QG5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydD4nXG5cblAgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBQYXJ0KG5hbWUsIHByb3BzKVxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBAcGFydHMgPSBuZXcgTmFtZVNwYWNlKFwicGFydHNcIilcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5pZCA9IHByb3BzLmlkIHx8IHV1aWQudjQoKVxuICAgICAgICB0YWdzID0gdGFncyB8fCBwcm9wcy50YWdzIHx8IFtdXG4gICAgICAgIHByb3BzLnRhZ3MgPSB0YWdzXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBwYXJ0KSAtPlxuICAgICAgICBAcGFydHMuYmluZChzeW1ib2wsIHBhcnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMudW5iaW5kKG5hbWUpXG5cbiAgICBoYXNQYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLmhhcyhuYW1lKVxuXG4gICAgcGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5zeW1ib2wobmFtZSlcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCI8ZW50aXR5PlwiXG4gICAgICAgIHhtbCArPSAnPHBhcnRzPidcbiAgICAgICAgZm9yIHBhcnQgb2YgQHBhcnRzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IHBhcnQuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnRzPidcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L2VudGl0eT4nXG5cbkUgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBFbnRpdHkodGFncywgcHJvcHMpXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLnJhaXNlKGV2ZW50KVxuXG4gICAgYWRkOiAocGFydCkgLT5cbiAgICAgICAgc3VwZXIgcGFydFxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtYWRkZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3VwZXIgbmFtZVxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtcmVtb3ZlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICBvYnNlcnZlOiAoc3ltYm9sLCBzeXN0ZW0pIC0+XG4gICAgICAgIEBvYnNlcnZlcnMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGZvcmdldDogKG5hbWUpIC0+XG4gICAgICAgIEBvYnNlcnZlcnMudW5iaW5kKG5hbWUpXG5cbiAgICBzdGVwOiAoZm4sIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2xvbmU6ICgpIC0+XG4gICAgICAgIHJldHVybiBjbG9uZSh0aGlzKVxuXG5DID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgQ2VsbCh0YWdzLCBwcm9wcylcblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBiLCBAY29uZikgLT5cbiAgICAgICAgQGlubGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJpbmxldHNcIilcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNpblwiKSxbXSlcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJmZWVkYmFja1wiKSxbXSlcbiAgICAgICAgQG91dGxldHMgPSBuZXcgTmFtZVNwYWNlKFwib3V0bGV0c1wiKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNvdXRcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2VyclwiKSxbXSlcblxuICAgICAgICBAc3RhdGUgPSBbXVxuICAgICAgICBAciA9IHt9XG5cbiAgICB0b3A6IChpbmRleCkgLT5cbiAgICAgICAgaWYgaW5kZXg/XG4gICAgICAgICAgICBpZiBAc3RhdGVbaW5kZXhdP1xuICAgICAgICAgICAgICAgIHJldHVybiBAc3RhdGVbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgICAgIGlmIEBzdGF0ZS5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gQHN0YXRlW0BzdGF0ZS5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBpbnB1dDogKGRhdGEsIGlubGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBvdXRwdXQ6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGRhdGFcblxuICAgIFNUT1A6IChzdG9wX3Rva2VuKSAtPlxuXG4gICAgcHVzaDogKGRhdGEsIGlubGV0X25hbWUpIC0+XG5cbiAgICAgICAgaW5sZXRfbmFtZSA9IGlubGV0X25hbWUgfHwgXCJzeXNpblwiXG5cbiAgICAgICAgaW5wdXRfZGF0YSA9IEBpbnB1dChkYXRhLCBpbmxldF9uYW1lKVxuXG4gICAgICAgIGlmIGlucHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihpbnB1dF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBpbnB1dF9kYXRhLCBpbmxldF9uYW1lXG5cbiAgICBnb3RvX3dpdGg6IChpbmxldF9uYW1lLCBkYXRhKSAtPlxuICAgICAgICBAcHVzaChkYXRhLCBpbmxldF9uYW1lKVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0X25hbWUpIC0+XG4gICAgICAgIEBlbWl0KGRhdGEsIFwic3Rkb3V0XCIpXG5cbiAgICBzZW5kOiAoZGF0YSwgb3V0bGV0X25hbWUpIC0+XG4gICAgICAgIGZvciBvdXRsZXQgaW4gQG91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSA9PSBvdXRsZXRfbmFtZVxuICAgICAgICAgICAgICAgIGZvciBjb25uZWN0aW9uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBvdXRsZXRfbmFtZSA9IG91dGxldF9uYW1lIHx8IFwic3lzb3V0XCJcblxuICAgICAgICBvdXRwdXRfZGF0YSA9IEBvdXRwdXQoZGF0YSwgb3V0bGV0X25hbWUpXG5cbiAgICAgICAgaWYgb3V0cHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihvdXRwdXRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzZW5kKG91dHB1dF9kYXRhLCBvdXRsZXRfbmFtZSlcblxuXG4gICAgZXJyb3I6IChkYXRhKSAtPlxuICAgICAgICBAc2VuZChkYXRhLCBcInN5c2VyclwiKVxuXG4gICAgcmFpc2U6IChzaWduYWwpIC0+XG4gICAgICAgIEByZWFjdChzaWduYWwpXG5cbiAgICBpbnRlcnJ1cHQ6IChzaWduYWwpIC0+XG4gICAgICAgIEByZWFjdChzaWduYWwpXG5cbiAgICByZWFjdDogKHNpZ25hbCkgLT5cblxuICAgIHNob3c6IChkYXRhKSAtPlxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQG91dGxldCwgQGlubGV0KSAtPlxuXG5cbmNsYXNzIENvbm5lY3Rpb25cblxuICAgIGNvbnN0cnVjdG9yOiAoQHNvdXJjZSwgQHNpbmssIEBiLCBAd2lyZSkgLT5cblxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5vYmplY3QucHVzaChkYXRhLCBAd2lyZS5pbmxldC5uYW1lKVxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChlbnRpdHkpIC0+XG4gICAgICAgIHN5bWJvbCA9IFMoZW50aXR5LmlkKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgZW50aXR5XG5cbiAgICBzbmFwc2hvdDogKCkgLT5cbiAgICAgICAgeG1sID0gJzw/eG1sIHZlcnNpb24gPSBcIjEuMFwiIHN0YW5kYWxvbmU9XCJ5ZXNcIj8+J1xuICAgICAgICB4bWwgKz0gXCI8c25hcHNob3Q+XCJcbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICB4bWwgKz0gZW50aXR5LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSBcIjwvc25hcHNob3Q+XCJcbiAgICAgICAgcmV0dXJuIHhtbFxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgX19wcm9jZXNzX3NjYWxhcjogKHNjYWxhcikgLT5cbiAgICAgICAgdHlwZSA9IHNjYWxhci5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpXG4gICAgICAgIHRleHQgPSBzY2FsYXIudGV4dENvbnRlbnRcbiAgICAgICAgaWYgdHlwZSBpcyBcIm51bWJlclwiXG4gICAgICAgICAgICB2YWx1ZSA9IE51bWJlcih0ZXh0KVxuICAgICAgICBlbHNlIGlmIHR5cGUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcodGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwiYm9vbGVhblwiXG4gICAgICAgICAgICB2YWx1ZSA9IEJvb2xlYW4odGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwiYXJyYXlcIlxuICAgICAgICAgICAgbGlzdF9zY2FsYXJzID0geHBhdGguc2VsZWN0KFwibGlzdC9zY2FsYXJcIiwgc2NhbGFyKVxuICAgICAgICAgICAgdmFsdWUgPSBbXVxuICAgICAgICAgICAgZm9yIGVsIGluIGxpc3Rfc2NhbGFyc1xuICAgICAgICAgICAgICAgIGVsX3ZhbHVlID0gQF9fcHJvY2Vzc19zY2FsYXIoZWwpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChlbF92YWx1ZSlcblxuICAgICAgICByZXR1cm4gdmFsdWVcblxuICAgIF9fcHJvY2Vzc19wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXR5X3Byb3AgPSB7fVxuICAgICAgICBzbG90ID0gcHJvcC5nZXRBdHRyaWJ1dGUoXCJzbG90XCIpXG4gICAgICAgIHNjYWxhciA9IHhwYXRoLnNlbGVjdChcInNjYWxhclwiLCBwcm9wKVxuICAgICAgICB2YWx1ZSA9IEBfX3Byb2Nlc3Nfc2NhbGFyKHNjYWxhclswXSlcbiAgICAgICAgZW50aXR5X3Byb3Auc2xvdCA9IHNsb3RcbiAgICAgICAgZW50aXR5X3Byb3AudmFsdWUgPSB2YWx1ZVxuICAgICAgICBlbnRpdHlfcHJvcFxuXG4gICAgcmVjb3ZlcjogKHhtbCkgLT5cbiAgICAgICAgZG9jID0gbmV3IGRvbSgpLnBhcnNlRnJvbVN0cmluZyh4bWwpXG4gICAgICAgIGVudGl0aWVzID0geHBhdGguc2VsZWN0KFwiLy9lbnRpdHlcIiwgZG9jKVxuICAgICAgICBlbnRpdGllc19saXN0ID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc1xuICAgICAgICAgICAgZW50aXR5X3Byb3BzID0ge31cbiAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgZW50aXR5KVxuICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcCA9IEBfX3Byb2Nlc3NfcHJvcChwcm9wKVxuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wc1tlbnRpdHlfcHJvcC5zbG90XSA9IGVudGl0eV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgIG5ld19lbnRpdHkgPSBuZXcgRW50aXR5KG51bGwsIGVudGl0eV9wcm9wcylcblxuICAgICAgICAgICAgcGFydHMgPSB4cGF0aC5zZWxlY3QoXCJwYXJ0XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHBhcnRfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgcGFydClcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3AgPSBAX19wcm9jZXNzX3Byb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wc1twYXJ0X3Byb3Auc2xvdF0gPSBwYXJ0X3Byb3AudmFsdWVcbiAgICAgICAgICAgICAgICBlbnRpdHlfcGFydCA9IG5ldyBQYXJ0KG5hbWUsIHBhcnRfcHJvcHMpXG4gICAgICAgICAgICAgICAgbmV3X2VudGl0eS5hZGQoZW50aXR5X3BhcnQpXG5cbiAgICAgICAgICAgIGVudGl0aWVzX2xpc3QucHVzaChuZXdfZW50aXR5KVxuXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNfbGlzdFxuICAgICAgICAgICAgQGFkZChlbnRpdHkpXG5cbiAgICBoYXM6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLmhhcyhpZClcblxuICAgIGVudGl0eTogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KGlkKVxuXG4gICAgcmVtb3ZlOiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy51bmJpbmQoaWQpXG5cbiAgICBieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5oYXMocHJvcC5zbG90KVxuICAgICAgICAgICAgICAgIGlmIGVudGl0eS5zbG90KHByb3Auc2xvdCkgaXMgcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eSlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfcHJvcChwcm9wKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cbiAgICBieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGZvciB0YWcgaW4gdGFnc1xuICAgICAgICAgICAgICAgIGlmIHRhZyBpbiBlbnRpdHkudGFnc1xuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoIGVudGl0eVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV90YWdzKHRhZ3MpXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuY2xhc3MgQnVzIGV4dGVuZHMgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIHN1cGVyKEBuYW1lLCBzZXApXG5cbiAgICB0cmlnZ2VyOiAoc2lnbmFsKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIFN5c3RlbVxuICAgICAgICAgICAgICAgIG9iai5yYWlzZShzaWduYWwpXG5cbmNsYXNzIEJvYXJkXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIGNvbm5lY3Rpb25DbGFzcywgc3RvcmVDbGFzcywgYnVzQ2xhc3MpIC0+XG4gICAgICAgIHN0b3JlQ2xhc3MgPSBzdG9yZUNsYXNzIHx8IFN0b3JlXG4gICAgICAgIGJ1c0NsYXNzID0gYnVzQ2xhc3MgfHwgQnVzXG5cbiAgICAgICAgQGNvbm5lY3Rpb25DbGFzcyA9IGNvbm5lY3Rpb25DbGFzcyB8fCBDb25uZWN0aW9uXG4gICAgICAgIEBzdG9yZSA9IG5ldyBzdG9yZUNsYXNzKClcbiAgICAgICAgQGNvbm5lY3Rpb25zID0gbmV3IE5hbWVTcGFjZShcImJ1cy5jb25uZWN0aW9uc1wiKVxuXG4gICAgICAgIEBidXMgPSBuZXcgYnVzQ2xhc3MoXCJzeXN0ZW1zXCIpXG4gICAgICAgIEBzeXN0ZW1zID0gQGJ1c1xuICAgICAgICBAYnVzLmJpbmQoUyhcImNvbm5lY3Rpb25zXCIpLCAgQGNvbm5lY3Rpb25zKVxuICAgICAgICBAYnVzLmJpbmQoUyhcInN0b3JlXCIpLCBAc3RvcmUpXG5cbiAgICBjb25uZWN0OiAoc291cmNlLCBzaW5rLCB3aXJlLCBzeW1ib2wpIC0+XG4gICAgICAgIHNvdXJjZSA9IEBzeXN0ZW1zLnN5bWJvbChzb3VyY2UpXG4gICAgICAgIHNpbmsgPSBAc3lzdGVtcy5zeW1ib2woc2luaylcbiAgICAgICAgd2lyZSA9IHdpcmUgfHwgbmV3IFdpcmUoc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbChcInN5c291dFwiKSwgc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChcInN5c2luXCIpKVxuICAgICAgICBjb25uZWN0aW9uID0gbmV3IEBjb25uZWN0aW9uQ2xhc3Moc291cmNlLCBzaW5rLCB0aGlzLCB3aXJlKVxuICAgICAgICBpZiAhc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gXCIje3NvdXJjZX06OiN7Y29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lfS0je3Npbmt9Ojoje2Nvbm5lY3Rpb24ud2lyZS5pbmxldC5uYW1lfVwiXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy5iaW5kKHN5bWJvbCwgY29ubmVjdGlvbilcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgY29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdC5wdXNoKHN5bWJvbClcblxuICAgIHBpcGU6IChzb3VyY2UsIHdpcmUsIHNpbmspIC0+XG4gICAgICAgIEBjb25uZWN0KHNvdXJjZSwgc2luaywgd2lyZSlcblxuICAgIGRpc2Nvbm5lY3Q6IChuYW1lKSAtPlxuICAgICAgICBjb25uZWN0aW9uID0gQGNvbm5lY3Rpb24obmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLnVuYmluZChuYW1lKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyBjb25uZWN0aW9uLndpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9ucyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbnMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSBjb25uZWN0aW9uc1xuXG5cbiAgICBjb25uZWN0aW9uOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbm5lY3Rpb25zLm9iamVjdChuYW1lKVxuXG4gICAgaGFzQ29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5oYXMobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAYnVzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAYnVzLmhhcyhuYW1lKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN5c3RlbSA9IEBidXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5wdXNoKEBTVE9QKVxuICAgICAgICBAYnVzLnVuYmluZChuYW1lKVxuXG5leHBvcnRzLlN5bWJvbCA9IFN5bWJvbFxuZXhwb3J0cy5OYW1lU3BhY2UgPSBOYW1lU3BhY2VcbmV4cG9ydHMuUyA9IFNcbmV4cG9ydHMuRGF0YSA9IERhdGFcbmV4cG9ydHMuRCA9IERcbmV4cG9ydHMuU2lnbmFsID0gU2lnbmFsXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLkcgPSBHXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuc3RhcnQgPSBzdGFydFxuZXhwb3J0cy5zdG9wID0gc3RvcFxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5QYXJ0ID0gUGFydFxuZXhwb3J0cy5QID0gUFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuRSA9IEVcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuQyA9IENcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLkNvbm5lY3Rpb24gPSBDb25uZWN0aW9uXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkJvYXJkID0gQm9hcmRcbmV4cG9ydHMubWl4aW5zID0gbWl4aW5zXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==