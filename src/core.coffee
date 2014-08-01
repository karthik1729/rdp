uuid = require "node-uuid" 
lodash = require "lodash"
clone = require "clone"
xpath = require "xpath"
dom = require("xmldom").DOMParser
dom2prop = require("./helpers").dom2prop

class Symbol

    constructor: (@name, @object, @ns, attrs) ->
        if attrs?
            @attrs(attrs)

    attr: (k, v) ->
        if v?
            @[k] = v
            @[k]
        else
            @[k]

    op: (f, args...) ->
        return f.apply(this, args)

    attrs: (kv) ->
        for k, v in kv
            @[k] = v

    is: (symbol) ->
        if symbol.name is @name
            if symbol.object is @object
                return true
            if (symbol.object is null) and (@object is null)
                return true
        else
            return false

    toString: ->
       if @ns?
           return @ns.name + @ns.sep + @name
        else
           return @name


S = (name, object, ns, attrs) ->
    return new Symbol(name, object, ns, attrs)

# should be a set

class NameSpace

    constructor: (@name, sep) ->
        @elements = {}
        @sep = sep || "."
        @__gensym = 0

    bind: (symbol, object, class_name) ->
        symbol.class = class_name || object.constructor.name
        name = symbol.name
        symbol.object = object
        object.symbol = symbol
        @elements[name] = symbol
        symbol.ns = this
        symbol

    unbind: (name) ->
        symbol = @elements[name]
        delete @elements[name]
        symbol.ns = undefined
        symbol.object = undefined
        symbol.class = undefined

    symbol: (name) ->
        if @has(name)
            @elements[name]
        else
            S("NotFound")

    has: (name) ->
        if @elements[name]?
            return true
        else
            return false

    object: (name) ->
        if @has(name)
            @elements[name].object
        else
            G("NotFound")

    symbols: () ->
       symbols = []

       for k,v of @elements
           symbols.push(v)

       symbols

    objects: () ->
       objects = []

       for k,v of @elements
           objects.push(v.object)

       objects

    gensym: (prefix) ->
        prefix = prefix || "gensym"
        prefix + ":" + (@__gensym++)


class Data

    constructor: (props) ->
        @__slots = []
        if props?
            @props(props)

    is: (data) ->
        all_slots = @slots()
        for name in data.slots()
            if data.slot(name) != @slot(name)
                return false

        return true

    prop: (k, v) ->
        @slot(k,v)

    props: (kv) ->
        if kv
            for k, v of kv
                @[k] = v
                if k not in @slots()
                    @slots(k)
            return @validate()
        else
            properties = []
            for name in @slots()
                properties.push(@[name])
            return properties

    slots: (name) ->
        if name?
            @__slots.push(name)
        else
            @__slots

    slot: (name, value) ->
        if value?
            @[name] = value
            if name not in @slots()
                @slots(name)
            if @validate()
                return value
            else
                G("Invalid")
        else
            if @has(name)
                @[name]
            else
                G("NotFound")

    del: (name) ->
        if @has(name)
            slots_old = @__slots
            @__slots = []
            for n in slots_old
                if n != name
                    @__slots.push(n)

            delete @[name]


    has: (name) ->
        if name in @slots()
            return true
        else
            return false

    validate: ->
        true

    __serialize_scalar: (scalar) ->
        xml = ""
        if Array.isArray(scalar)
            type = "array"
            xml += "<scalar type='#{type}'>"
            xml += "<list>"
            for e in scalar
                xml += @__serialize_scalar(e)
            xml += "</list>"
            xml += "</scalar>"
        else
            type = typeof scalar
            xml += "<scalar type='#{type}'>#{scalar.toString()}</scalar>"
        xml

    init: (xml) ->
        doc = new dom().parseFromString(xml)
        props = xpath.select("property", doc)
        for prop in props
            data_prop = dom2prop(prop)
            @prop(data_prop.slot, data_prop.value)


    serialize: ->
        xml = ""
        for name in @slots()
            xml += "<property slot='#{name}'>"
            scalar  = @slot(name)
            xml += @__serialize_scalar(scalar)
            xml += '</property>'
        xml

D = (props) ->
    return new Data(props)

class Signal extends Data

    constructor: (name, payload, props) ->
        props = props || {}
        props.name = name
        props.payload = payload
        super(props)

class Event extends Signal

    constructor: (name, payload, props) ->
        props = props || {}
        pops.ts = new Date().getTime()
        super(name, payload, props)

