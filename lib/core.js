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
    props.contenxt = context;
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

  System.prototype.push = function(data, inlet) {
    var input_data;
    inlet = inlet || this.inlets.symbol("sysin");
    input_data = this.input(data, inlet);
    if (input_data instanceof Glitch) {
      return this.error(input_data);
    } else {
      return this.process(input_data, inlet);
    }
  };

  System.prototype.goto_with = function(inlet, data) {
    return this.push(data, inlet);
  };

  System.prototype.process = function(data, inlet) {};

  System.prototype.dispatch = function(data, outlet) {
    var connection, ol, _i, _len, _ref, _results;
    _ref = this.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ol = _ref[_i];
      if (ol.name === outlet.name) {
        _results.push((function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = ol.object;
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

  System.prototype.emit = function(data, outlet) {
    var output_data;
    outlet = outlet || this.outlets.symbol("sysout");
    output_data = this.output(data, outlet);
    if (output_data instanceof Glitch) {
      this.error(output_data);
      return;
    }
    return this.dispatch(output_data, outlet);
  };

  System.prototype.error = function(data) {
    return this.dispatch(data, this.outlets.symbol("syserr"));
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
    return this.sink.object.push(data, this.wire.inlet);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxpTEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLEtBR0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQUhSLENBQUE7O0FBQUEsR0FJQSxHQUFNLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsU0FKeEIsQ0FBQTs7QUFBQTtBQVFpQixFQUFBLGdCQUFFLElBQUYsRUFBUyxNQUFULEVBQWtCLEVBQWxCLEVBQXNCLEtBQXRCLEdBQUE7QUFDVCxJQURVLElBQUMsQ0FBQSxPQUFBLElBQ1gsQ0FBQTtBQUFBLElBRGlCLElBQUMsQ0FBQSxTQUFBLE1BQ2xCLENBQUE7QUFBQSxJQUQwQixJQUFDLENBQUEsS0FBQSxFQUMzQixDQUFBO0FBQUEsSUFBQSxJQUFHLGFBQUg7QUFDSSxNQUFBLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBUCxDQUFBLENBREo7S0FEUztFQUFBLENBQWI7O0FBQUEsbUJBSUEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNSLElBQUEsSUFBRyxlQUFIO0FBQ0ksYUFBTyxJQUFDLENBQUEsRUFBRSxDQUFDLElBQUosR0FBVyxJQUFDLENBQUEsRUFBRSxDQUFDLEdBQWYsR0FBcUIsSUFBQyxDQUFBLElBQTdCLENBREo7S0FBQSxNQUFBO0FBR0ksYUFBTyxJQUFDLENBQUEsSUFBUixDQUhKO0tBRFE7RUFBQSxDQUpYLENBQUE7O0FBQUEsbUJBVUEsSUFBQSxHQUFNLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNGLElBQUEsSUFBRyxDQUFIO2FBQ0ksSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBRFg7S0FBQSxNQUFBO2FBR0ksSUFBRSxDQUFBLENBQUEsRUFITjtLQURFO0VBQUEsQ0FWTixDQUFB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TUFBUixHQUFpQixNQW5vQmpCLENBQUE7O0FBQUEsT0Fvb0JPLENBQUMsQ0FBUixHQUFZLENBcG9CWixDQUFBOztBQUFBLE9BcW9CTyxDQUFDLEtBQVIsR0FBZ0IsS0Fyb0JoQixDQUFBOztBQUFBLE9Bc29CTyxDQUFDLEtBQVIsR0FBZ0IsS0F0b0JoQixDQUFBOztBQUFBLE9BdW9CTyxDQUFDLElBQVIsR0FBZSxJQXZvQmYsQ0FBQTs7QUFBQSxPQXdvQk8sQ0FBQyxDQUFSLEdBQVksQ0F4b0JaLENBQUE7O0FBQUEsT0F5b0JPLENBQUMsSUFBUixHQUFlLElBem9CZixDQUFBOztBQUFBLE9BMG9CTyxDQUFDLENBQVIsR0FBWSxDQTFvQlosQ0FBQTs7QUFBQSxPQTJvQk8sQ0FBQyxNQUFSLEdBQWlCLE1BM29CakIsQ0FBQTs7QUFBQSxPQTRvQk8sQ0FBQyxDQUFSLEdBQVksQ0E1b0JaLENBQUE7O0FBQUEsT0E2b0JPLENBQUMsSUFBUixHQUFlLElBN29CZixDQUFBOztBQUFBLE9BOG9CTyxDQUFDLENBQVIsR0FBWSxDQTlvQlosQ0FBQTs7QUFBQSxPQStvQk8sQ0FBQyxNQUFSLEdBQWlCLE1BL29CakIsQ0FBQTs7QUFBQSxPQWdwQk8sQ0FBQyxJQUFSLEdBQWUsSUFocEJmLENBQUE7O0FBQUEsT0FpcEJPLENBQUMsVUFBUixHQUFxQixVQWpwQnJCLENBQUE7O0FBQUEsT0FrcEJPLENBQUMsS0FBUixHQUFnQixLQWxwQmhCLENBQUE7O0FBQUEsT0FtcEJPLENBQUMsR0FBUixHQUFjLEdBbnBCZCxDQUFBOztBQUFBLE9Bb3BCTyxDQUFDLEtBQVIsR0FBZ0IsS0FwcEJoQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsidXVpZCA9IHJlcXVpcmUgXCJub2RlLXV1aWRcIlxuY2xvbmUgPSByZXF1aXJlIFwiY2xvbmVcIlxuXG54cGF0aCA9IHJlcXVpcmUoJ3hwYXRoJylcbmRvbSA9IHJlcXVpcmUoJ3htbGRvbScpLkRPTVBhcnNlclxuXG5jbGFzcyBTeW1ib2xcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBvYmplY3QsIEBucywgYXR0cnMpIC0+XG4gICAgICAgIGlmIGF0dHJzP1xuICAgICAgICAgICAgQGF0dHJzKGF0dHJzKVxuXG4gICAgZnVsbF9uYW1lOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdlxuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuXG5TID0gKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKSAtPlxuICAgIHJldHVybiBuZXcgU3ltYm9sKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKVxuXG4jIHNob3VsZCBiZSBhIHNldFxuXG5jbGFzcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgQGVsZW1lbnRzID0ge31cbiAgICAgICAgQHNlcCA9IHNlcCB8fCBcIi5cIlxuXG4gICAgYmluZDogKHN5bWJvbCwgb2JqZWN0KSAtPlxuICAgICAgICBuYW1lID0gc3ltYm9sLm5hbWVcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IG9iamVjdFxuICAgICAgICBvYmplY3Quc3ltYm9sID0gc3ltYm9sXG4gICAgICAgIEBlbGVtZW50c1tuYW1lXSA9IHN5bWJvbFxuICAgICAgICBzeW1ib2wubnMgPSB0aGlzXG4gICAgICAgIHN5bWJvbFxuXG4gICAgdW5iaW5kOiAobmFtZSkgLT5cbiAgICAgICAgc3ltYm9sID0gQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIGRlbGV0ZSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgc3ltYm9sLm5zID0gdW5kZWZpbmVkXG4gICAgICAgIHN5bWJvbFxuXG4gICAgc3ltYm9sOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGVsZW1lbnRzW25hbWVdP1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvYmplY3Q6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV0ub2JqZWN0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgc3ltYm9sczogKCkgLT5cbiAgICAgICBzeW1ib2xzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIHN5bWJvbHMucHVzaCh2KVxuXG4gICAgICAgc3ltYm9sc1xuXG4gICAgb2JqZWN0czogKCkgLT5cbiAgICAgICBvYmplY3RzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIG9iamVjdHMucHVzaCh2Lm9iamVjdClcblxuICAgICAgIG9iamVjdHNcblxuXG5jbGFzcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHByb3BzKSAtPlxuICAgICAgICBAX19zbG90cyA9IFtdXG4gICAgICAgIGlmIHByb3BzP1xuICAgICAgICAgICAgQHByb3BzKHByb3BzKVxuXG4gICAgaXM6IChkYXRhKSAtPlxuICAgICAgICBhbGxfc2xvdHMgPSBAc2xvdHMoKVxuICAgICAgICBmb3IgbmFtZSBpbiBkYXRhLnNsb3RzKClcbiAgICAgICAgICAgIGlmIGRhdGEuc2xvdChuYW1lKSBpcyBub3QgQHNsb3QobmFtZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgcHJvcHM6IChrdikgLT5cbiAgICAgICAgaWYga3ZcbiAgICAgICAgICAgIGZvciBrLCB2IG9mIGt2XG4gICAgICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgICAgICAgICBpZiBrIG5vdCBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgICAgICBAc2xvdHMoaylcbiAgICAgICAgICAgIHJldHVybiBAdmFsaWRhdGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0gW11cbiAgICAgICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKEBbbmFtZV0pXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydGllc1xuXG4gICAgc2xvdHM6IChuYW1lKSAtPlxuICAgICAgICBpZiBuYW1lXG4gICAgICAgICAgICBAX19zbG90cy5wdXNoKG5hbWUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBfX3Nsb3RzXG5cbiAgICBzbG90OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlXG4gICAgICAgICAgICBAW25hbWVdID0gdmFsdWVcbiAgICAgICAgICAgIGlmIG5hbWUgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgQHNsb3RzKG5hbWUpXG4gICAgICAgICAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEcoXCJJbnZhbGlkXCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgICAgICBAW25hbWVdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIHZhbGlkYXRlOiAtPlxuICAgICAgICB0cnVlXG5cbiAgICBfX3NlcmlhbGl6ZV9zY2FsYXI6IChzY2FsYXIpIC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheShzY2FsYXIpXG4gICAgICAgICAgICB0eXBlID0gXCJhcnJheVwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8bGlzdD5cIlxuICAgICAgICAgICAgZm9yIGUgaW4gc2NhbGFyXG4gICAgICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoZSlcbiAgICAgICAgICAgIHhtbCArPSBcIjwvbGlzdD5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPC9zY2FsYXI+XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiBzY2FsYXJcbiAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+I3tzY2FsYXIudG9TdHJpbmcoKX08L3NjYWxhcj5cIlxuICAgICAgICB4bWxcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICBmb3IgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgeG1sICs9IFwiPHByb3BlcnR5IHNsb3Q9JyN7bmFtZX0nPlwiXG4gICAgICAgICAgICBzY2FsYXIgID0gQHNsb3QobmFtZSlcbiAgICAgICAgICAgIHhtbCArPSBAX19zZXJpYWxpemVfc2NhbGFyKHNjYWxhcilcbiAgICAgICAgICAgIHhtbCArPSAnPC9wcm9wZXJ0eT4nXG4gICAgICAgIHhtbFxuXG5EID0gKHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRGF0YShwcm9wcylcblxuY2xhc3MgU2lnbmFsIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBwcm9wcy5wYXlsb2FkID0gcGF5bG9hZFxuICAgICAgICBzdXBlcihwcm9wcylcblxuY2xhc3MgRXZlbnQgZXh0ZW5kcyBTaWduYWxcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcG9wcy50cyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gICAgICAgIHN1cGVyKG5hbWUsIHBheWxvYWQsIHByb3BzKVxuXG5jbGFzcyBHbGl0Y2ggZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIGNvbnRleHQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLm5hbWUgPSBuYW1lXG4gICAgICAgIHByb3BzLmNvbnRlbnh0ID0gY29udGV4dFxuICAgICAgICBzdXBlcihwcm9wcylcblxuRyA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEdsaXRjaChuYW1lLCBwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAc3RhbXAoc2lnbiwgdmFsdWUpXG5cbiAgICBpczogKHQpIC0+XG4gICAgICAgIGZhbHNlXG5cbiAgICB2YWx1ZTogLT5cbiAgICAgICAgQHZhbHVlXG5cbiAgICBzdGFtcF9ieTogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgaWYgQHNpZ25zW2luZGV4XT9cbiAgICAgICAgICAgICAgIHJldHVybiBAc2lnbnNbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICAgICAgaWYgQHNpZ25zLmxlbmd0aCA+IDBcbiAgICAgICAgICAgcmV0dXJuIEBzaWduc1tAc2lnbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzdGFtcDogKHNpZ24sIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZVxuICAgICAgICAgICAgaWYgQFt2YWx1ZV1cbiAgICAgICAgICAgICAgICBkZWxldGUgQFt2YWx1ZV1cbiAgICAgICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgICBpZiB0eXBlb2YgQHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICBAW0B2YWx1ZV0gPSB0cnVlXG4gICAgICAgIGlmIHNpZ24/XG4gICAgICAgICAgICBAc2lnbnMucHVzaChzaWduKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2lnbnMucHVzaChTKFwiVW5rbm93blwiKSlcblxuXG5zdGFydCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RhcnRcIiwgc2lnbiwgcHJvcHMpXG5cbnN0b3AgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0b3BcIiwgc2lnbiwgcHJvcHMpXG5cblQgPSAodmFsdWUsIHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHNpZ24sIHByb3BzKVxuXG5jbGFzcyBQYXJ0IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgKz0gXCI8cGFydCBuYW1lPScje0BuYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnQ+J1xuXG5QID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgUGFydChuYW1lLCBwcm9wcylcblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgQHBhcnRzID0gbmV3IE5hbWVTcGFjZShcInBhcnRzXCIpXG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMuaWQgPSBwcm9wcy5pZCB8fCB1dWlkLnY0KClcbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgcHJvcHMudGFncyB8fCBbXVxuICAgICAgICBwcm9wcy50YWdzID0gdGFnc1xuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgcGFydCkgLT5cbiAgICAgICAgQHBhcnRzLmJpbmQoc3ltYm9sLCBwYXJ0KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzUGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuc3ltYm9sKG5hbWUpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPGVudGl0eT5cIlxuICAgICAgICB4bWwgKz0gJzxwYXJ0cz4nXG4gICAgICAgIGZvciBwYXJ0IG9mIEBwYXJ0cy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBwYXJ0LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0cz4nXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9lbnRpdHk+J1xuXG5FID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKHBhcnQpIC0+XG4gICAgICAgIHN1cGVyIHBhcnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LWFkZGVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LXJlbW92ZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuQyA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IENlbGwodGFncywgcHJvcHMpXG5cbmNsYXNzIFN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAYiwgQGNvbmYpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG5cbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldCkgLT5cblxuICAgICAgICBpbmxldCA9IGlubGV0IHx8IEBpbmxldHMuc3ltYm9sKFwic3lzaW5cIilcblxuICAgICAgICBpbnB1dF9kYXRhID0gQGlucHV0KGRhdGEsIGlubGV0KVxuXG4gICAgICAgIGlmIGlucHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihpbnB1dF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBpbnB1dF9kYXRhLCBpbmxldFxuXG4gICAgZ290b193aXRoOiAoaW5sZXQsIGRhdGEpIC0+XG4gICAgICAgIEBwdXNoKGRhdGEsIGlubGV0KVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0KSAtPlxuXG4gICAgZGlzcGF0Y2g6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGZvciBvbCBpbiBAb3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG9sLm5hbWUgPT0gb3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvbC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IEBvdXRsZXRzLnN5bWJvbChcInN5c291dFwiKVxuXG4gICAgICAgIG91dHB1dF9kYXRhID0gQG91dHB1dChkYXRhLCBvdXRsZXQpXG5cbiAgICAgICAgaWYgb3V0cHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihvdXRwdXRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBkaXNwYXRjaChvdXRwdXRfZGF0YSwgb3V0bGV0KVxuXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBkaXNwYXRjaChkYXRhLCBAb3V0bGV0cy5zeW1ib2woXCJzeXNlcnJcIikpXG5cbiAgICByYWlzZTogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIGludGVycnVwdDogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIHJlYWN0OiAoc2lnbmFsKSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cblxuY2xhc3MgV2lyZVxuXG4gICAgY29uc3RydWN0b3I6IChAb3V0bGV0LCBAaW5sZXQpIC0+XG5cblxuY2xhc3MgQ29ubmVjdGlvblxuXG4gICAgY29uc3RydWN0b3I6IChAc291cmNlLCBAc2luaywgQGIsIEB3aXJlKSAtPlxuXG5cbiAgICB0cmFuc21pdDogKGRhdGEpIC0+XG4gICAgICAgIEBzaW5rLm9iamVjdC5wdXNoKGRhdGEsIEB3aXJlLmlubGV0KVxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChlbnRpdHkpIC0+XG4gICAgICAgIHN5bWJvbCA9IFMoZW50aXR5LmlkKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgZW50aXR5XG5cbiAgICBzbmFwc2hvdDogKCkgLT5cbiAgICAgICAgeG1sID0gJzw/eG1sIHZlcnNpb24gPSBcIjEuMFwiIHN0YW5kYWxvbmU9XCJ5ZXNcIj8+J1xuICAgICAgICB4bWwgKz0gXCI8c25hcHNob3Q+XCJcbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICB4bWwgKz0gZW50aXR5LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSBcIjwvc25hcHNob3Q+XCJcbiAgICAgICAgcmV0dXJuIHhtbFxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgX19wcm9jZXNzX3NjYWxhcjogKHNjYWxhcikgLT5cbiAgICAgICAgdHlwZSA9IHNjYWxhci5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpXG4gICAgICAgIHRleHQgPSBzY2FsYXIudGV4dENvbnRlbnRcbiAgICAgICAgaWYgdHlwZSBpcyBcIm51bWJlclwiXG4gICAgICAgICAgICB2YWx1ZSA9IE51bWJlcih0ZXh0KVxuICAgICAgICBlbHNlIGlmIHR5cGUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcodGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwiYm9vbGVhblwiXG4gICAgICAgICAgICB2YWx1ZSA9IEJvb2xlYW4odGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwiYXJyYXlcIlxuICAgICAgICAgICAgbGlzdF9zY2FsYXJzID0geHBhdGguc2VsZWN0KFwibGlzdC9zY2FsYXJcIiwgc2NhbGFyKVxuICAgICAgICAgICAgdmFsdWUgPSBbXVxuICAgICAgICAgICAgZm9yIGVsIGluIGxpc3Rfc2NhbGFyc1xuICAgICAgICAgICAgICAgIGVsX3ZhbHVlID0gQF9fcHJvY2Vzc19zY2FsYXIoZWwpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChlbF92YWx1ZSlcblxuICAgICAgICByZXR1cm4gdmFsdWVcblxuICAgIF9fcHJvY2Vzc19wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXR5X3Byb3AgPSB7fVxuICAgICAgICBzbG90ID0gcHJvcC5nZXRBdHRyaWJ1dGUoXCJzbG90XCIpXG4gICAgICAgIHNjYWxhciA9IHhwYXRoLnNlbGVjdChcInNjYWxhclwiLCBwcm9wKVxuICAgICAgICB2YWx1ZSA9IEBfX3Byb2Nlc3Nfc2NhbGFyKHNjYWxhclswXSlcbiAgICAgICAgZW50aXR5X3Byb3Auc2xvdCA9IHNsb3RcbiAgICAgICAgZW50aXR5X3Byb3AudmFsdWUgPSB2YWx1ZVxuICAgICAgICBlbnRpdHlfcHJvcFxuXG4gICAgcmVjb3ZlcjogKHhtbCkgLT5cbiAgICAgICAgZG9jID0gbmV3IGRvbSgpLnBhcnNlRnJvbVN0cmluZyh4bWwpXG4gICAgICAgIGVudGl0aWVzID0geHBhdGguc2VsZWN0KFwiLy9lbnRpdHlcIiwgZG9jKVxuICAgICAgICBlbnRpdGllc19saXN0ID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc1xuICAgICAgICAgICAgZW50aXR5X3Byb3BzID0ge31cbiAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgZW50aXR5KVxuICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcCA9IEBfX3Byb2Nlc3NfcHJvcChwcm9wKVxuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wc1tlbnRpdHlfcHJvcC5zbG90XSA9IGVudGl0eV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgIG5ld19lbnRpdHkgPSBuZXcgRW50aXR5KG51bGwsIGVudGl0eV9wcm9wcylcblxuICAgICAgICAgICAgcGFydHMgPSB4cGF0aC5zZWxlY3QoXCJwYXJ0XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHBhcnRfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgcGFydClcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3AgPSBAX19wcm9jZXNzX3Byb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wc1twYXJ0X3Byb3Auc2xvdF0gPSBwYXJ0X3Byb3AudmFsdWVcbiAgICAgICAgICAgICAgICBlbnRpdHlfcGFydCA9IG5ldyBQYXJ0KG5hbWUsIHBhcnRfcHJvcHMpXG4gICAgICAgICAgICAgICAgbmV3X2VudGl0eS5hZGQoZW50aXR5X3BhcnQpXG5cbiAgICAgICAgICAgIGVudGl0aWVzX2xpc3QucHVzaChuZXdfZW50aXR5KVxuXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNfbGlzdFxuICAgICAgICAgICAgQGFkZChlbnRpdHkpXG5cbiAgICBoYXM6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLmhhcyhpZClcblxuICAgIGVudGl0eTogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KGlkKVxuXG4gICAgcmVtb3ZlOiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy51bmJpbmQoaWQpXG5cbiAgICBieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5oYXMocHJvcC5zbG90KVxuICAgICAgICAgICAgICAgIGlmIGVudGl0eS5zbG90KHByb3Auc2xvdCkgaXMgcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eSlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfcHJvcChwcm9wKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cbiAgICBieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGZvciB0YWcgaW4gdGFnc1xuICAgICAgICAgICAgICAgIGlmIHRhZyBpbiBlbnRpdHkudGFnc1xuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoIGVudGl0eVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV90YWdzKHRhZ3MpXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuY2xhc3MgQnVzIGV4dGVuZHMgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIHN1cGVyKEBuYW1lLCBzZXApXG5cbiAgICB0cmlnZ2VyOiAoc2lnbmFsKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIFN5c3RlbVxuICAgICAgICAgICAgICAgIG9iai5yYWlzZShzaWduYWwpXG5cbmNsYXNzIEJvYXJkXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIGNvbm5lY3Rpb25DbGFzcywgc3RvcmVDbGFzcywgYnVzQ2xhc3MpIC0+XG4gICAgICAgIHN0b3JlQ2xhc3MgPSBzdG9yZUNsYXNzIHx8IFN0b3JlXG4gICAgICAgIGJ1c0NsYXNzID0gYnVzQ2xhc3MgfHwgQnVzXG5cbiAgICAgICAgQGNvbm5lY3Rpb25DbGFzcyA9IGNvbm5lY3Rpb25DbGFzcyB8fCBDb25uZWN0aW9uXG4gICAgICAgIEBzdG9yZSA9IG5ldyBzdG9yZUNsYXNzKClcbiAgICAgICAgQGNvbm5lY3Rpb25zID0gbmV3IE5hbWVTcGFjZShcImJ1cy5jb25uZWN0aW9uc1wiKVxuXG4gICAgICAgIEBidXMgPSBuZXcgYnVzQ2xhc3MoXCJzeXN0ZW1zXCIpXG4gICAgICAgIEBzeXN0ZW1zID0gQGJ1c1xuICAgICAgICBAYnVzLmJpbmQoUyhcImNvbm5lY3Rpb25zXCIpLCAgQGNvbm5lY3Rpb25zKVxuICAgICAgICBAYnVzLmJpbmQoUyhcInN0b3JlXCIpLCBAc3RvcmUpXG5cbiAgICBjb25uZWN0OiAoc291cmNlLCBzaW5rLCB3aXJlLCBzeW1ib2wpIC0+XG4gICAgICAgIHNvdXJjZSA9IEBzeXN0ZW1zLnN5bWJvbChzb3VyY2UpXG4gICAgICAgIHNpbmsgPSBAc3lzdGVtcy5zeW1ib2woc2luaylcbiAgICAgICAgd2lyZSA9IHdpcmUgfHwgbmV3IFdpcmUoc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbChcInN5c291dFwiKSwgc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChcInN5c2luXCIpKVxuICAgICAgICBjb25uZWN0aW9uID0gbmV3IEBjb25uZWN0aW9uQ2xhc3Moc291cmNlLCBzaW5rLCB0aGlzLCB3aXJlKVxuICAgICAgICBpZiAhc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gXCIje3NvdXJjZX06OiN7Y29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lfS0je3Npbmt9Ojoje2Nvbm5lY3Rpb24ud2lyZS5pbmxldC5uYW1lfVwiXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy5iaW5kKHN5bWJvbCwgY29ubmVjdGlvbilcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgY29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdC5wdXNoKHN5bWJvbClcblxuICAgIHBpcGU6IChzb3VyY2UsIHdpcmUsIHNpbmspIC0+XG4gICAgICAgIEBjb25uZWN0KHNvdXJjZSwgc2luaywgd2lyZSlcblxuICAgIGRpc2Nvbm5lY3Q6IChuYW1lKSAtPlxuICAgICAgICBjb25uZWN0aW9uID0gQGNvbm5lY3Rpb24obmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLnVuYmluZChuYW1lKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyBjb25uZWN0aW9uLndpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9ucyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbnMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSBjb25uZWN0aW9uc1xuXG5cbiAgICBjb25uZWN0aW9uOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbm5lY3Rpb25zLm9iamVjdChuYW1lKVxuXG4gICAgaGFzQ29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5oYXMobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAYnVzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAYnVzLmhhcyhuYW1lKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN5c3RlbSA9IEBidXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5wdXNoKEBTVE9QKVxuICAgICAgICBAYnVzLnVuYmluZChuYW1lKVxuXG5leHBvcnRzLlN5bWJvbCA9IFN5bWJvbFxuZXhwb3J0cy5OYW1lU3BhY2UgPSBOYW1lU3BhY2VcbmV4cG9ydHMuUyA9IFNcbmV4cG9ydHMuRGF0YSA9IERhdGFcbmV4cG9ydHMuRCA9IERcbmV4cG9ydHMuU2lnbmFsID0gU2lnbmFsXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLkcgPSBHXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuc3RhcnQgPSBzdGFydFxuZXhwb3J0cy5zdG9wID0gc3RvcFxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5QYXJ0ID0gUGFydFxuZXhwb3J0cy5QID0gUFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuRSA9IEVcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuQyA9IENcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLkNvbm5lY3Rpb24gPSBDb25uZWN0aW9uXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkJvYXJkID0gQm9hcmRcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9