var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, Mirror, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, dom2prop, lodash, start, stop, uuid, xpath,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

uuid = require("node-uuid");

lodash = require("lodash");

clone = require("clone");

xpath = require("xpath");

dom = require("xmldom").DOMParser;

dom2prop = require("./helpers").dom2prop;

Symbol = (function() {
  function Symbol(name, object, ns, attrs) {
    this.name = name;
    this.object = object;
    this.ns = ns;
    if (attrs != null) {
      this.attrs(attrs);
    }
  }

  Symbol.prototype.attr = function(k, v) {
    if (v != null) {
      this[k] = v;
      return this[k];
    } else {
      return this[k];
    }
  };

  Symbol.prototype.op = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return f.apply(this, args);
  };

  Symbol.prototype.has = function(k) {
    if (this[k] != null) {
      return true;
    } else {
      return false;
    }
  };

  Symbol.prototype.del = function(k) {
    if (this.has(k)) {
      return delete this[k];
    }
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
    this.__gensym = 0;
  }

  NameSpace.prototype.bind = function(symbol, object, class_name) {
    var name;
    symbol["class"] = class_name || object.constructor.name;
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
    symbol.object = void 0;
    return symbol["class"] = void 0;
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

  NameSpace.prototype.gensym = function(prefix) {
    prefix = prefix || "gensym";
    return prefix + ":" + (this.__gensym++);
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
      if (data.slot(name) !== this.slot(name)) {
        return false;
      }
    }
    return true;
  };

  Data.prototype.prop = function(k, v) {
    return this.slot(k, v);
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
    if (name != null) {
      return this.__slots.push(name);
    } else {
      return this.__slots;
    }
  };

  Data.prototype.slot = function(name, value) {
    if (value != null) {
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

  Data.prototype.del = function(name) {
    var n, slots_old, _i, _len;
    if (this.has(name)) {
      slots_old = this.__slots;
      this.__slots = [];
      for (_i = 0, _len = slots_old.length; _i < _len; _i++) {
        n = slots_old[_i];
        if (n !== name) {
          this.__slots.push(n);
        }
      }
      return delete this[name];
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
      if (type === "boolean" || type === "number" || type === "string" || type === "Symbol") {
        xml += "<scalar type='" + type + "'>" + (scalar.toString()) + "</scalar>";
      }
    }
    return xml;
  };

  Data.prototype.init = function(xml) {
    var data_prop, doc, prop, props, _i, _len, _results;
    doc = new dom().parseFromString(xml);
    props = xpath.select("property", doc);
    _results = [];
    for (_i = 0, _len = props.length; _i < _len; _i++) {
      prop = props[_i];
      data_prop = dom2prop(prop);
      _results.push(this.prop(data_prop.slot, data_prop.value));
    }
    return _results;
  };

  Data.prototype.serialize = function(to) {
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

  Data.prototype.toString = function() {};

  return Data;

})();

D = function(props) {
  return new Data(props);
};

Signal = (function(_super) {
  __extends(Signal, _super);

  function Signal(route, payload, props) {
    props = props || {};
    props.route = route;
    props.payload = payload;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(route, payload, props) {
    props = props || {};
    pops.ts = new Date().getTime();
    Event.__super__.constructor.call(this, route, payload, props);
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
    this.values = [];
    if (value != null) {
      this.stamp(sign, value);
    }
  }

  Token.prototype.is = function(t) {
    return false;
  };

  Token.prototype.value = function() {
    return this.prop("value");
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
    var old_value;
    if (value != null) {
      if (this.has("value")) {
        old_value = this.prop("value");
        this.del("value");
        this.del(value);
      }
      this.prop("value", value);
      if (typeof value === "string") {
        this.prop(value, true);
      }
      this.values.push(value);
    }
    if (sign) {
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

  Part.prototype.serialize = function(to) {
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
    props.ts = props.ts || new Date().getTime();
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

  Entity.prototype.serialize = function(to) {
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
      _results.push(ob.interrupt(event));
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
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
    this.outlets.bind(new Symbol("debug"), []);
    this.conf = conf || D();
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
    this.b.mirror.relay("push", this.symbol.name, data, inlet);
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
    var ol, wire, _i, _len, _ref, _results;
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
            wire = _ref1[_j];
            _results1.push(wire.object.transmit(data));
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

  System.prototype.debug = function(data) {
    return this.dispatch(data, this.outlets.symbol("debug"));
  };

  System.prototype.error = function(data) {
    return this.dispatch(data, this.outlets.symbol("syserr"));
  };

  System.prototype.interrupt = function(signal) {
    this.b.mirror.relay("interrupt", this.symbol.name, signal);
    return this.react(signal);
  };

  System.prototype.react = function(signal) {};

  System.prototype.show = function(data) {};

  System.prototype.serialize = function(to) {
    var xml;
    xml = "<system name='" + this.symbol.name + "' class='" + this.symbol["class"] + "'>";
    xml += "<configuration>";
    xml += this.conf.serialize();
    xml += "</configuration>";
    xml += "</system>";
    return xml;
  };

  return System;

})();

Wire = (function() {
  function Wire(b, source, sink, outlet, inlet) {
    this.b = b;
    outlet = outlet || "sysout";
    inlet = inlet || "sysin";
    this.source = this.b.systems.symbol(source);
    this.sink = this.b.systems.symbol(sink);
    this.outlet = this.source.object.outlets.symbol(outlet);
    this.inlet = this.sink.object.inlets.symbol(inlet);
  }

  Wire.prototype.transmit = function(data) {
    return this.sink.object.push(data, this.inlet);
  };

  Wire.prototype.serialize = function() {
    var xml;
    xml = "";
    xml += "<wire name='" + this.symbol.name + "'>";
    xml += "<source name='" + this.source.name + "'/>";
    xml += "<outlet name='" + this.outlet.name + "'/>";
    xml += "<sink name='" + this.sink.name + "'/>";
    xml += "<inlet name='" + this.inlet.name + "'/>";
    xml += "</wire>";
    return xml;
  };

  return Wire;

})();

Store = (function() {
  function Store() {
    this.entities = new NameSpace("entities");
  }

  Store.prototype.add = function(entity, symbol) {
    var name;
    if (!symbol) {
      name = this.entities.gensym("entity");
      symbol = new Symbol(name);
    }
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
        entity_prop = dom2prop(prop);
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
          part_prop = dom2prop(prop);
          part_props[part_prop.slot] = part_prop.value;
        }
        entity_part = new Part(name, part_props);
        new_entity.add(entity_part);
      }
      entities_list.push(new_entity);
    }
    this.entities = new NameSpace("entities");
    _results = [];
    for (_m = 0, _len4 = entities_list.length; _m < _len4; _m++) {
      entity = entities_list[_m];
      _results.push(this.add(entity));
    }
    return _results;
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

  Store.prototype.by_prop = function(prop) {
    var entities, entity, entity_value, _i, _len, _ref, _ref1;
    entities = [];
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      if (entity.has(prop.slot)) {
        entity_value = entity.slot(prop.slot);
        if (Array.isArray(entity_value)) {
          if (_ref1 = prop.value, __indexOf.call(entity_value, _ref1) >= 0) {
            entities.push(entity);
          }
        } else if (entity_value === prop.value) {
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

  Bus.prototype.trigger = function(signal, broadcast) {
    var interrupts, sym, _i, _j, _len, _len1, _ref, _ref1;
    broadcast = broadcast || false;
    interrupts = 0;
    if (broadcast === false) {
      _ref = this.symbols();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sym = _ref[_i];
        if (sym.object instanceof System) {
          if (sym.has("route")) {
            if (sym.attr("route") === signal.route) {
              sym.object.interrupt(signal);
              interrupts++;
            }
          }
        }
      }
    }
    if ((interrupts === 0) || (broadcast === true)) {
      _ref1 = this.symbols();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        sym = _ref1[_j];
        if (sym.object instanceof System) {
          sym.object.interrupt(signal);
          interrupts++;
        }
      }
    }
    return interrupts;
  };

  return Bus;

})(NameSpace);

Mirror = (function() {
  function Mirror(b) {
    this.b = b;
  }

  Mirror.prototype.reflect = function() {
    var args, op, sys, system;
    op = arguments[0], system = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    sys = this.b.systems.object(system);
    return sys[op].apply(sys, args);
  };

  Mirror.prototype.relay = function() {
    var args, op, system;
    op = arguments[0], system = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  };

  return Mirror;

})();

Board = (function() {
  function Board(wireClass, busClass, storeClass, mirrorClass) {
    this.wireClass = wireClass || Wire;
    this.busClass = busClass || Bus;
    this.storeClass = storeClass || Store;
    this.mirrorClass = mirrorClass || Mirror;
    this.init();
  }

  Board.prototype.init = function() {
    this.bus = new this.busClass("bus");
    this.store = new this.storeClass();
    this.mirror = new this.mirrorClass(this);
    this.systems = this.bus;
    this.wires = new NameSpace("wires");
    this.bus.bind(S("store"), this.store);
    return this.bus.bind(S("wires"), this.wires);
  };

  Board.prototype.setup = function(xml, clone) {
    var board, board_name, board_new, bus_class, conf_node, conn, data_prop, data_props, doc, inlet_name, klass, name, outlet_name, prop, props, sink_name, source_name, store_class, sys, syss, wire, wire_class, wires, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
    if (xml != null) {
      doc = new dom().parseFromString(xml);
      board = xpath.select("board", doc)[0];
      board_name = board.getAttribute("name");
      bus_class = xpath.select("Bus", board)[0].getAttribute("class");
      store_class = xpath.select("Store", board)[0].getAttribute("class");
      wire_class = xpath.select("Wire", board)[0].getAttribute("class");
      if (clone != null) {
        board_new = new Board(board_name, global[wire_class], global[bus_class], global[store_class]);
      } else {
        board_new = this;
        board_new.init();
      }
      syss = xpath.select("system", board);
      for (_i = 0, _len = syss.length; _i < _len; _i++) {
        sys = syss[_i];
        name = sys.getAttribute("name");
        klass = sys.getAttribute("class");
        conf_node = xpath.select("configuration", sys)[0];
        data_props = {};
        props = xpath.select("//property", conf_node);
        for (_j = 0, _len1 = props.length; _j < _len1; _j++) {
          prop = props[_j];
          data_prop = dom2prop(prop);
          data_props[data_prop.slot] = data_prop.value;
        }
        board_new.add(S(name), global[klass], D(data_props));
      }
      wires = xpath.select("//wire", board);
      for (_k = 0, _len2 = wires.length; _k < _len2; _k++) {
        wire = wires[_k];
        source_name = xpath.select("source", wire)[0].getAttribute("name");
        outlet_name = xpath.select("outlet", wire)[0].getAttribute("name");
        sink_name = xpath.select("sink", wire)[0].getAttribute("name");
        inlet_name = xpath.select("inlet", wire)[0].getAttribute("name");
        board_new.connect(source_name, sink_name, outlet_name, inlet_name);
      }
      return board_new;
    } else {
      xml = '<?xml version = "1.0" standalone="yes"?>';
      if (this.symbol != null) {
        board_name = this.symbol.name;
      } else {
        board_name = "b";
      }
      xml += "<board name='" + board_name + "'>";
      xml += "<Bus class='" + this.bus.constructor.name + "'/>";
      xml += "<Store class='" + this.store.constructor.name + "'/>";
      xml += "<Wire class='" + this.wireClass.name + "'/>";
      _ref = this.systems.symbols();
      for (_l = 0, _len3 = _ref.length; _l < _len3; _l++) {
        sys = _ref[_l];
        if ((_ref1 = sys.name) !== "wires" && _ref1 !== "store") {
          xml += sys.object.serialize();
        }
      }
      _ref2 = this.wires.symbols();
      for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
        conn = _ref2[_m];
        xml += conn.object.serialize();
      }
      return xml += "</board>";
    }
  };

  Board.prototype.connect = function(source, sink, outlet, inlet, symbol) {
    var name, source_outlet, wire, _i, _len, _ref, _results;
    wire = new this.wireClass(this, source, sink, outlet, inlet);
    if (!symbol) {
      name = this.bus.gensym("wire");
      symbol = new Symbol(name);
    }
    this.wires.bind(symbol, wire);
    _ref = wire.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      source_outlet = _ref[_i];
      if (source_outlet.name === wire.outlet.name) {
        _results.push(source_outlet.object.push(symbol));
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
    var conn, outlet, wire, wires, _i, _j, _len, _len1, _ref, _ref1, _results;
    wire = this.wire(name);
    this.wires.unbind(name);
    _ref = wire.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === wire.outlet.name) {
        wires = [];
        _ref1 = outlet.object;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          conn = _ref1[_j];
          if (conn.name !== name) {
            wires.push(conn);
          }
        }
        _results.push(outlet.object = wires);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Board.prototype.wire = function(name) {
    return this.wires.object(name);
  };

  Board.prototype.haswire = function(name) {
    return this.wires.has(name);
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

exports.Store = Store;

exports.Bus = Bus;

exports.Mirror = Mirror;

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSwrTEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLFFBQVIsQ0FEVCxDQUFBOztBQUFBLEtBRUEsR0FBUSxPQUFBLENBQVEsT0FBUixDQUZSLENBQUE7O0FBQUEsS0FHQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBSFIsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQUp4QixDQUFBOztBQUFBLFFBS0EsR0FBVyxPQUFBLENBQVEsV0FBUixDQUFvQixDQUFDLFFBTGhDLENBQUE7O0FBQUE7QUFTaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLElBQUEsR0FBTSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDRixJQUFBLElBQUcsU0FBSDtBQUNJLE1BQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLENBQVAsQ0FBQTthQUNBLElBQUUsQ0FBQSxDQUFBLEVBRk47S0FBQSxNQUFBO2FBSUksSUFBRSxDQUFBLENBQUEsRUFKTjtLQURFO0VBQUEsQ0FKTixDQUFBOztBQUFBLG1CQVdBLEVBQUEsR0FBSSxTQUFBLEdBQUE7QUFDQSxRQUFBLE9BQUE7QUFBQSxJQURDLGtCQUFHLDhEQUNKLENBQUE7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cXVpcmUgXCJsb2Rhc2hcIlxuY2xvbmUgPSByZXF1aXJlIFwiY2xvbmVcIlxueHBhdGggPSByZXF1aXJlIFwieHBhdGhcIlxuZG9tID0gcmVxdWlyZShcInhtbGRvbVwiKS5ET01QYXJzZXJcbmRvbTJwcm9wID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS5kb20ycHJvcFxuXG5jbGFzcyBTeW1ib2xcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBvYmplY3QsIEBucywgYXR0cnMpIC0+XG4gICAgICAgIGlmIGF0dHJzP1xuICAgICAgICAgICAgQGF0dHJzKGF0dHJzKVxuXG4gICAgYXR0cjogKGssIHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgQFtrXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAW2tdXG5cbiAgICBvcDogKGYsIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBoYXM6IChrKSAtPlxuICAgICAgICBpZiBAW2tdP1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBkZWw6IChrKSAtPlxuICAgICAgICBpZiBAaGFzKGspXG4gICAgICAgICAgICBkZWxldGUgQFtrXVxuXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIGlzOiAoc3ltYm9sKSAtPlxuICAgICAgICBpZiBzeW1ib2wubmFtZSBpcyBAbmFtZVxuICAgICAgICAgICAgaWYgc3ltYm9sLm9iamVjdCBpcyBAb2JqZWN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIGlmIChzeW1ib2wub2JqZWN0IGlzIG51bGwpIGFuZCAoQG9iamVjdCBpcyBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdG9TdHJpbmc6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuXG5TID0gKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKSAtPlxuICAgIHJldHVybiBuZXcgU3ltYm9sKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKVxuXG4jIHNob3VsZCBiZSBhIHNldFxuXG5jbGFzcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgQGVsZW1lbnRzID0ge31cbiAgICAgICAgQHNlcCA9IHNlcCB8fCBcIi5cIlxuICAgICAgICBAX19nZW5zeW0gPSAwXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QsIGNsYXNzX25hbWUpIC0+XG4gICAgICAgIHN5bWJvbC5jbGFzcyA9IGNsYXNzX25hbWUgfHwgb2JqZWN0LmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgbmFtZSA9IHN5bWJvbC5uYW1lXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSBvYmplY3RcbiAgICAgICAgb2JqZWN0LnN5bWJvbCA9IHN5bWJvbFxuICAgICAgICBAZWxlbWVudHNbbmFtZV0gPSBzeW1ib2xcbiAgICAgICAgc3ltYm9sLm5zID0gdGhpc1xuICAgICAgICBzeW1ib2xcblxuICAgIHVuYmluZDogKG5hbWUpIC0+XG4gICAgICAgIHN5bWJvbCA9IEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBkZWxldGUgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIHN5bWJvbC5ucyA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gdW5kZWZpbmVkXG4gICAgICAgIHN5bWJvbC5jbGFzcyA9IHVuZGVmaW5lZFxuXG4gICAgc3ltYm9sOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGVsZW1lbnRzW25hbWVdP1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvYmplY3Q6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV0ub2JqZWN0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgc3ltYm9sczogKCkgLT5cbiAgICAgICBzeW1ib2xzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIHN5bWJvbHMucHVzaCh2KVxuXG4gICAgICAgc3ltYm9sc1xuXG4gICAgb2JqZWN0czogKCkgLT5cbiAgICAgICBvYmplY3RzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIG9iamVjdHMucHVzaCh2Lm9iamVjdClcblxuICAgICAgIG9iamVjdHNcblxuICAgIGdlbnN5bTogKHByZWZpeCkgLT5cbiAgICAgICAgcHJlZml4ID0gcHJlZml4IHx8IFwiZ2Vuc3ltXCJcbiAgICAgICAgcHJlZml4ICsgXCI6XCIgKyAoQF9fZ2Vuc3ltKyspXG5cblxuY2xhc3MgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChwcm9wcykgLT5cbiAgICAgICAgQF9fc2xvdHMgPSBbXVxuICAgICAgICBpZiBwcm9wcz9cbiAgICAgICAgICAgIEBwcm9wcyhwcm9wcylcblxuICAgIGlzOiAoZGF0YSkgLT5cbiAgICAgICAgYWxsX3Nsb3RzID0gQHNsb3RzKClcbiAgICAgICAgZm9yIG5hbWUgaW4gZGF0YS5zbG90cygpXG4gICAgICAgICAgICBpZiBkYXRhLnNsb3QobmFtZSkgIT0gQHNsb3QobmFtZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgcHJvcDogKGssIHYpIC0+XG4gICAgICAgIEBzbG90KGssdilcblxuICAgIHByb3BzOiAoa3YpIC0+XG4gICAgICAgIGlmIGt2XG4gICAgICAgICAgICBmb3IgaywgdiBvZiBrdlxuICAgICAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgICAgICAgICAgaWYgayBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICAgICAgQHNsb3RzKGspXG4gICAgICAgICAgICByZXR1cm4gQHZhbGlkYXRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvcGVydGllcyA9IFtdXG4gICAgICAgICAgICBmb3IgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChAW25hbWVdKVxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXNcblxuICAgIHNsb3RzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZT9cbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWU/XG4gICAgICAgICAgICBAW25hbWVdID0gdmFsdWVcbiAgICAgICAgICAgIGlmIG5hbWUgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgQHNsb3RzKG5hbWUpXG4gICAgICAgICAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEcoXCJJbnZhbGlkXCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgICAgICBAW25hbWVdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBkZWw6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBzbG90c19vbGQgPSBAX19zbG90c1xuICAgICAgICAgICAgQF9fc2xvdHMgPSBbXVxuICAgICAgICAgICAgZm9yIG4gaW4gc2xvdHNfb2xkXG4gICAgICAgICAgICAgICAgaWYgbiAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobilcblxuICAgICAgICAgICAgZGVsZXRlIEBbbmFtZV1cblxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB2YWxpZGF0ZTogLT5cbiAgICAgICAgdHJ1ZVxuXG4gICAgX19zZXJpYWxpemVfc2NhbGFyOiAoc2NhbGFyKSAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkoc2NhbGFyKVxuICAgICAgICAgICAgdHlwZSA9IFwiYXJyYXlcIlxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPGxpc3Q+XCJcbiAgICAgICAgICAgIGZvciBlIGluIHNjYWxhclxuICAgICAgICAgICAgICAgIHhtbCArPSBAX19zZXJpYWxpemVfc2NhbGFyKGUpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2xpc3Q+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjwvc2NhbGFyPlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2Ygc2NhbGFyXG4gICAgICAgICAgICBpZiB0eXBlIGluIFtcImJvb2xlYW5cIiwgXCJudW1iZXJcIiwgXCJzdHJpbmdcIiwgXCJTeW1ib2xcIiBdXG4gICAgICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je3NjYWxhci50b1N0cmluZygpfTwvc2NhbGFyPlwiXG4gICAgICAgIHhtbFxuXG4gICAgaW5pdDogKHhtbCkgLT5cbiAgICAgICAgZG9jID0gbmV3IGRvbSgpLnBhcnNlRnJvbVN0cmluZyh4bWwpXG4gICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgZG9jKVxuICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgZGF0YV9wcm9wID0gZG9tMnByb3AocHJvcClcbiAgICAgICAgICAgIEBwcm9wKGRhdGFfcHJvcC5zbG90LCBkYXRhX3Byb3AudmFsdWUpXG5cblxuICAgIHNlcmlhbGl6ZTogKHRvKSAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICB4bWwgKz0gXCI8cHJvcGVydHkgc2xvdD0nI3tuYW1lfSc+XCJcbiAgICAgICAgICAgIHNjYWxhciAgPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoc2NhbGFyKVxuICAgICAgICAgICAgeG1sICs9ICc8L3Byb3BlcnR5PidcbiAgICAgICAgeG1sXG5cbiAgICB0b1N0cmluZzogLT5cblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEocHJvcHMpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocm91dGUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLnJvdXRlID0gcm91dGVcbiAgICAgICAgcHJvcHMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKHJvdXRlLCBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwb3BzLnRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgc3VwZXIocm91dGUsIHBheWxvYWQsIHByb3BzKVxuXG5jbGFzcyBHbGl0Y2ggZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIGNvbnRleHQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLm5hbWUgPSBuYW1lXG4gICAgICAgIHByb3BzLmNvbnRlbnh0ID0gY29udGV4dFxuICAgICAgICBzdXBlcihwcm9wcylcblxuRyA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEdsaXRjaChuYW1lLCBwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAdmFsdWVzID0gW11cbiAgICAgICAgaWYgdmFsdWU/XG4gICAgICAgICAgICBAc3RhbXAoc2lnbiwgdmFsdWUpXG5cbiAgICBpczogKHQpIC0+XG4gICAgICAgIGZhbHNlXG5cbiAgICB2YWx1ZTogLT5cbiAgICAgICAgQHByb3AoXCJ2YWx1ZVwiKVxuXG4gICAgc3RhbXBfYnk6IChpbmRleCkgLT5cbiAgICAgICAgaWYgaW5kZXg/XG4gICAgICAgICAgIGlmIEBzaWduc1tpbmRleF0/XG4gICAgICAgICAgICAgICByZXR1cm4gQHNpZ25zW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgICAgIGlmIEBzaWducy5sZW5ndGggPiAwXG4gICAgICAgICAgIHJldHVybiBAc2lnbnNbQHNpZ25zLmxlbmd0aCAtIDFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgc3RhbXA6IChzaWduLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWU/XG4gICAgICAgICAgICBpZiBAaGFzKFwidmFsdWVcIilcbiAgICAgICAgICAgICAgICBvbGRfdmFsdWUgPSBAcHJvcChcInZhbHVlXCIpXG4gICAgICAgICAgICAgICAgQGRlbChcInZhbHVlXCIpXG4gICAgICAgICAgICAgICAgQGRlbCh2YWx1ZSlcbiAgICAgICAgICAgIEBwcm9wKFwidmFsdWVcIiwgdmFsdWUpXG4gICAgICAgICAgICBpZiB0eXBlb2YgdmFsdWUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIEBwcm9wKHZhbHVlLCB0cnVlKVxuICAgICAgICAgICAgQHZhbHVlcy5wdXNoKHZhbHVlKVxuICAgICAgICBpZiBzaWduXG4gICAgICAgICAgICBAc2lnbnMucHVzaChzaWduKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2lnbnMucHVzaChTKFwiVW5rbm93blwiKSlcblxuXG5zdGFydCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RhcnRcIiwgc2lnbiwgcHJvcHMpXG5cbnN0b3AgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0b3BcIiwgc2lnbiwgcHJvcHMpXG5cblQgPSAodmFsdWUsIHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHNpZ24sIHByb3BzKVxuXG5jbGFzcyBQYXJ0IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgc2VyaWFsaXplOiAodG8pIC0+XG4gICAgICAgIHhtbCArPSBcIjxwYXJ0IG5hbWU9JyN7QG5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydD4nXG5cblAgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBQYXJ0KG5hbWUsIHByb3BzKVxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBAcGFydHMgPSBuZXcgTmFtZVNwYWNlKFwicGFydHNcIilcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy50cyA9IHByb3BzLnRzIHx8IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gICAgICAgIHRhZ3MgPSB0YWdzIHx8IHByb3BzLnRhZ3MgfHwgW11cbiAgICAgICAgcHJvcHMudGFncyA9IHRhZ3NcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHBhcnQpIC0+XG4gICAgICAgIEBwYXJ0cy5iaW5kKHN5bWJvbCwgcGFydClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy51bmJpbmQobmFtZSlcblxuICAgIGhhc1BhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuaGFzKG5hbWUpXG5cbiAgICBwYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnN5bWJvbChuYW1lKVxuXG4gICAgc2VyaWFsaXplOiAodG8pIC0+XG4gICAgICAgIHhtbCA9IFwiPGVudGl0eT5cIlxuICAgICAgICB4bWwgKz0gJzxwYXJ0cz4nXG4gICAgICAgIGZvciBwYXJ0IG9mIEBwYXJ0cy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBwYXJ0LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0cz4nXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9lbnRpdHk+J1xuXG5FID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5pbnRlcnJ1cHQoZXZlbnQpXG5cbiAgICBhZGQ6IChwYXJ0KSAtPlxuICAgICAgICBzdXBlciBwYXJ0XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1hZGRlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1yZW1vdmVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIHN5c3RlbSkgLT5cbiAgICAgICAgQG9ic2VydmVycy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgZm9yZ2V0OiAobmFtZSkgLT5cbiAgICAgICAgQG9ic2VydmVycy51bmJpbmQobmFtZSlcblxuICAgIHN0ZXA6IChmbiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjbG9uZTogKCkgLT5cbiAgICAgICAgcmV0dXJuIGNsb25lKHRoaXMpXG5cbkMgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBDZWxsKHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIGNvbmYpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcImRlYnVnXCIpLFtdKVxuXG4gICAgICAgIEBjb25mID0gY29uZiB8fCBEKClcbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgQGIubWlycm9yLnJlbGF5KFwicHVzaFwiLCBAc3ltYm9sLm5hbWUsIGRhdGEsIGlubGV0KVxuXG4gICAgICAgIGlubGV0ID0gaW5sZXQgfHwgQGlubGV0cy5zeW1ib2woXCJzeXNpblwiKVxuXG4gICAgICAgIGlucHV0X2RhdGEgPSBAaW5wdXQoZGF0YSwgaW5sZXQpXG5cbiAgICAgICAgaWYgaW5wdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKGlucHV0X2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGlucHV0X2RhdGEsIGlubGV0XG5cbiAgICBnb3RvX3dpdGg6IChpbmxldCwgZGF0YSkgLT5cbiAgICAgICAgQHB1c2goZGF0YSwgaW5sZXQpXG5cbiAgICBwcm9jZXNzOiAoZGF0YSwgaW5sZXQpIC0+XG5cbiAgICBkaXNwYXRjaDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgZm9yIG9sIGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb2wubmFtZSA9PSBvdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIGZvciB3aXJlIGluIG9sLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICB3aXJlLm9iamVjdC50cmFuc21pdCBkYXRhXG5cbiAgICBlbWl0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBvdXRsZXQgPSBvdXRsZXQgfHwgQG91dGxldHMuc3ltYm9sKFwic3lzb3V0XCIpXG5cbiAgICAgICAgb3V0cHV0X2RhdGEgPSBAb3V0cHV0KGRhdGEsIG91dGxldClcblxuICAgICAgICBpZiBvdXRwdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKG91dHB1dF9kYXRhKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQGRpc3BhdGNoKG91dHB1dF9kYXRhLCBvdXRsZXQpXG5cbiAgICBkZWJ1ZzogKGRhdGEpIC0+XG4gICAgICAgIEBkaXNwYXRjaChkYXRhLCBAb3V0bGV0cy5zeW1ib2woXCJkZWJ1Z1wiKSlcblxuICAgIGVycm9yOiAoZGF0YSkgLT5cbiAgICAgICAgQGRpc3BhdGNoKGRhdGEsIEBvdXRsZXRzLnN5bWJvbChcInN5c2VyclwiKSlcblxuICAgIGludGVycnVwdDogKHNpZ25hbCkgLT5cbiAgICAgICAgQGIubWlycm9yLnJlbGF5KFwiaW50ZXJydXB0XCIsIEBzeW1ib2wubmFtZSwgc2lnbmFsKVxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgcmVhY3Q6IChzaWduYWwpIC0+XG5cbiAgICBzaG93OiAoZGF0YSkgLT5cblxuICAgIHNlcmlhbGl6ZTogKHRvKSAtPlxuICAgICAgICB4bWwgPSBcIjxzeXN0ZW0gbmFtZT0nI3tAc3ltYm9sLm5hbWV9JyBjbGFzcz0nI3tAc3ltYm9sLmNsYXNzfSc+XCJcbiAgICAgICAgeG1sICs9IFwiPGNvbmZpZ3VyYXRpb24+XCJcbiAgICAgICAgeG1sICs9IEBjb25mLnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSBcIjwvY29uZmlndXJhdGlvbj5cIlxuICAgICAgICB4bWwgKz0gXCI8L3N5c3RlbT5cIlxuICAgICAgICB4bWxcblxuXG5jbGFzcyBXaXJlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBiLCBzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQpIC0+XG4gICAgICAgIG91dGxldCA9IG91dGxldCB8fCBcInN5c291dFwiXG4gICAgICAgIGlubGV0ID0gaW5sZXQgfHwgXCJzeXNpblwiXG4gICAgICAgIEBzb3VyY2UgPSBAYi5zeXN0ZW1zLnN5bWJvbChzb3VyY2UpXG4gICAgICAgIEBzaW5rID0gQGIuc3lzdGVtcy5zeW1ib2woc2luaylcbiAgICAgICAgQG91dGxldCA9IEBzb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9sKG91dGxldClcbiAgICAgICAgQGlubGV0ID0gQHNpbmsub2JqZWN0LmlubGV0cy5zeW1ib2woaW5sZXQpXG5cbiAgICB0cmFuc21pdDogKGRhdGEpIC0+XG4gICAgICAgIEBzaW5rLm9iamVjdC5wdXNoKGRhdGEsIEBpbmxldClcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICB4bWwgKz0gXCI8d2lyZSBuYW1lPScje0BzeW1ib2wubmFtZX0nPlwiXG4gICAgICAgIHhtbCArPSBcIjxzb3VyY2UgbmFtZT0nI3tAc291cmNlLm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPG91dGxldCBuYW1lPScje0BvdXRsZXQubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8c2luayBuYW1lPScje0BzaW5rLm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPGlubGV0IG5hbWU9JyN7QGlubGV0Lm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPC93aXJlPlwiXG4gICAgICAgIHhtbFxuXG5cblxuY2xhc3MgU3RvcmVcblxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAZW50aXRpZXMgPSBuZXcgTmFtZVNwYWNlKFwiZW50aXRpZXNcIilcblxuICAgIGFkZDogKGVudGl0eSwgc3ltYm9sKSAtPlxuICAgICAgICBpZiBub3Qgc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gQGVudGl0aWVzLmdlbnN5bShcImVudGl0eVwiKVxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgZW50aXR5XG5cbiAgICBzbmFwc2hvdDogKCkgLT5cbiAgICAgICAgeG1sID0gJzw/eG1sIHZlcnNpb24gPSBcIjEuMFwiIHN0YW5kYWxvbmU9XCJ5ZXNcIj8+J1xuICAgICAgICB4bWwgKz0gXCI8c25hcHNob3Q+XCJcbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICB4bWwgKz0gZW50aXR5LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSBcIjwvc25hcHNob3Q+XCJcbiAgICAgICAgcmV0dXJuIHhtbFxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgcmVjb3ZlcjogKHhtbCkgLT5cbiAgICAgICAgZG9jID0gbmV3IGRvbSgpLnBhcnNlRnJvbVN0cmluZyh4bWwpXG4gICAgICAgIGVudGl0aWVzID0geHBhdGguc2VsZWN0KFwiLy9lbnRpdHlcIiwgZG9jKVxuICAgICAgICBlbnRpdGllc19saXN0ID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc1xuICAgICAgICAgICAgZW50aXR5X3Byb3BzID0ge31cbiAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgZW50aXR5KVxuICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcCA9IGRvbTJwcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3BzW2VudGl0eV9wcm9wLnNsb3RdID0gZW50aXR5X3Byb3AudmFsdWVcblxuICAgICAgICAgICAgbmV3X2VudGl0eSA9IG5ldyBFbnRpdHkobnVsbCwgZW50aXR5X3Byb3BzKVxuXG4gICAgICAgICAgICBwYXJ0cyA9IHhwYXRoLnNlbGVjdChcInBhcnRcIiwgZW50aXR5KVxuICAgICAgICAgICAgZm9yIHBhcnQgaW4gcGFydHNcbiAgICAgICAgICAgICAgICBuYW1lID0gcGFydC5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgcGFydF9wcm9wcyA9IHt9XG4gICAgICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBwYXJ0KVxuICAgICAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgICAgIHBhcnRfcHJvcCA9IGRvbTJwcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIHBhcnRfcHJvcHNbcGFydF9wcm9wLnNsb3RdID0gcGFydF9wcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgZW50aXR5X3BhcnQgPSBuZXcgUGFydChuYW1lLCBwYXJ0X3Byb3BzKVxuICAgICAgICAgICAgICAgIG5ld19lbnRpdHkuYWRkKGVudGl0eV9wYXJ0KVxuXG4gICAgICAgICAgICBlbnRpdGllc19saXN0LnB1c2gobmV3X2VudGl0eSlcblxuICAgICAgICBAZW50aXRpZXMgPSBuZXcgTmFtZVNwYWNlKFwiZW50aXRpZXNcIilcbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc19saXN0XG4gICAgICAgICAgICBAYWRkKGVudGl0eSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBlbnRpdGllcy5oYXMobmFtZSlcblxuICAgIGVudGl0eTogKG5hbWUpIC0+XG4gICAgICAgIEBlbnRpdGllcy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIEBlbnRpdGllcy51bmJpbmQobmFtZSlcblxuICAgIGJ5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5Lmhhcyhwcm9wLnNsb3QpXG4gICAgICAgICAgICAgICAgZW50aXR5X3ZhbHVlID0gZW50aXR5LnNsb3QocHJvcC5zbG90KVxuICAgICAgICAgICAgICAgIGlmIEFycmF5LmlzQXJyYXkoZW50aXR5X3ZhbHVlKVxuICAgICAgICAgICAgICAgICAgICBpZiBwcm9wLnZhbHVlIGluIGVudGl0eV92YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBlbnRpdHlfdmFsdWUgaXMgcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eSlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfcHJvcChwcm9wKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cbiAgICBieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGZvciB0YWcgaW4gdGFnc1xuICAgICAgICAgICAgICAgIGlmIHRhZyBpbiBlbnRpdHkudGFnc1xuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoIGVudGl0eVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV90YWdzKHRhZ3MpXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuXG5jbGFzcyBCdXMgZXh0ZW5kcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgc3VwZXIoQG5hbWUsIHNlcClcblxuICAgIHRyaWdnZXI6IChzaWduYWwsIGJyb2FkY2FzdCkgLT5cblxuICAgICAgICBicm9hZGNhc3QgPSBicm9hZGNhc3QgfHwgZmFsc2VcbiAgICAgICAgaW50ZXJydXB0cyA9IDBcblxuICAgICAgICBpZiBicm9hZGNhc3QgPT0gZmFsc2VcbiAgICAgICAgICAgIGZvciBzeW0gaW4gQHN5bWJvbHMoKVxuICAgICAgICAgICAgICAgIGlmIHN5bS5vYmplY3QgaW5zdGFuY2VvZiBTeXN0ZW1cbiAgICAgICAgICAgICAgICAgICAgaWYgc3ltLmhhcyhcInJvdXRlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzeW0uYXR0cihcInJvdXRlXCIpIGlzIHNpZ25hbC5yb3V0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5bS5vYmplY3QuaW50ZXJydXB0KHNpZ25hbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnJ1cHRzKytcblxuICAgICAgICBpZiAoaW50ZXJydXB0cyA9PSAwKSB8fCAoYnJvYWRjYXN0ID09IHRydWUpXG4gICAgICAgICAgICBmb3Igc3ltIGluIEBzeW1ib2xzKClcbiAgICAgICAgICAgICAgICBpZiBzeW0ub2JqZWN0IGluc3RhbmNlb2YgU3lzdGVtXG4gICAgICAgICAgICAgICAgICAgIHN5bS5vYmplY3QuaW50ZXJydXB0KHNpZ25hbClcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJydXB0cysrXG5cbiAgICAgICAgaW50ZXJydXB0c1xuXG5jbGFzcyBNaXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKEBiKSAtPlxuXG4gICAgcmVmbGVjdDogKG9wLCBzeXN0ZW0sIGFyZ3MuLi4pIC0+XG4gICAgICAgIHN5cyA9IEBiLnN5c3RlbXMub2JqZWN0KHN5c3RlbSlcbiAgICAgICAgc3lzW29wXS5hcHBseShzeXMsIGFyZ3MpXG5cbiAgICByZWxheTogKG9wLCBzeXN0ZW0sIGFyZ3MuLi4pIC0+XG5cbmNsYXNzIEJvYXJkXG5cbiAgICBjb25zdHJ1Y3RvcjogKHdpcmVDbGFzcywgYnVzQ2xhc3MsIHN0b3JlQ2xhc3MsIG1pcnJvckNsYXNzICkgLT5cbiAgICAgICAgQHdpcmVDbGFzcyA9IHdpcmVDbGFzcyB8fCBXaXJlXG4gICAgICAgIEBidXNDbGFzcyA9IGJ1c0NsYXNzIHx8IEJ1c1xuICAgICAgICBAc3RvcmVDbGFzcyA9IHN0b3JlQ2xhc3MgfHwgU3RvcmVcbiAgICAgICAgQG1pcnJvckNsYXNzID0gbWlycm9yQ2xhc3MgfHwgTWlycm9yXG4gICAgICAgIEBpbml0KClcblxuICAgIGluaXQ6IC0+XG4gICAgICAgIEBidXMgPSBuZXcgQGJ1c0NsYXNzKFwiYnVzXCIpXG4gICAgICAgIEBzdG9yZSA9IG5ldyBAc3RvcmVDbGFzcygpXG4gICAgICAgIEBtaXJyb3IgPSBuZXcgQG1pcnJvckNsYXNzKHRoaXMpXG4gICAgICAgIEBzeXN0ZW1zID0gQGJ1c1xuICAgICAgICBAd2lyZXMgPSBuZXcgTmFtZVNwYWNlKFwid2lyZXNcIilcblxuICAgICAgICBAYnVzLmJpbmQoUyhcInN0b3JlXCIpLCBAc3RvcmUpXG4gICAgICAgIEBidXMuYmluZChTKFwid2lyZXNcIiksIEB3aXJlcylcblxuICAgIHNldHVwOiAoeG1sLCBjbG9uZSkgLT5cbiAgICAgICAgaWYgeG1sP1xuICAgICAgICAgICAgZG9jID0gbmV3IGRvbSgpLnBhcnNlRnJvbVN0cmluZyh4bWwpXG4gICAgICAgICAgICBib2FyZCA9IHhwYXRoLnNlbGVjdChcImJvYXJkXCIsIGRvYylbMF1cbiAgICAgICAgICAgIGJvYXJkX25hbWUgPSBib2FyZC5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICBidXNfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJCdXNcIiwgYm9hcmQpWzBdLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICBzdG9yZV9jbGFzcyA9IHhwYXRoLnNlbGVjdChcIlN0b3JlXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgd2lyZV9jbGFzcyA9IHhwYXRoLnNlbGVjdChcIldpcmVcIiwgYm9hcmQpWzBdLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG5cbiAgICAgICAgICAgIGlmIGNsb25lP1xuICAgICAgICAgICAgICAgIGJvYXJkX25ldyA9IG5ldyBCb2FyZChib2FyZF9uYW1lLCBnbG9iYWxbd2lyZV9jbGFzc10sIGdsb2JhbFtidXNfY2xhc3NdLCBnbG9iYWxbc3RvcmVfY2xhc3NdKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvYXJkX25ldyA9IEBcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuaW5pdCgpXG5cbiAgICAgICAgICAgIHN5c3MgPSB4cGF0aC5zZWxlY3QoXCJzeXN0ZW1cIiwgYm9hcmQpXG4gICAgICAgICAgICBmb3Igc3lzIGluIHN5c3NcbiAgICAgICAgICAgICAgICBuYW1lID0gc3lzLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBrbGFzcyA9IHN5cy5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgICAgIGNvbmZfbm9kZSA9IHhwYXRoLnNlbGVjdChcImNvbmZpZ3VyYXRpb25cIiwgc3lzKVswXVxuICAgICAgICAgICAgICAgIGRhdGFfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwiLy9wcm9wZXJ0eVwiLCBjb25mX25vZGUpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgZGF0YV9wcm9wID0gZG9tMnByb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgZGF0YV9wcm9wc1tkYXRhX3Byb3Auc2xvdF0gPSBkYXRhX3Byb3AudmFsdWVcblxuICAgICAgICAgICAgICAgIGJvYXJkX25ldy5hZGQoUyhuYW1lKSwgZ2xvYmFsW2tsYXNzXSwgRChkYXRhX3Byb3BzKSlcblxuICAgICAgICAgICAgd2lyZXMgPSB4cGF0aC5zZWxlY3QoXCIvL3dpcmVcIiwgYm9hcmQpXG4gICAgICAgICAgICBmb3Igd2lyZSBpbiB3aXJlc1xuICAgICAgICAgICAgICAgIHNvdXJjZV9uYW1lID0geHBhdGguc2VsZWN0KFwic291cmNlXCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBvdXRsZXRfbmFtZSA9IHhwYXRoLnNlbGVjdChcIm91dGxldFwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgc2lua19uYW1lID0geHBhdGguc2VsZWN0KFwic2lua1wiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgaW5sZXRfbmFtZSA9IHhwYXRoLnNlbGVjdChcImlubGV0XCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcblxuICAgICAgICAgICAgICAgIGJvYXJkX25ldy5jb25uZWN0KHNvdXJjZV9uYW1lLCBzaW5rX25hbWUsIG91dGxldF9uYW1lLCBpbmxldF9uYW1lKVxuXG4gICAgICAgICAgICByZXR1cm4gYm9hcmRfbmV3XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgICAgIGlmIEBzeW1ib2w/XG4gICAgICAgICAgICAgICAgYm9hcmRfbmFtZSA9IEBzeW1ib2wubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvYXJkX25hbWUgPSBcImJcIlxuICAgICAgICAgICAgeG1sICs9IFwiPGJvYXJkIG5hbWU9JyN7Ym9hcmRfbmFtZX0nPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8QnVzIGNsYXNzPScje0BidXMuY29uc3RydWN0b3IubmFtZX0nLz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPFN0b3JlIGNsYXNzPScje0BzdG9yZS5jb25zdHJ1Y3Rvci5uYW1lfScvPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8V2lyZSBjbGFzcz0nI3tAd2lyZUNsYXNzLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIGZvciBzeXMgaW4gQHN5c3RlbXMuc3ltYm9scygpXG4gICAgICAgICAgICAgICAgaWYgc3lzLm5hbWUgbm90IGluIFtcIndpcmVzXCIsIFwic3RvcmVcIl1cbiAgICAgICAgICAgICAgICAgICAgeG1sICs9IHN5cy5vYmplY3Quc2VyaWFsaXplKClcbiAgICAgICAgICAgIGZvciBjb25uIGluIEB3aXJlcy5zeW1ib2xzKClcbiAgICAgICAgICAgICAgICB4bWwgKz0gY29ubi5vYmplY3Quc2VyaWFsaXplKClcbiAgICAgICAgICAgIHhtbCArPSBcIjwvYm9hcmQ+XCJcblxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCwgc3ltYm9sKSAtPlxuICAgICAgICB3aXJlID0gbmV3IEB3aXJlQ2xhc3ModGhpcywgc291cmNlLCBzaW5rLCBvdXRsZXQsIGlubGV0KVxuICAgICAgICBpZiAhc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gQGJ1cy5nZW5zeW0oXCJ3aXJlXCIpXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEB3aXJlcy5iaW5kKHN5bWJvbCwgd2lyZSlcblxuICAgICAgICBmb3Igc291cmNlX291dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIHNvdXJjZV9vdXRsZXQubmFtZSBpcyB3aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgc291cmNlX291dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgd2lyZSA9IEB3aXJlKG5hbWUpXG4gICAgICAgIEB3aXJlcy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIHdpcmUuc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHdpcmVzID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB3aXJlcy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IHdpcmVzXG5cblxuICAgIHdpcmU6IChuYW1lKSAtPlxuICAgICAgICBAd2lyZXMub2JqZWN0KG5hbWUpXG5cbiAgICBoYXN3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLmhhcyhuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMsIGNvbmYpXG4gICAgICAgIEBidXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBidXMuaGFzKG5hbWUpXG5cbiAgICBzeXN0ZW06IChuYW1lKSAtPlxuICAgICAgICBAYnVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQGJ1cy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnB1c2goQFNUT1ApXG4gICAgICAgIEBidXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5TaWduYWwgPSBTaWduYWxcbmV4cG9ydHMuRXZlbnQgPSBFdmVudFxuZXhwb3J0cy5HbGl0Y2ggPSBHbGl0Y2hcbmV4cG9ydHMuRyA9IEdcbmV4cG9ydHMuVG9rZW4gPSBUb2tlblxuZXhwb3J0cy5zdGFydCA9IHN0YXJ0XG5leHBvcnRzLnN0b3AgPSBzdG9wXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLlBhcnQgPSBQYXJ0XG5leHBvcnRzLlAgPSBQXG5leHBvcnRzLkVudGl0eSA9IEVudGl0eVxuZXhwb3J0cy5FID0gRVxuZXhwb3J0cy5DZWxsID0gQ2VsbFxuZXhwb3J0cy5DID0gQ1xuZXhwb3J0cy5TeXN0ZW0gPSBTeXN0ZW1cbmV4cG9ydHMuV2lyZSA9IFdpcmVcbmV4cG9ydHMuU3RvcmUgPSBTdG9yZVxuZXhwb3J0cy5CdXMgPSBCdXNcbmV4cG9ydHMuTWlycm9yID0gTWlycm9yXG5leHBvcnRzLkJvYXJkID0gQm9hcmRcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9