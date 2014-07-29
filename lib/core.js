var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, start, stop, uuid, xpath, __process_prop, __process_scalar,
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
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
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

  System.prototype.serialize = function() {
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

__process_scalar = function(scalar) {
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
      el_value = __process_scalar(el);
      value.push(el_value);
    }
  }
  return value;
};

__process_prop = function(prop) {
  var entity_prop, scalar, slot, value;
  entity_prop = {};
  slot = prop.getAttribute("slot");
  scalar = xpath.select("scalar", prop);
  value = __process_scalar(scalar[0]);
  entity_prop.slot = slot;
  entity_prop.value = value;
  return entity_prop;
};

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
        entity_prop = __process_prop(prop);
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
          part_prop = __process_prop(prop);
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
  function Board(wireClass, busClass, storeClass) {
    this.wireClass = wireClass || Wire;
    this.busClass = busClass || Bus;
    this.storeClass = storeClass || Store;
    this.init();
  }

  Board.prototype.init = function() {
    this.bus = new this.busClass("bus");
    this.store = new this.storeClass();
    this.systems = this.bus;
    this.wires = new NameSpace("wires");
    this.bus.bind(S("store"), this.store);
    return this.bus.bind(S("wires"), this.wires);
  };

  Board.prototype.setup = function(xml, clone) {
    var board, board_name, board_new, bus_class, conf_node, conn, data_prop, data_props, doc, inlet_name, klass, name, outlet_name, prop, props, sink_name, source_name, store_class, sys, syss, wire, wire_class, wires, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
    if (xml) {
      doc = new dom().parseFromString(xml);
      board = xpath.select("board", doc)[0];
      board_name = board.getAttribute("name");
      bus_class = xpath.select("Bus", board)[0].getAttribute("class");
      store_class = xpath.select("Store", board)[0].getAttribute("class");
      wire_class = xpath.select("Wire", board)[0].getAttribute("class");
      if (clone) {
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
          data_prop = __process_prop(prop);
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

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx1TUFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLEtBR0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQUhSLENBQUE7O0FBQUEsR0FJQSxHQUFNLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsU0FKeEIsQ0FBQTs7QUFBQTtBQVFpQixFQUFBLGdCQUFFLElBQUYsRUFBUyxNQUFULEVBQWtCLEVBQWxCLEVBQXNCLEtBQXRCLEdBQUE7QUFDVCxJQURVLElBQUMsQ0FBQSxPQUFBLElBQ1gsQ0FBQTtBQUFBLElBRGlCLElBQUMsQ0FBQSxTQUFBLE1BQ2xCLENBQUE7QUFBQSxJQUQwQixJQUFDLENBQUEsS0FBQSxFQUMzQixDQUFBO0FBQUEsSUFBQSxJQUFHLGFBQUg7QUFDSSxNQUFBLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBUCxDQUFBLENBREo7S0FEUztFQUFBLENBQWI7O0FBQUEsbUJBSUEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNSLElBQUEsSUFBRyxlQUFIO0FBQ0ksYUFBTyxJQUFDLENBQUEsRUFBRSxDQUFDLElBQUosR0FBVyxJQUFDLENBQUEsRUFBRSxDQUFDLEdBQWYsR0FBcUIsSUFBQyxDQUFBLElBQTdCLENBREo7S0FBQSxNQUFBO0FBR0ksYUFBTyxJQUFDLENBQUEsSUFBUixDQUhKO0tBRFE7RUFBQSxDQUpYLENBQUE7O0FBQUEsbUJBVUEsSUFBQSxHQUFNLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNGLElBQUEsSUFBRyxDQUFIO2FBQ0ksSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBRFg7S0FBQSxNQUFBO2FBR0ksSUFBRSxDQUFBLENBQUEsRUFITjtLQURFO0VBQUEsQ0FWTixDQUFB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LElBQVIsR0FBZSxJQWp1QmYsQ0FBQTs7QUFBQSxPQWt1Qk8sQ0FBQyxLQUFSLEdBQWdCLEtBbHVCaEIsQ0FBQTs7QUFBQSxPQW11Qk8sQ0FBQyxHQUFSLEdBQWMsR0FudUJkLENBQUE7O0FBQUEsT0FvdUJPLENBQUMsS0FBUixHQUFnQixLQXB1QmhCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG5cbnhwYXRoID0gcmVxdWlyZSgneHBhdGgnKVxuZG9tID0gcmVxdWlyZSgneG1sZG9tJykuRE9NUGFyc2VyXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBmdWxsX25hbWU6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuICAgIGF0dHI6IChrLCB2KSAtPlxuICAgICAgICBpZiB2XG4gICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAW2tdXG5cbiAgICBvcDogKGYsIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIGlzOiAoc3ltYm9sKSAtPlxuICAgICAgICBpZiBzeW1ib2wubmFtZSBpcyBAbmFtZVxuICAgICAgICAgICAgaWYgc3ltYm9sLm9iamVjdCBpcyBAb2JqZWN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIGlmIChzeW1ib2wub2JqZWN0IGlzIG51bGwpIGFuZCAoQG9iamVjdCBpcyBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG5TID0gKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKSAtPlxuICAgIHJldHVybiBuZXcgU3ltYm9sKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKVxuXG4jIHNob3VsZCBiZSBhIHNldFxuXG5jbGFzcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgQGVsZW1lbnRzID0ge31cbiAgICAgICAgQHNlcCA9IHNlcCB8fCBcIi5cIlxuICAgICAgICBAX19nZW5zeW0gPSAwXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QsIGNsYXNzX25hbWUpIC0+XG4gICAgICAgIHN5bWJvbC5jbGFzcyA9IGNsYXNzX25hbWUgfHwgb2JqZWN0LmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgbmFtZSA9IHN5bWJvbC5uYW1lXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSBvYmplY3RcbiAgICAgICAgb2JqZWN0LnN5bWJvbCA9IHN5bWJvbFxuICAgICAgICBAZWxlbWVudHNbbmFtZV0gPSBzeW1ib2xcbiAgICAgICAgc3ltYm9sLm5zID0gdGhpc1xuICAgICAgICBzeW1ib2xcblxuICAgIHVuYmluZDogKG5hbWUpIC0+XG4gICAgICAgIHN5bWJvbCA9IEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBkZWxldGUgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIHN5bWJvbC5ucyA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gdW5kZWZpbmVkXG4gICAgICAgIHN5bWJvbC5jbGFzcyA9IHVuZGVmaW5lZFxuXG4gICAgc3ltYm9sOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGVsZW1lbnRzW25hbWVdP1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvYmplY3Q6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV0ub2JqZWN0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgc3ltYm9sczogKCkgLT5cbiAgICAgICBzeW1ib2xzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIHN5bWJvbHMucHVzaCh2KVxuXG4gICAgICAgc3ltYm9sc1xuXG4gICAgb2JqZWN0czogKCkgLT5cbiAgICAgICBvYmplY3RzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIG9iamVjdHMucHVzaCh2Lm9iamVjdClcblxuICAgICAgIG9iamVjdHNcblxuICAgIGdlbnN5bTogKHByZWZpeCkgLT5cbiAgICAgICAgcHJlZml4ID0gcHJlZml4IHx8IFwiZ2Vuc3ltXCJcbiAgICAgICAgcHJlZml4ICsgXCI6XCIgKyAoQF9fZ2Vuc3ltKyspXG5cblxuY2xhc3MgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChwcm9wcykgLT5cbiAgICAgICAgQF9fc2xvdHMgPSBbXVxuICAgICAgICBpZiBwcm9wcz9cbiAgICAgICAgICAgIEBwcm9wcyhwcm9wcylcblxuICAgIGlzOiAoZGF0YSkgLT5cbiAgICAgICAgYWxsX3Nsb3RzID0gQHNsb3RzKClcbiAgICAgICAgZm9yIG5hbWUgaW4gZGF0YS5zbG90cygpXG4gICAgICAgICAgICBpZiBkYXRhLnNsb3QobmFtZSkgaXMgbm90IEBzbG90KG5hbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgIHByb3BzOiAoa3YpIC0+XG4gICAgICAgIGlmIGt2XG4gICAgICAgICAgICBmb3IgaywgdiBvZiBrdlxuICAgICAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgICAgICAgICAgaWYgayBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICAgICAgQHNsb3RzKGspXG4gICAgICAgICAgICByZXR1cm4gQHZhbGlkYXRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvcGVydGllcyA9IFtdXG4gICAgICAgICAgICBmb3IgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChAW25hbWVdKVxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXNcblxuICAgIHNsb3RzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgQF9fc2xvdHMucHVzaChuYW1lKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAX19zbG90c1xuXG4gICAgc2xvdDogKG5hbWUsIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZVxuICAgICAgICAgICAgQFtuYW1lXSA9IHZhbHVlXG4gICAgICAgICAgICBpZiBuYW1lIG5vdCBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgIEBzbG90cyhuYW1lKVxuICAgICAgICAgICAgaWYgQHZhbGlkYXRlKClcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiSW52YWxpZFwiKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICAgICAgQFtuYW1lXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB2YWxpZGF0ZTogLT5cbiAgICAgICAgdHJ1ZVxuXG4gICAgX19zZXJpYWxpemVfc2NhbGFyOiAoc2NhbGFyKSAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkoc2NhbGFyKVxuICAgICAgICAgICAgdHlwZSA9IFwiYXJyYXlcIlxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPGxpc3Q+XCJcbiAgICAgICAgICAgIGZvciBlIGluIHNjYWxhclxuICAgICAgICAgICAgICAgIHhtbCArPSBAX19zZXJpYWxpemVfc2NhbGFyKGUpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2xpc3Q+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjwvc2NhbGFyPlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2Ygc2NhbGFyXG4gICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPiN7c2NhbGFyLnRvU3RyaW5nKCl9PC9zY2FsYXI+XCJcbiAgICAgICAgeG1sXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHhtbCArPSBcIjxwcm9wZXJ0eSBzbG90PScje25hbWV9Jz5cIlxuICAgICAgICAgICAgc2NhbGFyICA9IEBzbG90KG5hbWUpXG4gICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihzY2FsYXIpXG4gICAgICAgICAgICB4bWwgKz0gJzwvcHJvcGVydHk+J1xuICAgICAgICB4bWxcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEocHJvcHMpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHBvcHMudHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgICBzdXBlcihuYW1lLCBwYXlsb2FkLCBwcm9wcylcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBjb250ZXh0LCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBwcm9wcy5jb250ZW54dCA9IGNvbnRleHRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbkcgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBHbGl0Y2gobmFtZSwgcHJvcHMpXG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh2YWx1ZSwgc2lnbiwgcHJvcHMpICAtPlxuICAgICAgICBzdXBlcihwcm9wcylcbiAgICAgICAgQHNpZ25zID0gW11cbiAgICAgICAgQHN0YW1wKHNpZ24sIHZhbHVlKVxuXG4gICAgaXM6ICh0KSAtPlxuICAgICAgICBmYWxzZVxuXG4gICAgdmFsdWU6IC0+XG4gICAgICAgIEB2YWx1ZVxuXG4gICAgc3RhbXBfYnk6IChpbmRleCkgLT5cbiAgICAgICAgaWYgaW5kZXg/XG4gICAgICAgICAgIGlmIEBzaWduc1tpbmRleF0/XG4gICAgICAgICAgICAgICByZXR1cm4gQHNpZ25zW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgICAgIGlmIEBzaWducy5sZW5ndGggPiAwXG4gICAgICAgICAgIHJldHVybiBAc2lnbnNbQHNpZ25zLmxlbmd0aCAtIDFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgc3RhbXA6IChzaWduLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIGlmIEBbdmFsdWVdXG4gICAgICAgICAgICAgICAgZGVsZXRlIEBbdmFsdWVdXG4gICAgICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgICAgICAgaWYgdHlwZW9mIEB2YWx1ZSBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgQFtAdmFsdWVdID0gdHJ1ZVxuICAgICAgICBpZiBzaWduP1xuICAgICAgICAgICAgQHNpZ25zLnB1c2goc2lnbilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpZ25zLnB1c2goUyhcIlVua25vd25cIikpXG5cblxuc3RhcnQgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0YXJ0XCIsIHNpZ24sIHByb3BzKVxuXG5zdG9wID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdG9wXCIsIHNpZ24sIHByb3BzKVxuXG5UID0gKHZhbHVlLCBzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKHZhbHVlLCBzaWduLCBwcm9wcylcblxuY2xhc3MgUGFydCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sICs9IFwiPHBhcnQgbmFtZT0nI3tAbmFtZX0nPlwiXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0PidcblxuUCA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFBhcnQobmFtZSwgcHJvcHMpXG5cbmNsYXNzIEVudGl0eSBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIEBwYXJ0cyA9IG5ldyBOYW1lU3BhY2UoXCJwYXJ0c1wiKVxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLmlkID0gcHJvcHMuaWQgfHwgdXVpZC52NCgpXG4gICAgICAgIHRhZ3MgPSB0YWdzIHx8IHByb3BzLnRhZ3MgfHwgW11cbiAgICAgICAgcHJvcHMudGFncyA9IHRhZ3NcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHBhcnQpIC0+XG4gICAgICAgIEBwYXJ0cy5iaW5kKHN5bWJvbCwgcGFydClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy51bmJpbmQobmFtZSlcblxuICAgIGhhc1BhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuaGFzKG5hbWUpXG5cbiAgICBwYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnN5bWJvbChuYW1lKVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIjxlbnRpdHk+XCJcbiAgICAgICAgeG1sICs9ICc8cGFydHM+J1xuICAgICAgICBmb3IgcGFydCBvZiBAcGFydHMub2JqZWN0cygpXG4gICAgICAgICAgICB4bWwgKz0gcGFydC5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydHM+J1xuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvZW50aXR5PidcblxuRSA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEVudGl0eSh0YWdzLCBwcm9wcylcblxuY2xhc3MgQ2VsbCBleHRlbmRzIEVudGl0eVxuXG4gICAgY29uc3RydWN0b3I6ICh0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIodGFncywgcHJvcHMpXG4gICAgICAgIEBvYnNlcnZlcnM9IG5ldyBOYW1lU3BhY2UoXCJvYnNlcnZlcnNcIilcblxuICAgIG5vdGlmeTogKGV2ZW50KSAtPlxuICAgICAgIGZvciBvYiBpbiBAb2JzZXJ2ZXJzLm9iamVjdHMoKVxuICAgICAgICAgICAgb2IucmFpc2UoZXZlbnQpXG5cbiAgICBhZGQ6IChwYXJ0KSAtPlxuICAgICAgICBzdXBlciBwYXJ0XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1hZGRlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1yZW1vdmVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIHN5c3RlbSkgLT5cbiAgICAgICAgQG9ic2VydmVycy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgZm9yZ2V0OiAobmFtZSkgLT5cbiAgICAgICAgQG9ic2VydmVycy51bmJpbmQobmFtZSlcblxuICAgIHN0ZXA6IChmbiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjbG9uZTogKCkgLT5cbiAgICAgICAgcmV0dXJuIGNsb25lKHRoaXMpXG5cbkMgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBDZWxsKHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIGNvbmYpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG5cbiAgICAgICAgQGNvbmYgPSBjb25mIHx8IEQoKVxuICAgICAgICBAc3RhdGUgPSBbXVxuICAgICAgICBAciA9IHt9XG5cbiAgICB0b3A6IChpbmRleCkgLT5cbiAgICAgICAgaWYgaW5kZXg/XG4gICAgICAgICAgICBpZiBAc3RhdGVbaW5kZXhdP1xuICAgICAgICAgICAgICAgIHJldHVybiBAc3RhdGVbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgICAgIGlmIEBzdGF0ZS5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gQHN0YXRlW0BzdGF0ZS5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBpbnB1dDogKGRhdGEsIGlubGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBvdXRwdXQ6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGRhdGFcblxuICAgIFNUT1A6IChzdG9wX3Rva2VuKSAtPlxuXG4gICAgcHVzaDogKGRhdGEsIGlubGV0KSAtPlxuXG4gICAgICAgIGlubGV0ID0gaW5sZXQgfHwgQGlubGV0cy5zeW1ib2woXCJzeXNpblwiKVxuXG4gICAgICAgIGlucHV0X2RhdGEgPSBAaW5wdXQoZGF0YSwgaW5sZXQpXG5cbiAgICAgICAgaWYgaW5wdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKGlucHV0X2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGlucHV0X2RhdGEsIGlubGV0XG5cbiAgICBnb3RvX3dpdGg6IChpbmxldCwgZGF0YSkgLT5cbiAgICAgICAgQHB1c2goZGF0YSwgaW5sZXQpXG5cbiAgICBwcm9jZXNzOiAoZGF0YSwgaW5sZXQpIC0+XG5cbiAgICBkaXNwYXRjaDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgZm9yIG9sIGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb2wubmFtZSA9PSBvdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIGZvciB3aXJlIGluIG9sLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICB3aXJlLm9iamVjdC50cmFuc21pdCBkYXRhXG5cbiAgICBlbWl0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBvdXRsZXQgPSBvdXRsZXQgfHwgQG91dGxldHMuc3ltYm9sKFwic3lzb3V0XCIpXG5cbiAgICAgICAgb3V0cHV0X2RhdGEgPSBAb3V0cHV0KGRhdGEsIG91dGxldClcblxuICAgICAgICBpZiBvdXRwdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKG91dHB1dF9kYXRhKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQGRpc3BhdGNoKG91dHB1dF9kYXRhLCBvdXRsZXQpXG5cblxuICAgIGVycm9yOiAoZGF0YSkgLT5cbiAgICAgICAgQGRpc3BhdGNoKGRhdGEsIEBvdXRsZXRzLnN5bWJvbChcInN5c2VyclwiKSlcblxuICAgIHJhaXNlOiAoc2lnbmFsKSAtPlxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgaW50ZXJydXB0OiAoc2lnbmFsKSAtPlxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgcmVhY3Q6IChzaWduYWwpIC0+XG5cbiAgICBzaG93OiAoZGF0YSkgLT5cblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCI8c3lzdGVtIG5hbWU9JyN7QHN5bWJvbC5uYW1lfScgY2xhc3M9JyN7QHN5bWJvbC5jbGFzc30nPlwiXG4gICAgICAgIHhtbCArPSBcIjxjb25maWd1cmF0aW9uPlwiXG4gICAgICAgIHhtbCArPSBAY29uZi5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L2NvbmZpZ3VyYXRpb24+XCJcbiAgICAgICAgeG1sICs9IFwiPC9zeXN0ZW0+XCJcbiAgICAgICAgeG1sXG5cblxuY2xhc3MgV2lyZVxuXG4gICAgY29uc3RydWN0b3I6IChAYiwgc291cmNlLCBzaW5rLCBvdXRsZXQsIGlubGV0KSAtPlxuICAgICAgICBvdXRsZXQgPSBvdXRsZXQgfHwgXCJzeXNvdXRcIlxuICAgICAgICBpbmxldCA9IGlubGV0IHx8IFwic3lzaW5cIlxuICAgICAgICBAc291cmNlID0gQGIuc3lzdGVtcy5zeW1ib2woc291cmNlKVxuICAgICAgICBAc2luayA9IEBiLnN5c3RlbXMuc3ltYm9sKHNpbmspXG4gICAgICAgIEBvdXRsZXQgPSBAc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbChvdXRsZXQpXG4gICAgICAgIEBpbmxldCA9IEBzaW5rLm9iamVjdC5pbmxldHMuc3ltYm9sKGlubGV0KVxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5vYmplY3QucHVzaChkYXRhLCBAaW5sZXQpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgeG1sICs9IFwiPHdpcmUgbmFtZT0nI3tAc3ltYm9sLm5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gXCI8c291cmNlIG5hbWU9JyN7QHNvdXJjZS5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxvdXRsZXQgbmFtZT0nI3tAb3V0bGV0Lm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPHNpbmsgbmFtZT0nI3tAc2luay5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxpbmxldCBuYW1lPScje0BpbmxldC5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjwvd2lyZT5cIlxuICAgICAgICB4bWxcblxuX19wcm9jZXNzX3NjYWxhciA9IChzY2FsYXIpIC0+XG4gICAgICAgIHR5cGUgPSBzY2FsYXIuZ2V0QXR0cmlidXRlKFwidHlwZVwiKVxuICAgICAgICB0ZXh0ID0gc2NhbGFyLnRleHRDb250ZW50XG4gICAgICAgIGlmIHR5cGUgaXMgXCJudW1iZXJcIlxuICAgICAgICAgICAgdmFsdWUgPSBOdW1iZXIodGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImJvb2xlYW5cIlxuICAgICAgICAgICAgdmFsdWUgPSBCb29sZWFuKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImFycmF5XCJcbiAgICAgICAgICAgIGxpc3Rfc2NhbGFycyA9IHhwYXRoLnNlbGVjdChcImxpc3Qvc2NhbGFyXCIsIHNjYWxhcilcbiAgICAgICAgICAgIHZhbHVlID0gW11cbiAgICAgICAgICAgIGZvciBlbCBpbiBsaXN0X3NjYWxhcnNcbiAgICAgICAgICAgICAgICBlbF92YWx1ZSA9IF9fcHJvY2Vzc19zY2FsYXIoZWwpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChlbF92YWx1ZSlcblxuICAgICAgICByZXR1cm4gdmFsdWVcblxuX19wcm9jZXNzX3Byb3AgPSAocHJvcCkgLT5cbiAgICAgICAgZW50aXR5X3Byb3AgPSB7fVxuICAgICAgICBzbG90ID0gcHJvcC5nZXRBdHRyaWJ1dGUoXCJzbG90XCIpXG4gICAgICAgIHNjYWxhciA9IHhwYXRoLnNlbGVjdChcInNjYWxhclwiLCBwcm9wKVxuICAgICAgICB2YWx1ZSA9IF9fcHJvY2Vzc19zY2FsYXIoc2NhbGFyWzBdKVxuICAgICAgICBlbnRpdHlfcHJvcC5zbG90ID0gc2xvdFxuICAgICAgICBlbnRpdHlfcHJvcC52YWx1ZSA9IHZhbHVlXG4gICAgICAgIGVudGl0eV9wcm9wXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChlbnRpdHkpIC0+XG4gICAgICAgIHN5bWJvbCA9IFMoZW50aXR5LmlkKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgZW50aXR5XG5cbiAgICBzbmFwc2hvdDogKCkgLT5cbiAgICAgICAgeG1sID0gJzw/eG1sIHZlcnNpb24gPSBcIjEuMFwiIHN0YW5kYWxvbmU9XCJ5ZXNcIj8+J1xuICAgICAgICB4bWwgKz0gXCI8c25hcHNob3Q+XCJcbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICB4bWwgKz0gZW50aXR5LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSBcIjwvc25hcHNob3Q+XCJcbiAgICAgICAgcmV0dXJuIHhtbFxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgcmVjb3ZlcjogKHhtbCkgLT5cbiAgICAgICAgZG9jID0gbmV3IGRvbSgpLnBhcnNlRnJvbVN0cmluZyh4bWwpXG4gICAgICAgIGVudGl0aWVzID0geHBhdGguc2VsZWN0KFwiLy9lbnRpdHlcIiwgZG9jKVxuICAgICAgICBlbnRpdGllc19saXN0ID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc1xuICAgICAgICAgICAgZW50aXR5X3Byb3BzID0ge31cbiAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgZW50aXR5KVxuICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcCA9IF9fcHJvY2Vzc19wcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3BzW2VudGl0eV9wcm9wLnNsb3RdID0gZW50aXR5X3Byb3AudmFsdWVcblxuICAgICAgICAgICAgbmV3X2VudGl0eSA9IG5ldyBFbnRpdHkobnVsbCwgZW50aXR5X3Byb3BzKVxuXG4gICAgICAgICAgICBwYXJ0cyA9IHhwYXRoLnNlbGVjdChcInBhcnRcIiwgZW50aXR5KVxuICAgICAgICAgICAgZm9yIHBhcnQgaW4gcGFydHNcbiAgICAgICAgICAgICAgICBuYW1lID0gcGFydC5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgcGFydF9wcm9wcyA9IHt9XG4gICAgICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBwYXJ0KVxuICAgICAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgICAgIHBhcnRfcHJvcCA9IF9fcHJvY2Vzc19wcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIHBhcnRfcHJvcHNbcGFydF9wcm9wLnNsb3RdID0gcGFydF9wcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgZW50aXR5X3BhcnQgPSBuZXcgUGFydChuYW1lLCBwYXJ0X3Byb3BzKVxuICAgICAgICAgICAgICAgIG5ld19lbnRpdHkuYWRkKGVudGl0eV9wYXJ0KVxuXG4gICAgICAgICAgICBlbnRpdGllc19saXN0LnB1c2gobmV3X2VudGl0eSlcblxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzX2xpc3RcbiAgICAgICAgICAgIEBhZGQoZW50aXR5KVxuXG4gICAgaGFzOiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy5oYXMoaWQpXG5cbiAgICBlbnRpdHk6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChpZClcblxuICAgIHJlbW92ZTogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKGlkKVxuXG4gICAgYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaGFzKHByb3Auc2xvdClcbiAgICAgICAgICAgICAgICBpZiBlbnRpdHkuc2xvdChwcm9wLnNsb3QpIGlzIHByb3AudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpXG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3Byb3AocHJvcClcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG4gICAgYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfdGFncyh0YWdzKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cblxuY2xhc3MgQnVzIGV4dGVuZHMgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIHN1cGVyKEBuYW1lLCBzZXApXG5cbiAgICB0cmlnZ2VyOiAoc2lnbmFsKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIFN5c3RlbVxuICAgICAgICAgICAgICAgIG9iai5yYWlzZShzaWduYWwpXG5cbmNsYXNzIEJvYXJkXG5cbiAgICBjb25zdHJ1Y3RvcjogKHdpcmVDbGFzcywgYnVzQ2xhc3MsIHN0b3JlQ2xhc3MpIC0+XG4gICAgICAgIEB3aXJlQ2xhc3MgPSB3aXJlQ2xhc3MgfHwgV2lyZVxuICAgICAgICBAYnVzQ2xhc3MgPSBidXNDbGFzcyB8fCBCdXNcbiAgICAgICAgQHN0b3JlQ2xhc3MgPSBzdG9yZUNsYXNzIHx8IFN0b3JlXG5cbiAgICAgICAgQGluaXQoKVxuXG4gICAgaW5pdDogLT5cbiAgICAgICAgQGJ1cyA9IG5ldyBAYnVzQ2xhc3MoXCJidXNcIilcbiAgICAgICAgQHN0b3JlID0gbmV3IEBzdG9yZUNsYXNzKClcbiAgICAgICAgQHN5c3RlbXMgPSBAYnVzXG4gICAgICAgIEB3aXJlcyA9IG5ldyBOYW1lU3BhY2UoXCJ3aXJlc1wiKVxuXG4gICAgICAgIEBidXMuYmluZChTKFwic3RvcmVcIiksIEBzdG9yZSlcbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJ3aXJlc1wiKSwgQHdpcmVzKVxuXG4gICAgc2V0dXA6ICh4bWwsIGNsb25lKSAtPlxuICAgICAgICBpZiB4bWxcbiAgICAgICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICAgICAgYm9hcmQgPSB4cGF0aC5zZWxlY3QoXCJib2FyZFwiLCBkb2MpWzBdXG4gICAgICAgICAgICBib2FyZF9uYW1lID0gYm9hcmQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgYnVzX2NsYXNzID0geHBhdGguc2VsZWN0KFwiQnVzXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgc3RvcmVfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJTdG9yZVwiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgIHdpcmVfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJXaXJlXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuXG4gICAgICAgICAgICBpZiBjbG9uZVxuICAgICAgICAgICAgICAgIGJvYXJkX25ldyA9IG5ldyBCb2FyZChib2FyZF9uYW1lLCBnbG9iYWxbd2lyZV9jbGFzc10sIGdsb2JhbFtidXNfY2xhc3NdLCBnbG9iYWxbc3RvcmVfY2xhc3NdKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvYXJkX25ldyA9IEBcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuaW5pdCgpXG5cbiAgICAgICAgICAgIHN5c3MgPSB4cGF0aC5zZWxlY3QoXCJzeXN0ZW1cIiwgYm9hcmQpXG4gICAgICAgICAgICBmb3Igc3lzIGluIHN5c3NcbiAgICAgICAgICAgICAgICBuYW1lID0gc3lzLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBrbGFzcyA9IHN5cy5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgICAgIGNvbmZfbm9kZSA9IHhwYXRoLnNlbGVjdChcImNvbmZpZ3VyYXRpb25cIiwgc3lzKVswXVxuICAgICAgICAgICAgICAgIGRhdGFfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwiLy9wcm9wZXJ0eVwiLCBjb25mX25vZGUpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgZGF0YV9wcm9wID0gX19wcm9jZXNzX3Byb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgZGF0YV9wcm9wc1tkYXRhX3Byb3Auc2xvdF0gPSBkYXRhX3Byb3AudmFsdWVcblxuICAgICAgICAgICAgICAgIGJvYXJkX25ldy5hZGQoUyhuYW1lKSwgZ2xvYmFsW2tsYXNzXSwgRChkYXRhX3Byb3BzKSlcblxuICAgICAgICAgICAgd2lyZXMgPSB4cGF0aC5zZWxlY3QoXCIvL3dpcmVcIiwgYm9hcmQpXG4gICAgICAgICAgICBmb3Igd2lyZSBpbiB3aXJlc1xuICAgICAgICAgICAgICAgIHNvdXJjZV9uYW1lID0geHBhdGguc2VsZWN0KFwic291cmNlXCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBvdXRsZXRfbmFtZSA9IHhwYXRoLnNlbGVjdChcIm91dGxldFwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgc2lua19uYW1lID0geHBhdGguc2VsZWN0KFwic2lua1wiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgaW5sZXRfbmFtZSA9IHhwYXRoLnNlbGVjdChcImlubGV0XCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcblxuICAgICAgICAgICAgICAgIGJvYXJkX25ldy5jb25uZWN0KHNvdXJjZV9uYW1lLCBzaW5rX25hbWUsIG91dGxldF9uYW1lLCBpbmxldF9uYW1lKVxuXG4gICAgICAgICAgICByZXR1cm4gYm9hcmRfbmV3XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgICAgIGlmIEBzeW1ib2w/XG4gICAgICAgICAgICAgICAgYm9hcmRfbmFtZSA9IEBzeW1ib2wubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvYXJkX25hbWUgPSBcImJcIlxuICAgICAgICAgICAgeG1sICs9IFwiPGJvYXJkIG5hbWU9JyN7Ym9hcmRfbmFtZX0nPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8QnVzIGNsYXNzPScje0BidXMuY29uc3RydWN0b3IubmFtZX0nLz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPFN0b3JlIGNsYXNzPScje0BzdG9yZS5jb25zdHJ1Y3Rvci5uYW1lfScvPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8V2lyZSBjbGFzcz0nI3tAd2lyZUNsYXNzLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIGZvciBzeXMgaW4gQHN5c3RlbXMuc3ltYm9scygpXG4gICAgICAgICAgICAgICAgaWYgc3lzLm5hbWUgbm90IGluIFtcIndpcmVzXCIsIFwic3RvcmVcIl1cbiAgICAgICAgICAgICAgICAgICAgeG1sICs9IHN5cy5vYmplY3Quc2VyaWFsaXplKClcbiAgICAgICAgICAgIGZvciBjb25uIGluIEB3aXJlcy5zeW1ib2xzKClcbiAgICAgICAgICAgICAgICB4bWwgKz0gY29ubi5vYmplY3Quc2VyaWFsaXplKClcbiAgICAgICAgICAgIHhtbCArPSBcIjwvYm9hcmQ+XCJcblxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCwgc3ltYm9sKSAtPlxuICAgICAgICB3aXJlID0gbmV3IEB3aXJlQ2xhc3ModGhpcywgc291cmNlLCBzaW5rLCBvdXRsZXQsIGlubGV0KVxuICAgICAgICBpZiAhc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gQGJ1cy5nZW5zeW0oXCJ3aXJlXCIpXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEB3aXJlcy5iaW5kKHN5bWJvbCwgd2lyZSlcblxuICAgICAgICBmb3Igc291cmNlX291dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIHNvdXJjZV9vdXRsZXQubmFtZSBpcyB3aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgc291cmNlX291dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgd2lyZSA9IEB3aXJlKG5hbWUpXG4gICAgICAgIEB3aXJlcy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIHdpcmUuc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHdpcmVzID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB3aXJlcy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IHdpcmVzXG5cblxuICAgIHdpcmU6IChuYW1lKSAtPlxuICAgICAgICBAd2lyZXMub2JqZWN0KG5hbWUpXG5cbiAgICBoYXN3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLmhhcyhuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMsIGNvbmYpXG4gICAgICAgIEBidXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBidXMuaGFzKG5hbWUpXG5cbiAgICBzeXN0ZW06IChuYW1lKSAtPlxuICAgICAgICBAYnVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQGJ1cy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnB1c2goQFNUT1ApXG4gICAgICAgIEBidXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5TaWduYWwgPSBTaWduYWxcbmV4cG9ydHMuRXZlbnQgPSBFdmVudFxuZXhwb3J0cy5HbGl0Y2ggPSBHbGl0Y2hcbmV4cG9ydHMuRyA9IEdcbmV4cG9ydHMuVG9rZW4gPSBUb2tlblxuZXhwb3J0cy5zdGFydCA9IHN0YXJ0XG5leHBvcnRzLnN0b3AgPSBzdG9wXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLlBhcnQgPSBQYXJ0XG5leHBvcnRzLlAgPSBQXG5leHBvcnRzLkVudGl0eSA9IEVudGl0eVxuZXhwb3J0cy5FID0gRVxuZXhwb3J0cy5DZWxsID0gQ2VsbFxuZXhwb3J0cy5DID0gQ1xuZXhwb3J0cy5TeXN0ZW0gPSBTeXN0ZW1cbmV4cG9ydHMuV2lyZSA9IFdpcmVcbmV4cG9ydHMuU3RvcmUgPSBTdG9yZVxuZXhwb3J0cy5CdXMgPSBCdXNcbmV4cG9ydHMuQm9hcmQgPSBCb2FyZFxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=