class Glitch extends Data

    constructor: (name, context, props) ->
        props = props || {}
        props.name = name
        props.contenxt = context
        super(props)

G = (name, props) ->
    return new Glitch(name, props)

class Token extends Data

    constructor: (value, sign, props)  ->
        super(props)
        @signs = []
        @values = []
        if value?
            @stamp(sign, value)

    is: (t) ->
        false

    value: ->
        @prop("value")

    stamp_by: (index) ->
        if index?
           if @signs[index]?
               return @signs[index]
            else
               return S("NotFound")

        if @signs.length > 0
           return @signs[@signs.length - 1]
        else
           return S("NotFound")

    stamp: (sign, value) ->
        if value?
            if @has("value")
                old_value = @prop("value")
                @del("value")
                @del(value)
            @prop("value", value)
            if typeof value is "string"
                @prop(value, true)
            @values.push(value)
        if sign
            @signs.push(sign)
        else
            @signs.push(S("Unknown"))


start = (sign, props) ->
    return new Token("start", sign, props)

stop = (sign, props) ->
    return new Token("stop", sign, props)

T = (value, sign, props) ->
    return new Token(value, sign, props)

class Part extends Data

    constructor: (@name, props) ->
        super(props)

    serialize: ->
        xml += "<part name='#{@name}'>"
        xml += super()
        xml += '</part>'

P = (name, props) ->
    return new Part(name, props)

class Entity extends Data

    constructor: (tags, props) ->
        @parts = new NameSpace("parts")
        props = props || {}
        props.id = props.id || uuid.v4()
        props.ts = props.ts || new Date().getTime()
        tags = tags || props.tags || []
        props.tags = tags
        super(props)

    add: (symbol, part) ->
        @parts.bind(symbol, part)

    remove: (name) ->
        @parts.unbind(name)

    hasPart: (name) ->
        @parts.has(name)

    part: (name) ->
        @parts.symbol(name)

    serialize: ->
        xml = "<entity>"
        xml += '<parts>'
        for part of @parts.objects()
            xml += part.serialize()
        xml += '</parts>'
        xml += super()
        xml += '</entity>'

E = (tags, props) ->
    return new Entity(tags, props)

class Cell extends Entity

    constructor: (tags, props) ->
        super(tags, props)
        @observers= new NameSpace("observers")

    notify: (event) ->
       for ob in @observers.objects()
            ob.interrupt(event)

    add: (part) ->
        super part
        event = new Event("part-added", {part: part, cell: this})
        @notify(event)

    remove: (name) ->
        super name
        event = new Event("part-removed", {part: part, cell: this})
        @notify(event)

    observe: (symbol, system) ->
        @observers.bind(symbol, system)

    forget: (name) ->
        @observers.unbind(name)

    step: (fn, args...) ->
        return fn.apply(this, args)

    clone: () ->
        return clone(this)

C = (tags, props) ->
    return new Cell(tags, props)

class System

    constructor: (@b, conf) ->
        @inlets = new NameSpace("inlets")
        @inlets.bind(new Symbol("sysin"),[])
        @inlets.bind(new Symbol("feedback"),[])
        @outlets = new NameSpace("outlets")
        @outlets.bind(new Symbol("sysout"),[])
        @outlets.bind(new Symbol("syserr"),[])
        @outlets.bind(new Symbol("debug"),[])

        @conf = conf || D()
        @state = []
        @r = {}

    top: (index) ->
        if index?
            if @state[index]?
                return @state[index]
            else
                return S("NotFound")

        if @state.length > 0
            return @state[@state.length - 1]
        else
            return S("NotFound")

    input: (data, inlet) ->
        data

    output: (data, outlet) ->
        data

    STOP: (stop_token) ->

    push: (data, inlet) ->
        @b.mirror.relay("push", @symbol.name, data, inlet)

        inlet = inlet || @inlets.symbol("sysin")

        input_data = @input(data, inlet)

        if input_data instanceof Glitch
            @error(input_data)
        else
            @process input_data, inlet

    goto_with: (inlet, data) ->
        @push(data, inlet)

    process: (data, inlet) ->

    dispatch: (data, outlet) ->
        for ol in @outlets.symbols()
            if ol.name == outlet.name
                for wire in ol.object
                    wire.object.transmit data

    emit: (data, outlet) ->
        outlet = outlet || @outlets.symbol("sysout")

        output_data = @output(data, outlet)

        if output_data instanceof Glitch
            @error(output_data)
            return

        @dispatch(output_data, outlet)

    debug: (data) ->
        @dispatch(data, @outlets.symbol("debug"))

    error: (data) ->
        @dispatch(data, @outlets.symbol("syserr"))

    interrupt: (signal) ->
        @b.mirror.relay("interrupt", @symbol.name, signal)
        @react(signal)

    react: (signal) ->

    show: (data) ->

    serialize: ->
        xml = "<system name='#{@symbol.name}' class='#{@symbol.class}'>"
        xml += "<configuration>"
        xml += @conf.serialize()
        xml += "</configuration>"
        xml += "</system>"
        xml


