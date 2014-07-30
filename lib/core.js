var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, dom2prop, start, stop, uuid, xpath,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

uuid = require("node-uuid");

clone = require("clone");

xpath = require('xpath');

dom = require('xmldom').DOMParser;

dom2prop = require('./helpers').dom2prop;

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

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSwrS0FBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLEtBRUEsR0FBUSxPQUFBLENBQVEsT0FBUixDQUZSLENBQUE7O0FBQUEsR0FHQSxHQUFNLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsU0FIeEIsQ0FBQTs7QUFBQSxRQUlBLEdBQVcsT0FBQSxDQUFRLFdBQVIsQ0FBb0IsQ0FBQyxRQUpoQyxDQUFBOztBQUFBO0FBUWlCLEVBQUEsZ0JBQUUsSUFBRixFQUFTLE1BQVQsRUFBa0IsRUFBbEIsRUFBc0IsS0FBdEIsR0FBQTtBQUNULElBRFUsSUFBQyxDQUFBLE9BQUEsSUFDWCxDQUFBO0FBQUEsSUFEaUIsSUFBQyxDQUFBLFNBQUEsTUFDbEIsQ0FBQTtBQUFBLElBRDBCLElBQUMsQ0FBQSxLQUFBLEVBQzNCLENBQUE7QUFBQSxJQUFBLElBQUcsYUFBSDtBQUNJLE1BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLENBQUEsQ0FESjtLQURTO0VBQUEsQ0FBYjs7QUFBQSxtQkFJQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1IsSUFBQSxJQUFHLGVBQUg7QUFDSSxhQUFPLElBQUMsQ0FBQSxFQUFFLENBQUMsSUFBSixHQUFXLElBQUMsQ0FBQSxFQUFFLENBQUMsR0FBZixHQUFxQixJQUFDLENBQUEsSUFBN0IsQ0FESjtLQUFBLE1BQUE7QUFHSSxhQUFPLElBQUMsQ0FBQSxJQUFSLENBSEo7S0FEUTtFQUFBLENBSlgsQ0FBQTs7QUFBQSxtQkFVQSxJQUFBLEdBQU0sU0FBQyxDQUFELEVBQUksQ0FBSixHQUFBO0FBQ0YsSUFBQSxJQUFHLENBQUg7YUFDSSxJQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU8sRUFEWDtL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YyxHQTFzQmQsQ0FBQTs7QUFBQSxPQTJzQk8sQ0FBQyxLQUFSLEdBQWdCLEtBM3NCaEIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbInV1aWQgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG54cGF0aCA9IHJlcXVpcmUoJ3hwYXRoJylcbmRvbSA9IHJlcXVpcmUoJ3htbGRvbScpLkRPTVBhcnNlclxuZG9tMnByb3AgPSByZXF1aXJlKCcuL2hlbHBlcnMnKS5kb20ycHJvcFxuXG5jbGFzcyBTeW1ib2xcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBvYmplY3QsIEBucywgYXR0cnMpIC0+XG4gICAgICAgIGlmIGF0dHJzP1xuICAgICAgICAgICAgQGF0dHJzKGF0dHJzKVxuXG4gICAgZnVsbF9uYW1lOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdlxuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcbiAgICAgICAgQF9fZ2Vuc3ltID0gMFxuXG4gICAgYmluZDogKHN5bWJvbCwgb2JqZWN0LCBjbGFzc19uYW1lKSAtPlxuICAgICAgICBzeW1ib2wuY2xhc3MgPSBjbGFzc19uYW1lIHx8IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2wuY2xhc3MgPSB1bmRlZmluZWRcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBTKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBlbGVtZW50c1tuYW1lXT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdLm9iamVjdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cbiAgICBnZW5zeW06IChwcmVmaXgpIC0+XG4gICAgICAgIHByZWZpeCA9IHByZWZpeCB8fCBcImdlbnN5bVwiXG4gICAgICAgIHByZWZpeCArIFwiOlwiICsgKEBfX2dlbnN5bSsrKVxuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpIGlzIG5vdCBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBpZiBrdlxuICAgICAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgICAgIGlmIGsgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgICAgIEBzbG90cyhrKVxuICAgICAgICAgICAgcmV0dXJuIEB2YWxpZGF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbXVxuICAgICAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2goQFtuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzXG5cbiAgICBzbG90czogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdmFsaWRhdGU6IC0+XG4gICAgICAgIHRydWVcblxuICAgIF9fc2VyaWFsaXplX3NjYWxhcjogKHNjYWxhcikgLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICBpZiBBcnJheS5pc0FycmF5KHNjYWxhcilcbiAgICAgICAgICAgIHR5cGUgPSBcImFycmF5XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxsaXN0PlwiXG4gICAgICAgICAgICBmb3IgZSBpbiBzY2FsYXJcbiAgICAgICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihlKVxuICAgICAgICAgICAgeG1sICs9IFwiPC9saXN0PlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8L3NjYWxhcj5cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIHNjYWxhclxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je3NjYWxhci50b1N0cmluZygpfTwvc2NhbGFyPlwiXG4gICAgICAgIHhtbFxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICB4bWwgKz0gXCI8cHJvcGVydHkgc2xvdD0nI3tuYW1lfSc+XCJcbiAgICAgICAgICAgIHNjYWxhciAgPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoc2NhbGFyKVxuICAgICAgICAgICAgeG1sICs9ICc8L3Byb3BlcnR5PidcbiAgICAgICAgeG1sXG5cbkQgPSAocHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBEYXRhKHByb3BzKVxuXG5jbGFzcyBTaWduYWwgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLm5hbWUgPSBuYW1lXG4gICAgICAgIHByb3BzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBFdmVudCBleHRlbmRzIFNpZ25hbFxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwb3BzLnRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgc3VwZXIobmFtZSwgcGF5bG9hZCwgcHJvcHMpXG5cbmNsYXNzIEdsaXRjaCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMuY29udGVueHQgPSBjb250ZXh0XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5HID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgR2xpdGNoKG5hbWUsIHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHNpZ24sIHByb3BzKSAgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG4gICAgICAgIEBzaWducyA9IFtdXG4gICAgICAgIEBzdGFtcChzaWduLCB2YWx1ZSlcblxuICAgIGlzOiAodCkgLT5cbiAgICAgICAgZmFsc2VcblxuICAgIHZhbHVlOiAtPlxuICAgICAgICBAdmFsdWVcblxuICAgIHN0YW1wX2J5OiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICBpZiBAc2lnbnNbaW5kZXhdP1xuICAgICAgICAgICAgICAgcmV0dXJuIEBzaWduc1tpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICByZXR1cm4gQHNpZ25zW0BzaWducy5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIHN0YW1wOiAoc2lnbiwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlXG4gICAgICAgICAgICBpZiBAW3ZhbHVlXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBAW3ZhbHVlXVxuICAgICAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgICAgIGlmIHR5cGVvZiBAdmFsdWUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgaWYgc2lnbj9cbiAgICAgICAgICAgIEBzaWducy5wdXNoKHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbnN0YXJ0ID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdGFydFwiLCBzaWduLCBwcm9wcylcblxuc3RvcCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RvcFwiLCBzaWduLCBwcm9wcylcblxuVCA9ICh2YWx1ZSwgc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbih2YWx1ZSwgc2lnbiwgcHJvcHMpXG5cbmNsYXNzIFBhcnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCArPSBcIjxwYXJ0IG5hbWU9JyN7QG5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydD4nXG5cblAgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBQYXJ0KG5hbWUsIHByb3BzKVxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBAcGFydHMgPSBuZXcgTmFtZVNwYWNlKFwicGFydHNcIilcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5pZCA9IHByb3BzLmlkIHx8IHV1aWQudjQoKVxuICAgICAgICB0YWdzID0gdGFncyB8fCBwcm9wcy50YWdzIHx8IFtdXG4gICAgICAgIHByb3BzLnRhZ3MgPSB0YWdzXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBwYXJ0KSAtPlxuICAgICAgICBAcGFydHMuYmluZChzeW1ib2wsIHBhcnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMudW5iaW5kKG5hbWUpXG5cbiAgICBoYXNQYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLmhhcyhuYW1lKVxuXG4gICAgcGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5zeW1ib2wobmFtZSlcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCI8ZW50aXR5PlwiXG4gICAgICAgIHhtbCArPSAnPHBhcnRzPidcbiAgICAgICAgZm9yIHBhcnQgb2YgQHBhcnRzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IHBhcnQuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnRzPidcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L2VudGl0eT4nXG5cbkUgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBFbnRpdHkodGFncywgcHJvcHMpXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLnJhaXNlKGV2ZW50KVxuXG4gICAgYWRkOiAocGFydCkgLT5cbiAgICAgICAgc3VwZXIgcGFydFxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtYWRkZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3VwZXIgbmFtZVxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtcmVtb3ZlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICBvYnNlcnZlOiAoc3ltYm9sLCBzeXN0ZW0pIC0+XG4gICAgICAgIEBvYnNlcnZlcnMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGZvcmdldDogKG5hbWUpIC0+XG4gICAgICAgIEBvYnNlcnZlcnMudW5iaW5kKG5hbWUpXG5cbiAgICBzdGVwOiAoZm4sIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2xvbmU6ICgpIC0+XG4gICAgICAgIHJldHVybiBjbG9uZSh0aGlzKVxuXG5DID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgQ2VsbCh0YWdzLCBwcm9wcylcblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBiLCBjb25mKSAtPlxuICAgICAgICBAaW5sZXRzID0gbmV3IE5hbWVTcGFjZShcImlubGV0c1wiKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2luXCIpLFtdKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcImZlZWRiYWNrXCIpLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c291dFwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzZXJyXCIpLFtdKVxuXG4gICAgICAgIEBjb25mID0gY29uZiB8fCBEKClcbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldCkgLT5cblxuICAgICAgICBpbmxldCA9IGlubGV0IHx8IEBpbmxldHMuc3ltYm9sKFwic3lzaW5cIilcblxuICAgICAgICBpbnB1dF9kYXRhID0gQGlucHV0KGRhdGEsIGlubGV0KVxuXG4gICAgICAgIGlmIGlucHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihpbnB1dF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBpbnB1dF9kYXRhLCBpbmxldFxuXG4gICAgZ290b193aXRoOiAoaW5sZXQsIGRhdGEpIC0+XG4gICAgICAgIEBwdXNoKGRhdGEsIGlubGV0KVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0KSAtPlxuXG4gICAgZGlzcGF0Y2g6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGZvciBvbCBpbiBAb3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG9sLm5hbWUgPT0gb3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBmb3Igd2lyZSBpbiBvbC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgd2lyZS5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IEBvdXRsZXRzLnN5bWJvbChcInN5c291dFwiKVxuXG4gICAgICAgIG91dHB1dF9kYXRhID0gQG91dHB1dChkYXRhLCBvdXRsZXQpXG5cbiAgICAgICAgaWYgb3V0cHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihvdXRwdXRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBkaXNwYXRjaChvdXRwdXRfZGF0YSwgb3V0bGV0KVxuXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBkaXNwYXRjaChkYXRhLCBAb3V0bGV0cy5zeW1ib2woXCJzeXNlcnJcIikpXG5cbiAgICByYWlzZTogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIGludGVycnVwdDogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIHJlYWN0OiAoc2lnbmFsKSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPHN5c3RlbSBuYW1lPScje0BzeW1ib2wubmFtZX0nIGNsYXNzPScje0BzeW1ib2wuY2xhc3N9Jz5cIlxuICAgICAgICB4bWwgKz0gXCI8Y29uZmlndXJhdGlvbj5cIlxuICAgICAgICB4bWwgKz0gQGNvbmYuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9jb25maWd1cmF0aW9uPlwiXG4gICAgICAgIHhtbCArPSBcIjwvc3lzdGVtPlwiXG4gICAgICAgIHhtbFxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IFwic3lzb3V0XCJcbiAgICAgICAgaW5sZXQgPSBpbmxldCB8fCBcInN5c2luXCJcbiAgICAgICAgQHNvdXJjZSA9IEBiLnN5c3RlbXMuc3ltYm9sKHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAYi5zeXN0ZW1zLnN5bWJvbChzaW5rKVxuICAgICAgICBAb3V0bGV0ID0gQHNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2wob3V0bGV0KVxuICAgICAgICBAaW5sZXQgPSBAc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChpbmxldClcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQGlubGV0KVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIHhtbCArPSBcIjx3aXJlIG5hbWU9JyN7QHN5bWJvbC5uYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IFwiPHNvdXJjZSBuYW1lPScje0Bzb3VyY2UubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8b3V0bGV0IG5hbWU9JyN7QG91dGxldC5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxzaW5rIG5hbWU9JyN7QHNpbmsubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8aW5sZXQgbmFtZT0nI3tAaW5sZXQubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8L3dpcmU+XCJcbiAgICAgICAgeG1sXG5cblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoZW50aXR5KSAtPlxuICAgICAgICBzeW1ib2wgPSBTKGVudGl0eS5pZClcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIGVudGl0eVxuXG4gICAgc25hcHNob3Q6ICgpIC0+XG4gICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgeG1sICs9IFwiPHNuYXBzaG90PlwiXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IGVudGl0eS5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L3NuYXBzaG90PlwiXG4gICAgICAgIHJldHVybiB4bWxcblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIHJlY292ZXI6ICh4bWwpIC0+XG4gICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICBlbnRpdGllcyA9IHhwYXRoLnNlbGVjdChcIi8vZW50aXR5XCIsIGRvYylcbiAgICAgICAgZW50aXRpZXNfbGlzdCA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNcbiAgICAgICAgICAgIGVudGl0eV9wcm9wcyA9IHt9XG4gICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wc1tlbnRpdHlfcHJvcC5zbG90XSA9IGVudGl0eV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgIG5ld19lbnRpdHkgPSBuZXcgRW50aXR5KG51bGwsIGVudGl0eV9wcm9wcylcblxuICAgICAgICAgICAgcGFydHMgPSB4cGF0aC5zZWxlY3QoXCJwYXJ0XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHBhcnRfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgcGFydClcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzW3BhcnRfcHJvcC5zbG90XSA9IHBhcnRfcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgIGVudGl0eV9wYXJ0ID0gbmV3IFBhcnQobmFtZSwgcGFydF9wcm9wcylcbiAgICAgICAgICAgICAgICBuZXdfZW50aXR5LmFkZChlbnRpdHlfcGFydClcblxuICAgICAgICAgICAgZW50aXRpZXNfbGlzdC5wdXNoKG5ld19lbnRpdHkpXG5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc19saXN0XG4gICAgICAgICAgICBAYWRkKGVudGl0eSlcblxuICAgIGhhczogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMuaGFzKGlkKVxuXG4gICAgZW50aXR5OiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy5vYmplY3QoaWQpXG5cbiAgICByZW1vdmU6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChpZClcblxuICAgIGJ5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5Lmhhcyhwcm9wLnNsb3QpXG4gICAgICAgICAgICAgICAgaWYgZW50aXR5LnNsb3QocHJvcC5zbG90KSBpcyBwcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5KVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV9wcm9wKHByb3ApXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuICAgIGJ5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3RhZ3ModGFncylcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG5cbmNsYXNzIEJ1cyBleHRlbmRzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBzdXBlcihAbmFtZSwgc2VwKVxuXG4gICAgdHJpZ2dlcjogKHNpZ25hbCkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cygpXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBTeXN0ZW1cbiAgICAgICAgICAgICAgICBvYmoucmFpc2Uoc2lnbmFsKVxuXG5jbGFzcyBCb2FyZFxuXG4gICAgY29uc3RydWN0b3I6ICh3aXJlQ2xhc3MsIGJ1c0NsYXNzLCBzdG9yZUNsYXNzKSAtPlxuICAgICAgICBAd2lyZUNsYXNzID0gd2lyZUNsYXNzIHx8IFdpcmVcbiAgICAgICAgQGJ1c0NsYXNzID0gYnVzQ2xhc3MgfHwgQnVzXG4gICAgICAgIEBzdG9yZUNsYXNzID0gc3RvcmVDbGFzcyB8fCBTdG9yZVxuXG4gICAgICAgIEBpbml0KClcblxuICAgIGluaXQ6IC0+XG4gICAgICAgIEBidXMgPSBuZXcgQGJ1c0NsYXNzKFwiYnVzXCIpXG4gICAgICAgIEBzdG9yZSA9IG5ldyBAc3RvcmVDbGFzcygpXG4gICAgICAgIEBzeXN0ZW1zID0gQGJ1c1xuICAgICAgICBAd2lyZXMgPSBuZXcgTmFtZVNwYWNlKFwid2lyZXNcIilcblxuICAgICAgICBAYnVzLmJpbmQoUyhcInN0b3JlXCIpLCBAc3RvcmUpXG4gICAgICAgIEBidXMuYmluZChTKFwid2lyZXNcIiksIEB3aXJlcylcblxuICAgIHNldHVwOiAoeG1sLCBjbG9uZSkgLT5cbiAgICAgICAgaWYgeG1sXG4gICAgICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgICAgIGJvYXJkID0geHBhdGguc2VsZWN0KFwiYm9hcmRcIiwgZG9jKVswXVxuICAgICAgICAgICAgYm9hcmRfbmFtZSA9IGJvYXJkLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgIGJ1c19jbGFzcyA9IHhwYXRoLnNlbGVjdChcIkJ1c1wiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgIHN0b3JlX2NsYXNzID0geHBhdGguc2VsZWN0KFwiU3RvcmVcIiwgYm9hcmQpWzBdLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICB3aXJlX2NsYXNzID0geHBhdGguc2VsZWN0KFwiV2lyZVwiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcblxuICAgICAgICAgICAgaWYgY2xvbmVcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBuZXcgQm9hcmQoYm9hcmRfbmFtZSwgZ2xvYmFsW3dpcmVfY2xhc3NdLCBnbG9iYWxbYnVzX2NsYXNzXSwgZ2xvYmFsW3N0b3JlX2NsYXNzXSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBAXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmluaXQoKVxuXG4gICAgICAgICAgICBzeXNzID0geHBhdGguc2VsZWN0KFwic3lzdGVtXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHN5cyBpbiBzeXNzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHN5cy5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAga2xhc3MgPSBzeXMuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgICAgICBjb25mX25vZGUgPSB4cGF0aC5zZWxlY3QoXCJjb25maWd1cmF0aW9uXCIsIHN5cylbMF1cbiAgICAgICAgICAgICAgICBkYXRhX3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcIi8vcHJvcGVydHlcIiwgY29uZl9ub2RlKVxuICAgICAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcCA9IGRvbTJwcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcHNbZGF0YV9wcm9wLnNsb3RdID0gZGF0YV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuYWRkKFMobmFtZSksIGdsb2JhbFtrbGFzc10sIEQoZGF0YV9wcm9wcykpXG5cbiAgICAgICAgICAgIHdpcmVzID0geHBhdGguc2VsZWN0KFwiLy93aXJlXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHdpcmUgaW4gd2lyZXNcbiAgICAgICAgICAgICAgICBzb3VyY2VfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNvdXJjZVwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgb3V0bGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJvdXRsZXRcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHNpbmtfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNpbmtcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIGlubGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJpbmxldFwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuY29ubmVjdChzb3VyY2VfbmFtZSwgc2lua19uYW1lLCBvdXRsZXRfbmFtZSwgaW5sZXRfbmFtZSlcblxuICAgICAgICAgICAgcmV0dXJuIGJvYXJkX25ld1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB4bWwgPSAnPD94bWwgdmVyc2lvbiA9IFwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nXG4gICAgICAgICAgICBpZiBAc3ltYm9sP1xuICAgICAgICAgICAgICAgIGJvYXJkX25hbWUgPSBAc3ltYm9sLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uYW1lID0gXCJiXCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxib2FyZCBuYW1lPScje2JvYXJkX25hbWV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPEJ1cyBjbGFzcz0nI3tAYnVzLmNvbnN0cnVjdG9yLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxTdG9yZSBjbGFzcz0nI3tAc3RvcmUuY29uc3RydWN0b3IubmFtZX0nLz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPFdpcmUgY2xhc3M9JyN7QHdpcmVDbGFzcy5uYW1lfScvPlwiXG4gICAgICAgICAgICBmb3Igc3lzIGluIEBzeXN0ZW1zLnN5bWJvbHMoKVxuICAgICAgICAgICAgICAgIGlmIHN5cy5uYW1lIG5vdCBpbiBbXCJ3aXJlc1wiLCBcInN0b3JlXCJdXG4gICAgICAgICAgICAgICAgICAgIHhtbCArPSBzeXMub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICBmb3IgY29ubiBpbiBAd2lyZXMuc3ltYm9scygpXG4gICAgICAgICAgICAgICAgeG1sICs9IGNvbm4ub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2JvYXJkPlwiXG5cblxuICAgIGNvbm5lY3Q6IChzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQsIHN5bWJvbCkgLT5cbiAgICAgICAgd2lyZSA9IG5ldyBAd2lyZUNsYXNzKHRoaXMsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldClcbiAgICAgICAgaWYgIXN5bWJvbFxuICAgICAgICAgICAgbmFtZSA9IEBidXMuZ2Vuc3ltKFwid2lyZVwiKVxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAd2lyZXMuYmluZChzeW1ib2wsIHdpcmUpXG5cbiAgICAgICAgZm9yIHNvdXJjZV9vdXRsZXQgaW4gd2lyZS5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBzb3VyY2Vfb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHNvdXJjZV9vdXRsZXQub2JqZWN0LnB1c2goc3ltYm9sKVxuXG4gICAgcGlwZTogKHNvdXJjZSwgd2lyZSwgc2luaykgLT5cbiAgICAgICAgQGNvbm5lY3Qoc291cmNlLCBzaW5rLCB3aXJlKVxuXG4gICAgZGlzY29ubmVjdDogKG5hbWUpIC0+XG4gICAgICAgIHdpcmUgPSBAd2lyZShuYW1lKVxuICAgICAgICBAd2lyZXMudW5iaW5kKG5hbWUpXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICB3aXJlcyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgd2lyZXMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSB3aXJlc1xuXG5cbiAgICB3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLm9iamVjdChuYW1lKVxuXG4gICAgaGFzd2lyZTogKG5hbWUpIC0+XG4gICAgICAgIEB3aXJlcy5oYXMobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAYnVzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAYnVzLmhhcyhuYW1lKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN5c3RlbSA9IEBidXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5wdXNoKEBTVE9QKVxuICAgICAgICBAYnVzLnVuYmluZChuYW1lKVxuXG5leHBvcnRzLlN5bWJvbCA9IFN5bWJvbFxuZXhwb3J0cy5OYW1lU3BhY2UgPSBOYW1lU3BhY2VcbmV4cG9ydHMuUyA9IFNcbmV4cG9ydHMuRGF0YSA9IERhdGFcbmV4cG9ydHMuRCA9IERcbmV4cG9ydHMuU2lnbmFsID0gU2lnbmFsXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLkcgPSBHXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuc3RhcnQgPSBzdGFydFxuZXhwb3J0cy5zdG9wID0gc3RvcFxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5QYXJ0ID0gUGFydFxuZXhwb3J0cy5QID0gUFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuRSA9IEVcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuQyA9IENcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkJvYXJkID0gQm9hcmRcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9