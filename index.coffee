uuid = require "node-uuid"
clone = require "clone"
mixins = require "./lib/mixins.js"

class Symbol

    constructor: (@name, @object, @ns, attrs) ->
        if attrs?
            @attrs(attrs)

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
        @elements[name]

    has: (name) ->
        if @elements[name]?
            return true
        else
            return false

    object: (name) ->
        @elements[name].object

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
        if props?
            @props(props)

    props: (kv) ->
        for k, v of kv
            @[k] = v
        @validator

    validator: ->
        this

D = (props) ->
    return new Data()

class Signal extends Data

    constructor: (@name, @payload, props) ->
        super(props)

class Event extends Signal

    constructor: (name, payload, props) ->
        super(name, message, props)
        @ts = new Date().getTime()

class Glitch extends Data

    constructor: (@name, @context, props) ->
        super(props)

class Token extends Data

    constructor: (value, sign, props)  ->
        super(props)
        @signs = []
        @stamp(sign, value)

    by: ->
       if @signs.length > 0
           @signs[@signs.length - 1]
       else
           S("Unknown")

    stamp: (sign, value) ->
        if value
            if @[value]
                delete @[value]
            @value = value
            if typeof @value is "string"
                @[@value] = true
        if sign?
            @signs.push(value, sign)
        else
            @signs.push(S("Unknown"))


class StopToken extends Token

    constructor: (sign, props) ->
        super("stop", sign, props)

T = (value, props) ->
    return new Token(value, props)

class Component extends Data

    constructor: (@name, props) ->
        super(name)


class Entity extends Data

    constructor: (@tags, props) ->
        @id = uuid.v4()
        @components = new NameSpace("components")
        super(props)

    add: (symbol, component) ->
        @components.bind(symbol, component)

    remove: (name) ->
        @components.unbind(name)

    has: (name) ->
        @components.has(name)

    part: (name) ->
        @components.symbol(name)



class Cell extends Entity

    constructor: (tags, props) ->
        super(tags, props)
        @observers= new NameSpace("observers")

    notify: (event) ->
       for ob in @observers.objects()
            ob.raise(event)

    add: (component) ->
        super component
        event = new Event("component-added", {component: component, cell: this})
        @notify(event)

    remove: (name) ->
        super name
        event = new Event("component-removed", {component: component, cell: this})
        @notify(event)

    observe: (symbol, system) ->
        @observers.bind(symbol, system)

    forget: (name) ->
        @observers.unbind(name)

    step: (fn, args...) ->
        return fn.apply(this, args)

    clone: () ->
        return clone(this)


class System

    constructor: (@flow, @conf) ->
        @inlets = new NameSpace("inlets")
        @inlets.bind(new Symbol("sysin"),[])
        @inlets.bind(new Symbol("feedback"),[])
        @outlets = new NameSpace("outlets")
        @outlets.bind(new Symbol("sysout"),[])
        @outlets.bind(new Symbol("syserr"),[])

        @state = []
        @registers = {}

    top: ->
        if @state.length > 0
            @state[@state.length - 1]
        else
            S("Unknown")

    inputValidator: (data, inlet) ->
        data

    outputValidator: (data, outlet) ->
        data

    STOP: (stop_token)->

    push: (data, inlet_name) ->

        if data instanceof StopToken
            @STOP(data)
            return

        inlet_name = inlet_name || "sysin"

        validated_data = @inputValidator(data, inlet_name)

        if validated_data instanceof Glitch
            @error(validated_data)
        else
            @process data, inlet_name

    goto: (inlet_name, data) ->
        @push(data, inlet_name)

    process: (data, inlet_name) ->
        @emit(data, "stdout")

    send: (data, outlet_name) ->
        for outlet in @outlets.symbols()
            if outlet.name == outlet_name
                for connection in outlet.object
                    connection.object.transmit data

    emit: (data, outlet_name) ->
        outlet_name = outlet_name || "sysout"

        validated_data = @outputValidator(data, outlet_name)

        if validated_data instanceof Glitch
            @error(validated_data)
            return

        @send(data, outlet_name)


    error: (data) ->
        @send(data, "syserr")

    raise: (signal) ->
        @react(signal)

    react: (signal) ->

    show: (data) ->


class Wire

    constructor: (@outlet, @inlet) ->


class Connection

    constructor: (source,  sink, @flow, wire) ->
        @source = @flow.systems.object(source)
        @sink = @flow.systems.object(sink)
        @wire = wire || new Wire("sysout", "sysin")

    transmit: (data) ->
        @sink.push(data, @wire.inlet)


class Store

    constructor: ->
        @entities = new NameSpace("entities")

    add: (symbol, tags, props) ->
        tags = tags || []
        entity = new Entity(tags, props)
        @entities.bind(symbol, entity)
        symbol

    has: (name) ->
        @entities.has(name)

    entity: (name) ->
        @entities.object(name)

    remove: (name) ->
        @entities.unbind(name)

    id: (id) ->
        for entity in @entities.objects()
            if entity.id is id
                return entity

        return null

    removeId: (id) ->
        for entity_symbol in @entities.symbols()
            if entity_symbol.object is id
                @entities.unbind(entity_symbol.name)

        return null

    tags: (tags) ->
        entities = []
        for entity in @entities.objects()
            for tag in tags
                if tag in entity.tags
                    entities.push entity

        return entities

class Bus extends NameSpace

    constructor: (@name, sep) ->
        super(@name, sep)

    trigger: (signal) ->
        for obj in @objects()
              console.log("sss")
              obj.raise(signal)

class Flow

    constructor: () ->
        @store = new Store()
        @bus = new Bus("systems")
        @systems = @bus
        @connections = new NameSpace("bus.connections")
        @STOP = new StopToken()

    connect: (source, sink, wire, symbol) ->

        connection = new Connection(source, sink, this, wire)
        if !symbol
            name = "#{source}::#{connection.wire.outlet}-#{sink}::#{connection.wire.inlet}"
            symbol = new Symbol(name)
        @connections.bind(symbol, connection)

        for outlet in connection.source.outlets.symbols()
            if outlet.name is connection.wire.outlet
                outlet.object.push(symbol)

    pipe: (source, wire, sink) ->
        @connect(source, sink, wire)

    disconnect: (name) ->
        connection = @connection(name)
        @connections.unbind(name)

        for outlet in connection.source.outlets.symbols()
            if outlet.name is wire.outlet
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
exports.Token = Token
exports.T = T
exports.Component = Component
exports.Entity = Entity
exports.Cell = Cell
exports.System = System
exports.Wire = Wire
exports.Connection = Connection
exports.Store = Store
exports.Bus = Bus
exports.Flow = Flow
exports.mixins = mixins