class Wire

    constructor: (@b, source, sink, outlet, inlet) ->
        outlet = outlet || "sysout"
        inlet = inlet || "sysin"
        @source = @b.systems.symbol(source)
        @sink = @b.systems.symbol(sink)
        @outlet = @source.object.outlets.symbol(outlet)
        @inlet = @sink.object.inlets.symbol(inlet)

    transmit: (data) ->
        @sink.object.push(data, @inlet)

    serialize: ->
        xml = ""
        xml += "<wire name='#{@symbol.name}'>"
        xml += "<source name='#{@source.name}'/>"
        xml += "<outlet name='#{@outlet.name}'/>"
        xml += "<sink name='#{@sink.name}'/>"
        xml += "<inlet name='#{@inlet.name}'/>"
        xml += "</wire>"
        xml



class Store

    constructor: ->
        @entities = new NameSpace("entities")

    add: (entity) ->
        symbol = S(entity.id)
        @entities.bind(symbol, entity)
        entity

    snapshot: () ->
        xml = '<?xml version = "1.0" standalone="yes"?>'
        xml += "<snapshot>"
        for entity in @entities.objects()
            xml += entity.serialize()
        xml += "</snapshot>"
        return xml

    op: (f, args...) ->
        return f.apply(this, args)

    recover: (xml) ->
        doc = new dom().parseFromString(xml)
        entities = xpath.select("//entity", doc)
        entities_list = []
        for entity in entities
            entity_props = {}
            props = xpath.select("property", entity)
            for prop in props
                entity_prop = dom2prop(prop)
                entity_props[entity_prop.slot] = entity_prop.value

            new_entity = new Entity(null, entity_props)

            parts = xpath.select("part", entity)
            for part in parts
                name = part.getAttribute("name")
                part_props = {}
                props = xpath.select("property", part)
                for prop in props
                    part_prop = dom2prop(prop)
                    part_props[part_prop.slot] = part_prop.value
                entity_part = new Part(name, part_props)
                new_entity.add(entity_part)

            entities_list.push(new_entity)

        @entities = new NameSpace("entities")
        for entity in entities_list
            @add(entity)

    has: (id) ->
        @entities.has(id)

    entity: (id) ->
        @entities.object(id)

    remove: (id) ->
        @entities.unbind(id)

    by_prop: (prop) ->
        entities = []
        for entity in @entities.objects()
            if entity.has(prop.slot)
                entity_value = entity.slot(prop.slot)
                if Array.isArray(entity_value)
                    if prop.value in entity_value
                        entities.push(entity)
                else if entity_value is prop.value
                    entities.push(entity)

        if entities.length > 0
            return entities
        else
            G("NotFound")

    first_by_prop: (prop) ->
        entities = @by_prop(prop)
        if entities instanceof Glitch
            return entities
        else
            entities[0]

    by_tags: (tags) ->
        entities = []
        for entity in @entities.objects()
            for tag in tags
                if tag in entity.tags
                    entities.push entity

        if entities.length > 0
            return entities
        else
            G("NotFound")

    first_by_tags: (tags) ->
        entities = @by_tags(tags)
        if entities instanceof Glitch
            return entities
        else
            entities[0]


class Bus extends NameSpace

    constructor: (@name, sep) ->
        super(@name, sep)

    trigger: (signal) ->
        for obj in @objects()
            if obj instanceof System
                obj.interrupt(signal)

class Mirror
    constructor: (@b) ->

    reflect: (op, system, args...) ->
        sys = @b.systems.object(system)
        sys[op].apply(sys, args)

    relay: (op, system, args...) ->

