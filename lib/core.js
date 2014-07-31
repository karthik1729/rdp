var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, dom2prop, lodash, start, stop, uuid, xpath,
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

  Symbol.prototype.full_name = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

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
    this.values = [];
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
    if (value != null) {
      if (this[value]) {
        delete this[value];
      }
      this.value = value;
      if (typeof this.value === "string") {
        this[this.value] = true;
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

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx1TEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLFFBQVIsQ0FEVCxDQUFBOztBQUFBLEtBRUEsR0FBUSxPQUFBLENBQVEsT0FBUixDQUZSLENBQUE7O0FBQUEsS0FHQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBSFIsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQUp4QixDQUFBOztBQUFBLFFBS0EsR0FBVyxPQUFBLENBQVEsV0FBUixDQUFvQixDQUFDLFFBTGhDLENBQUE7O0FBQUE7QUFTaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDUixJQUFBLElBQUcsZUFBSDtBQUNJLGFBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLEdBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLElBQUMsQ0FBQSxJQUE3QixDQURKO0tBQUEsTUFBQTtBQUdJLGFBQU8sSUFBQyxDQUFBLElBQVIsQ0FISjtLQURRO0VBQUEsQ0FKWCxDQUFBOztBQUFBLG1CQVVBLElBQUEsR0FBTSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDRixJQUFBLElBQUcs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cmVxdWlyZSBcImxvZGFzaFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG54cGF0aCA9IHJlcXVpcmUgXCJ4cGF0aFwiXG5kb20gPSByZXF1aXJlKFwieG1sZG9tXCIpLkRPTVBhcnNlclxuZG9tMnByb3AgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLmRvbTJwcm9wXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBmdWxsX25hbWU6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuICAgIGF0dHI6IChrLCB2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgICAgIEBba11cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcbiAgICAgICAgQF9fZ2Vuc3ltID0gMFxuXG4gICAgYmluZDogKHN5bWJvbCwgb2JqZWN0LCBjbGFzc19uYW1lKSAtPlxuICAgICAgICBzeW1ib2wuY2xhc3MgPSBjbGFzc19uYW1lIHx8IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2wuY2xhc3MgPSB1bmRlZmluZWRcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBTKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBlbGVtZW50c1tuYW1lXT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdLm9iamVjdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cbiAgICBnZW5zeW06IChwcmVmaXgpIC0+XG4gICAgICAgIHByZWZpeCA9IHByZWZpeCB8fCBcImdlbnN5bVwiXG4gICAgICAgIHByZWZpeCArIFwiOlwiICsgKEBfX2dlbnN5bSsrKVxuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpICE9IEBzbG90KG5hbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgIHByb3A6IChrLCB2KSAtPlxuICAgICAgICBAc2xvdChrLHYpXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBpZiBrdlxuICAgICAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgICAgIGlmIGsgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgICAgIEBzbG90cyhrKVxuICAgICAgICAgICAgcmV0dXJuIEB2YWxpZGF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbXVxuICAgICAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2goQFtuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzXG5cbiAgICBzbG90czogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWU/XG4gICAgICAgICAgICBAX19zbG90cy5wdXNoKG5hbWUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBfX3Nsb3RzXG5cbiAgICBzbG90OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlP1xuICAgICAgICAgICAgQFtuYW1lXSA9IHZhbHVlXG4gICAgICAgICAgICBpZiBuYW1lIG5vdCBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgIEBzbG90cyhuYW1lKVxuICAgICAgICAgICAgaWYgQHZhbGlkYXRlKClcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiSW52YWxpZFwiKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICAgICAgQFtuYW1lXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB2YWxpZGF0ZTogLT5cbiAgICAgICAgdHJ1ZVxuXG4gICAgX19zZXJpYWxpemVfc2NhbGFyOiAoc2NhbGFyKSAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkoc2NhbGFyKVxuICAgICAgICAgICAgdHlwZSA9IFwiYXJyYXlcIlxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPGxpc3Q+XCJcbiAgICAgICAgICAgIGZvciBlIGluIHNjYWxhclxuICAgICAgICAgICAgICAgIHhtbCArPSBAX19zZXJpYWxpemVfc2NhbGFyKGUpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2xpc3Q+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjwvc2NhbGFyPlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2Ygc2NhbGFyXG4gICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPiN7c2NhbGFyLnRvU3RyaW5nKCl9PC9zY2FsYXI+XCJcbiAgICAgICAgeG1sXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHhtbCArPSBcIjxwcm9wZXJ0eSBzbG90PScje25hbWV9Jz5cIlxuICAgICAgICAgICAgc2NhbGFyICA9IEBzbG90KG5hbWUpXG4gICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihzY2FsYXIpXG4gICAgICAgICAgICB4bWwgKz0gJzwvcHJvcGVydHk+J1xuICAgICAgICB4bWxcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEocHJvcHMpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHBvcHMudHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgICBzdXBlcihuYW1lLCBwYXlsb2FkLCBwcm9wcylcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBjb250ZXh0LCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBwcm9wcy5jb250ZW54dCA9IGNvbnRleHRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbkcgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBHbGl0Y2gobmFtZSwgcHJvcHMpXG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh2YWx1ZSwgc2lnbiwgcHJvcHMpICAtPlxuICAgICAgICBzdXBlcihwcm9wcylcbiAgICAgICAgQHNpZ25zID0gW11cbiAgICAgICAgQHZhbHVlcyA9IFtdXG4gICAgICAgIEBzdGFtcChzaWduLCB2YWx1ZSlcblxuICAgIGlzOiAodCkgLT5cbiAgICAgICAgZmFsc2VcblxuICAgIHZhbHVlOiAtPlxuICAgICAgICBAdmFsdWVcblxuICAgIHN0YW1wX2J5OiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICBpZiBAc2lnbnNbaW5kZXhdP1xuICAgICAgICAgICAgICAgcmV0dXJuIEBzaWduc1tpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICByZXR1cm4gQHNpZ25zW0BzaWducy5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIHN0YW1wOiAoc2lnbiwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlP1xuICAgICAgICAgICAgaWYgQFt2YWx1ZV1cbiAgICAgICAgICAgICAgICBkZWxldGUgQFt2YWx1ZV1cbiAgICAgICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgICBpZiB0eXBlb2YgQHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICBAW0B2YWx1ZV0gPSB0cnVlXG4gICAgICAgICAgICBAdmFsdWVzLnB1c2godmFsdWUpXG4gICAgICAgIGlmIHNpZ25cbiAgICAgICAgICAgIEBzaWducy5wdXNoKHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbnN0YXJ0ID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdGFydFwiLCBzaWduLCBwcm9wcylcblxuc3RvcCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RvcFwiLCBzaWduLCBwcm9wcylcblxuVCA9ICh2YWx1ZSwgc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbih2YWx1ZSwgc2lnbiwgcHJvcHMpXG5cbmNsYXNzIFBhcnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCArPSBcIjxwYXJ0IG5hbWU9JyN7QG5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydD4nXG5cblAgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBQYXJ0KG5hbWUsIHByb3BzKVxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBAcGFydHMgPSBuZXcgTmFtZVNwYWNlKFwicGFydHNcIilcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5pZCA9IHByb3BzLmlkIHx8IHV1aWQudjQoKVxuICAgICAgICBwcm9wcy50cyA9IHByb3BzLnRzIHx8IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gICAgICAgIHRhZ3MgPSB0YWdzIHx8IHByb3BzLnRhZ3MgfHwgW11cbiAgICAgICAgcHJvcHMudGFncyA9IHRhZ3NcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHBhcnQpIC0+XG4gICAgICAgIEBwYXJ0cy5iaW5kKHN5bWJvbCwgcGFydClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy51bmJpbmQobmFtZSlcblxuICAgIGhhc1BhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuaGFzKG5hbWUpXG5cbiAgICBwYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnN5bWJvbChuYW1lKVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIjxlbnRpdHk+XCJcbiAgICAgICAgeG1sICs9ICc8cGFydHM+J1xuICAgICAgICBmb3IgcGFydCBvZiBAcGFydHMub2JqZWN0cygpXG4gICAgICAgICAgICB4bWwgKz0gcGFydC5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydHM+J1xuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvZW50aXR5PidcblxuRSA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEVudGl0eSh0YWdzLCBwcm9wcylcblxuY2xhc3MgQ2VsbCBleHRlbmRzIEVudGl0eVxuXG4gICAgY29uc3RydWN0b3I6ICh0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIodGFncywgcHJvcHMpXG4gICAgICAgIEBvYnNlcnZlcnM9IG5ldyBOYW1lU3BhY2UoXCJvYnNlcnZlcnNcIilcblxuICAgIG5vdGlmeTogKGV2ZW50KSAtPlxuICAgICAgIGZvciBvYiBpbiBAb2JzZXJ2ZXJzLm9iamVjdHMoKVxuICAgICAgICAgICAgb2IucmFpc2UoZXZlbnQpXG5cbiAgICBhZGQ6IChwYXJ0KSAtPlxuICAgICAgICBzdXBlciBwYXJ0XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1hZGRlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1yZW1vdmVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIHN5c3RlbSkgLT5cbiAgICAgICAgQG9ic2VydmVycy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgZm9yZ2V0OiAobmFtZSkgLT5cbiAgICAgICAgQG9ic2VydmVycy51bmJpbmQobmFtZSlcblxuICAgIHN0ZXA6IChmbiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjbG9uZTogKCkgLT5cbiAgICAgICAgcmV0dXJuIGNsb25lKHRoaXMpXG5cbkMgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBDZWxsKHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIGNvbmYpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcImRlYnVnXCIpLFtdKVxuXG4gICAgICAgIEBjb25mID0gY29uZiB8fCBEKClcbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldCkgLT5cblxuICAgICAgICBpbmxldCA9IGlubGV0IHx8IEBpbmxldHMuc3ltYm9sKFwic3lzaW5cIilcblxuICAgICAgICBpbnB1dF9kYXRhID0gQGlucHV0KGRhdGEsIGlubGV0KVxuXG4gICAgICAgIGlmIGlucHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihpbnB1dF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBpbnB1dF9kYXRhLCBpbmxldFxuXG4gICAgZ290b193aXRoOiAoaW5sZXQsIGRhdGEpIC0+XG4gICAgICAgIEBwdXNoKGRhdGEsIGlubGV0KVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0KSAtPlxuXG4gICAgZGlzcGF0Y2g6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGZvciBvbCBpbiBAb3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG9sLm5hbWUgPT0gb3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBmb3Igd2lyZSBpbiBvbC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgd2lyZS5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IEBvdXRsZXRzLnN5bWJvbChcInN5c291dFwiKVxuXG4gICAgICAgIG91dHB1dF9kYXRhID0gQG91dHB1dChkYXRhLCBvdXRsZXQpXG5cbiAgICAgICAgaWYgb3V0cHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihvdXRwdXRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBkaXNwYXRjaChvdXRwdXRfZGF0YSwgb3V0bGV0KVxuXG4gICAgZGVidWc6IChkYXRhKSAtPlxuICAgICAgICBAZGlzcGF0Y2goZGF0YSwgQG91dGxldHMuc3ltYm9sKFwiZGVidWdcIikpXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBkaXNwYXRjaChkYXRhLCBAb3V0bGV0cy5zeW1ib2woXCJzeXNlcnJcIikpXG5cbiAgICByYWlzZTogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIGludGVycnVwdDogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIHJlYWN0OiAoc2lnbmFsKSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPHN5c3RlbSBuYW1lPScje0BzeW1ib2wubmFtZX0nIGNsYXNzPScje0BzeW1ib2wuY2xhc3N9Jz5cIlxuICAgICAgICB4bWwgKz0gXCI8Y29uZmlndXJhdGlvbj5cIlxuICAgICAgICB4bWwgKz0gQGNvbmYuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9jb25maWd1cmF0aW9uPlwiXG4gICAgICAgIHhtbCArPSBcIjwvc3lzdGVtPlwiXG4gICAgICAgIHhtbFxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IFwic3lzb3V0XCJcbiAgICAgICAgaW5sZXQgPSBpbmxldCB8fCBcInN5c2luXCJcbiAgICAgICAgQHNvdXJjZSA9IEBiLnN5c3RlbXMuc3ltYm9sKHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAYi5zeXN0ZW1zLnN5bWJvbChzaW5rKVxuICAgICAgICBAb3V0bGV0ID0gQHNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2wob3V0bGV0KVxuICAgICAgICBAaW5sZXQgPSBAc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChpbmxldClcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQGlubGV0KVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIHhtbCArPSBcIjx3aXJlIG5hbWU9JyN7QHN5bWJvbC5uYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IFwiPHNvdXJjZSBuYW1lPScje0Bzb3VyY2UubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8b3V0bGV0IG5hbWU9JyN7QG91dGxldC5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxzaW5rIG5hbWU9JyN7QHNpbmsubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8aW5sZXQgbmFtZT0nI3tAaW5sZXQubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8L3dpcmU+XCJcbiAgICAgICAgeG1sXG5cblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoZW50aXR5KSAtPlxuICAgICAgICBzeW1ib2wgPSBTKGVudGl0eS5pZClcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIGVudGl0eVxuXG4gICAgc25hcHNob3Q6ICgpIC0+XG4gICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgeG1sICs9IFwiPHNuYXBzaG90PlwiXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IGVudGl0eS5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L3NuYXBzaG90PlwiXG4gICAgICAgIHJldHVybiB4bWxcblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIHJlY292ZXI6ICh4bWwpIC0+XG4gICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICBlbnRpdGllcyA9IHhwYXRoLnNlbGVjdChcIi8vZW50aXR5XCIsIGRvYylcbiAgICAgICAgZW50aXRpZXNfbGlzdCA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNcbiAgICAgICAgICAgIGVudGl0eV9wcm9wcyA9IHt9XG4gICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wc1tlbnRpdHlfcHJvcC5zbG90XSA9IGVudGl0eV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgIG5ld19lbnRpdHkgPSBuZXcgRW50aXR5KG51bGwsIGVudGl0eV9wcm9wcylcblxuICAgICAgICAgICAgcGFydHMgPSB4cGF0aC5zZWxlY3QoXCJwYXJ0XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHBhcnRfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgcGFydClcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzW3BhcnRfcHJvcC5zbG90XSA9IHBhcnRfcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgIGVudGl0eV9wYXJ0ID0gbmV3IFBhcnQobmFtZSwgcGFydF9wcm9wcylcbiAgICAgICAgICAgICAgICBuZXdfZW50aXR5LmFkZChlbnRpdHlfcGFydClcblxuICAgICAgICAgICAgZW50aXRpZXNfbGlzdC5wdXNoKG5ld19lbnRpdHkpXG5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc19saXN0XG4gICAgICAgICAgICBAYWRkKGVudGl0eSlcblxuICAgIGhhczogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMuaGFzKGlkKVxuXG4gICAgZW50aXR5OiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy5vYmplY3QoaWQpXG5cbiAgICByZW1vdmU6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChpZClcblxuICAgIGJ5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5Lmhhcyhwcm9wLnNsb3QpXG4gICAgICAgICAgICAgICAgZW50aXR5X3ZhbHVlID0gZW50aXR5LnNsb3QocHJvcC5zbG90KVxuICAgICAgICAgICAgICAgIGlmIEFycmF5LmlzQXJyYXkoZW50aXR5X3ZhbHVlKVxuICAgICAgICAgICAgICAgICAgICBpZiBwcm9wLnZhbHVlIGluIGVudGl0eV92YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBlbnRpdHlfdmFsdWUgaXMgcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eSlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfcHJvcChwcm9wKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cbiAgICBieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGZvciB0YWcgaW4gdGFnc1xuICAgICAgICAgICAgICAgIGlmIHRhZyBpbiBlbnRpdHkudGFnc1xuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoIGVudGl0eVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV90YWdzKHRhZ3MpXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuXG5jbGFzcyBCdXMgZXh0ZW5kcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgc3VwZXIoQG5hbWUsIHNlcClcblxuICAgIHRyaWdnZXI6IChzaWduYWwpIC0+XG4gICAgICAgIGZvciBvYmogaW4gQG9iamVjdHMoKVxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgU3lzdGVtXG4gICAgICAgICAgICAgICAgb2JqLnJhaXNlKHNpZ25hbClcblxuY2xhc3MgQm9hcmRcblxuICAgIGNvbnN0cnVjdG9yOiAod2lyZUNsYXNzLCBidXNDbGFzcywgc3RvcmVDbGFzcykgLT5cbiAgICAgICAgQHdpcmVDbGFzcyA9IHdpcmVDbGFzcyB8fCBXaXJlXG4gICAgICAgIEBidXNDbGFzcyA9IGJ1c0NsYXNzIHx8IEJ1c1xuICAgICAgICBAc3RvcmVDbGFzcyA9IHN0b3JlQ2xhc3MgfHwgU3RvcmVcblxuICAgICAgICBAaW5pdCgpXG5cbiAgICBpbml0OiAtPlxuICAgICAgICBAYnVzID0gbmV3IEBidXNDbGFzcyhcImJ1c1wiKVxuICAgICAgICBAc3RvcmUgPSBuZXcgQHN0b3JlQ2xhc3MoKVxuICAgICAgICBAc3lzdGVtcyA9IEBidXNcbiAgICAgICAgQHdpcmVzID0gbmV3IE5hbWVTcGFjZShcIndpcmVzXCIpXG5cbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJzdG9yZVwiKSwgQHN0b3JlKVxuICAgICAgICBAYnVzLmJpbmQoUyhcIndpcmVzXCIpLCBAd2lyZXMpXG5cbiAgICBzZXR1cDogKHhtbCwgY2xvbmUpIC0+XG4gICAgICAgIGlmIHhtbD9cbiAgICAgICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICAgICAgYm9hcmQgPSB4cGF0aC5zZWxlY3QoXCJib2FyZFwiLCBkb2MpWzBdXG4gICAgICAgICAgICBib2FyZF9uYW1lID0gYm9hcmQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgYnVzX2NsYXNzID0geHBhdGguc2VsZWN0KFwiQnVzXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgc3RvcmVfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJTdG9yZVwiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgIHdpcmVfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJXaXJlXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuXG4gICAgICAgICAgICBpZiBjbG9uZT9cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBuZXcgQm9hcmQoYm9hcmRfbmFtZSwgZ2xvYmFsW3dpcmVfY2xhc3NdLCBnbG9iYWxbYnVzX2NsYXNzXSwgZ2xvYmFsW3N0b3JlX2NsYXNzXSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBAXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmluaXQoKVxuXG4gICAgICAgICAgICBzeXNzID0geHBhdGguc2VsZWN0KFwic3lzdGVtXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHN5cyBpbiBzeXNzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHN5cy5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAga2xhc3MgPSBzeXMuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgICAgICBjb25mX25vZGUgPSB4cGF0aC5zZWxlY3QoXCJjb25maWd1cmF0aW9uXCIsIHN5cylbMF1cbiAgICAgICAgICAgICAgICBkYXRhX3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcIi8vcHJvcGVydHlcIiwgY29uZl9ub2RlKVxuICAgICAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcCA9IGRvbTJwcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcHNbZGF0YV9wcm9wLnNsb3RdID0gZGF0YV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuYWRkKFMobmFtZSksIGdsb2JhbFtrbGFzc10sIEQoZGF0YV9wcm9wcykpXG5cbiAgICAgICAgICAgIHdpcmVzID0geHBhdGguc2VsZWN0KFwiLy93aXJlXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHdpcmUgaW4gd2lyZXNcbiAgICAgICAgICAgICAgICBzb3VyY2VfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNvdXJjZVwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgb3V0bGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJvdXRsZXRcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHNpbmtfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNpbmtcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIGlubGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJpbmxldFwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuY29ubmVjdChzb3VyY2VfbmFtZSwgc2lua19uYW1lLCBvdXRsZXRfbmFtZSwgaW5sZXRfbmFtZSlcblxuICAgICAgICAgICAgcmV0dXJuIGJvYXJkX25ld1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB4bWwgPSAnPD94bWwgdmVyc2lvbiA9IFwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nXG4gICAgICAgICAgICBpZiBAc3ltYm9sP1xuICAgICAgICAgICAgICAgIGJvYXJkX25hbWUgPSBAc3ltYm9sLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uYW1lID0gXCJiXCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxib2FyZCBuYW1lPScje2JvYXJkX25hbWV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPEJ1cyBjbGFzcz0nI3tAYnVzLmNvbnN0cnVjdG9yLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxTdG9yZSBjbGFzcz0nI3tAc3RvcmUuY29uc3RydWN0b3IubmFtZX0nLz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPFdpcmUgY2xhc3M9JyN7QHdpcmVDbGFzcy5uYW1lfScvPlwiXG4gICAgICAgICAgICBmb3Igc3lzIGluIEBzeXN0ZW1zLnN5bWJvbHMoKVxuICAgICAgICAgICAgICAgIGlmIHN5cy5uYW1lIG5vdCBpbiBbXCJ3aXJlc1wiLCBcInN0b3JlXCJdXG4gICAgICAgICAgICAgICAgICAgIHhtbCArPSBzeXMub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICBmb3IgY29ubiBpbiBAd2lyZXMuc3ltYm9scygpXG4gICAgICAgICAgICAgICAgeG1sICs9IGNvbm4ub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2JvYXJkPlwiXG5cblxuICAgIGNvbm5lY3Q6IChzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQsIHN5bWJvbCkgLT5cbiAgICAgICAgd2lyZSA9IG5ldyBAd2lyZUNsYXNzKHRoaXMsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldClcbiAgICAgICAgaWYgIXN5bWJvbFxuICAgICAgICAgICAgbmFtZSA9IEBidXMuZ2Vuc3ltKFwid2lyZVwiKVxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAd2lyZXMuYmluZChzeW1ib2wsIHdpcmUpXG5cbiAgICAgICAgZm9yIHNvdXJjZV9vdXRsZXQgaW4gd2lyZS5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBzb3VyY2Vfb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHNvdXJjZV9vdXRsZXQub2JqZWN0LnB1c2goc3ltYm9sKVxuXG4gICAgcGlwZTogKHNvdXJjZSwgd2lyZSwgc2luaykgLT5cbiAgICAgICAgQGNvbm5lY3Qoc291cmNlLCBzaW5rLCB3aXJlKVxuXG4gICAgZGlzY29ubmVjdDogKG5hbWUpIC0+XG4gICAgICAgIHdpcmUgPSBAd2lyZShuYW1lKVxuICAgICAgICBAd2lyZXMudW5iaW5kKG5hbWUpXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICB3aXJlcyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgd2lyZXMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSB3aXJlc1xuXG5cbiAgICB3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLm9iamVjdChuYW1lKVxuXG4gICAgaGFzd2lyZTogKG5hbWUpIC0+XG4gICAgICAgIEB3aXJlcy5oYXMobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAYnVzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAYnVzLmhhcyhuYW1lKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN5c3RlbSA9IEBidXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5wdXNoKEBTVE9QKVxuICAgICAgICBAYnVzLnVuYmluZChuYW1lKVxuXG5leHBvcnRzLlN5bWJvbCA9IFN5bWJvbFxuZXhwb3J0cy5OYW1lU3BhY2UgPSBOYW1lU3BhY2VcbmV4cG9ydHMuUyA9IFNcbmV4cG9ydHMuRGF0YSA9IERhdGFcbmV4cG9ydHMuRCA9IERcbmV4cG9ydHMuU2lnbmFsID0gU2lnbmFsXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLkcgPSBHXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuc3RhcnQgPSBzdGFydFxuZXhwb3J0cy5zdG9wID0gc3RvcFxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5QYXJ0ID0gUGFydFxuZXhwb3J0cy5QID0gUFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuRSA9IEVcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuQyA9IENcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkJvYXJkID0gQm9hcmRcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9