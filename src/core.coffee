uuid = require "node-uuid"
clone = require "clone"

xpath = require('xpath')
dom = require('xmldom').DOMParser

class Symbol

    constructor: (@name, @object, @ns, attrs) ->
        if attrs?
            @attrs(attrs)

    full_name: ->
       if @ns?
           return @ns.name + @ns.sep + @name
        else
           return @name

    attr: (k, v) ->
        if v
            @[k] = v
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


S = (name, object, ns, attrs) ->
    return new Symbol(name, object, ns, attrs)

# should be a set

class NameSpace

    constructor: (@name, sep) ->
        @elements = {}
        @sep = sep || "."

    bind: (symbol, object) ->
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
        symbol

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


class Data

    constructor: (props) ->
        @__slots = []
        if props?
            @props(props)

    is: (data) ->
        all_slots = @slots()
        for name in data.slots()
            if data.slot(name) is not @slot(name)
                return false

        return true

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
        if name
            @__slots.push(name)
        else
            @__slots

    slot: (name, value) ->
        if value
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
        @stamp(sign, value)

    is: (t) ->
        false

    value: ->
        @value

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
        if value
            if @[value]
                delete @[value]
            @value = value
            if typeof @value is "string"
                @[@value] = true
        if sign?
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
            ob.raise(event)

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

    constructor: (@b, @conf) ->
        @inlets = new NameSpace("inlets")
        @inlets.bind(new Symbol("sysin"),[])
        @inlets.bind(new Symbol("feedback"),[])
        @outlets = new NameSpace("outlets")
        @outlets.bind(new Symbol("sysout"),[])
        @outlets.bind(new Symbol("syserr"),[])

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
                for connection in ol.object
                    connection.object.transmit data

    emit: (data, outlet) ->
        outlet = outlet || @outlets.symbol("sysout")

        output_data = @output(data, outlet)

        if output_data instanceof Glitch
            @error(output_data)
            return

        @dispatch(output_data, outlet)


    error: (data) ->
        @dispatch(data, @outlets.symbol("syserr"))

    raise: (signal) ->
        @react(signal)

    interrupt: (signal) ->
        @react(signal)

    react: (signal) ->

    show: (data) ->


class Wire

    constructor: (@outlet, @inlet) ->


class Connection

    constructor: (@source, @sink, @b, @wire) ->


    transmit: (data) ->
        @sink.object.push(data, @wire.inlet)


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

    __process_scalar: (scalar) ->
        type = scalar.getAttribute("type")
        text = scalar.textContent
        if type is "number"
            value = Number(text)
        else if type is "string"
            value = String(text)
        else if type is "boolean"
            value = Boolean(text)
        else if type is "array"
            list_scalars = xpath.select("list/scalar", scalar)
            value = []
            for el in list_scalars
                el_value = @__process_scalar(el)
                value.push(el_value)

        return value

    __process_prop: (prop) ->
        entity_prop = {}
        slot = prop.getAttribute("slot")
        scalar = xpath.select("scalar", prop)
        value = @__process_scalar(scalar[0])
        entity_prop.slot = slot
        entity_prop.value = value
        entity_prop

    recover: (xml) ->
        doc = new dom().parseFromString(xml)
        entities = xpath.select("//entity", doc)
        entities_list = []
        for entity in entities
            entity_props = {}
            props = xpath.select("property", entity)
            for prop in props
                entity_prop = @__process_prop(prop)
                entity_props[entity_prop.slot] = entity_prop.value

            new_entity = new Entity(null, entity_props)

            parts = xpath.select("part", entity)
            for part in parts
                name = part.getAttribute("name")
                part_props = {}
                props = xpath.select("property", part)
                for prop in props
                    part_prop = @__process_prop(prop)
                    part_props[part_prop.slot] = part_prop.value
                entity_part = new Part(name, part_props)
                new_entity.add(entity_part)

            entities_list.push(new_entity)

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
                if entity.slot(prop.slot) is prop.value
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
                obj.raise(signal)

class Board

    constructor: (name, connectionClass, storeClass, busClass) ->
        storeClass = storeClass || Store
        busClass = busClass || Bus

        @connectionClass = connectionClass || Connection
        @store = new storeClass()
        @connections = new NameSpace("bus.connections")

        @bus = new busClass("systems")
        @systems = @bus
        @bus.bind(S("connections"),  @connections)
        @bus.bind(S("store"), @store)

    connect: (source, sink, wire, symbol) ->
        source = @systems.symbol(source)
        sink = @systems.symbol(sink)
        wire = wire || new Wire(source.object.outlets.symbol("sysout"), sink.object.inlets.symbol("sysin"))
        connection = new @connectionClass(source, sink, this, wire)
        if !symbol
            name = "#{source}::#{connection.wire.outlet.name}-#{sink}::#{connection.wire.inlet.name}"
            symbol = new Symbol(name)
        @connections.bind(symbol, connection)

        for outlet in connection.source.object.outlets.symbols()
            if outlet.name is connection.wire.outlet.name
                outlet.object.push(symbol)

    pipe: (source, wire, sink) ->
        @connect(source, sink, wire)

    disconnect: (name) ->
        connection = @connection(name)
        @connections.unbind(name)

        for outlet in connection.source.object.outlets.symbols()
            if outlet.name is connection.wire.outlet.name
                connections = []
                for conn in outlet.object
                    if conn.name != name
                        connections.push(conn)
                outlet.object = connections


    connection: (name) ->
        @connections.object(name)

    hasConnection: (name) ->
        @connections.has(name)

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
exports.Connection = Connection
exports.Store = Store
exports.Bus = Bus
exports.Board = Board