class Board

    constructor: (wireClass, busClass, storeClass, mirrorClass ) ->
        @wireClass = wireClass || Wire
        @busClass = busClass || Bus
        @storeClass = storeClass || Store
        @mirrorClass = mirrorClass || Mirror
        @init()

    init: ->
        @bus = new @busClass("bus")
        @store = new @storeClass()
        @mirror = new @mirrorClass(this)
        @systems = @bus
        @wires = new NameSpace("wires")

        @bus.bind(S("store"), @store)
        @bus.bind(S("wires"), @wires)

    setup: (xml, clone) ->
        if xml?
            doc = new dom().parseFromString(xml)
            board = xpath.select("board", doc)[0]
            board_name = board.getAttribute("name")
            bus_class = xpath.select("Bus", board)[0].getAttribute("class")
            store_class = xpath.select("Store", board)[0].getAttribute("class")
            wire_class = xpath.select("Wire", board)[0].getAttribute("class")

            if clone?
                board_new = new Board(board_name, global[wire_class], global[bus_class], global[store_class])
            else
                board_new = @
                board_new.init()

            syss = xpath.select("system", board)
            for sys in syss
                name = sys.getAttribute("name")
                klass = sys.getAttribute("class")
                conf_node = xpath.select("configuration", sys)[0]
                data_props = {}
                props = xpath.select("//property", conf_node)
                for prop in props
                    data_prop = dom2prop(prop)
                    data_props[data_prop.slot] = data_prop.value

                board_new.add(S(name), global[klass], D(data_props))

            wires = xpath.select("//wire", board)
            for wire in wires
                source_name = xpath.select("source", wire)[0].getAttribute("name")
                outlet_name = xpath.select("outlet", wire)[0].getAttribute("name")
                sink_name = xpath.select("sink", wire)[0].getAttribute("name")
                inlet_name = xpath.select("inlet", wire)[0].getAttribute("name")

                board_new.connect(source_name, sink_name, outlet_name, inlet_name)

            return board_new
        else
            xml = '<?xml version = "1.0" standalone="yes"?>'
            if @symbol?
                board_name = @symbol.name
            else
                board_name = "b"
            xml += "<board name='#{board_name}'>"
            xml += "<Bus class='#{@bus.constructor.name}'/>"
            xml += "<Store class='#{@store.constructor.name}'/>"
            xml += "<Wire class='#{@wireClass.name}'/>"
            for sys in @systems.symbols()
                if sys.name not in ["wires", "store"]
                    xml += sys.object.serialize()
            for conn in @wires.symbols()
                xml += conn.object.serialize()
            xml += "</board>"


    connect: (source, sink, outlet, inlet, symbol) ->
        wire = new @wireClass(this, source, sink, outlet, inlet)
        if !symbol
            name = @bus.gensym("wire")
            symbol = new Symbol(name)
        @wires.bind(symbol, wire)

        for source_outlet in wire.source.object.outlets.symbols()
            if source_outlet.name is wire.outlet.name
                source_outlet.object.push(symbol)

    pipe: (source, wire, sink) ->
        @connect(source, sink, wire)

    disconnect: (name) ->
        wire = @wire(name)
        @wires.unbind(name)

        for outlet in wire.source.object.outlets.symbols()
            if outlet.name is wire.outlet.name
                wires = []
                for conn in outlet.object
                    if conn.name != name
                        wires.push(conn)
                outlet.object = wires


    wire: (name) ->
        @wires.object(name)

    haswire: (name) ->
        @wires.has(name)

    add: (symbol, systemClass, conf) ->
        system = new systemClass(this, conf)
        @bus.bind(symbol, system)

    has: (name) ->
        @bus.has(name)

    system: (name) ->
        @bus.object(name)

    remove: (name) ->
        system = @bus.object(name)
        system.push(@STOP)
        @bus.unbind(name)

exports.Symbol = Symbol
exports.NameSpace = NameSpace
exports.S = S
exports.Data = Data
exports.D = D
exports.Signal = Signal
exports.Event = Event
exports.Glitch = Glitch
exports.G = G
exports.Token = Token
exports.start = start
exports.stop = stop
exports.T = T
exports.Part = Part
exports.P = P
exports.Entity = Entity
exports.E = E
exports.Cell = Cell
exports.C = C
exports.System = System
exports.Wire = Wire
exports.Store = Store
exports.Bus = Bus
exports.Mirror = Mirror
exports.Board = Board

