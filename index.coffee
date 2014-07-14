uuid = require "node-uuid"

class Symbol

    constructor: (@name, @object, @ns, attrs) ->
        if attrs?
            @attrs(attrs)

    attrs: (kv) ->
        for k, v in kv
            @[k] = v

    toString: ->
       if @ns?
           return @ns.name + @ns.sep + @name
        else
           return @name

S = (name, object, ns, props) ->
    return new Symbol(name, object, ns, props)

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
        @symbols[name]

    object: (name) ->
        @symbols[name].object

    symbols: (name) ->
       symbols = []

       for k,v in @elements
           symbols.push(v)

       symbols

    objects: (name) ->
       objects = []

       for k,v in @elements
           objects.push(v.value)

       objects


class Data

    constructor: (props) ->
        if props?
            @props(props)

    props: (kv) ->
        for k, v in kv
            @[k] = v

D = (props) ->
    return new Data()


class Event extends Data

    constructor: (@name, @payload, props) ->
        super(props)

class Error extends Data

    constructor: (@name, @context, props) ->
        super(props)

class Token extends Data

    constructor: (@value, props)  ->
        super(props)

    stamp: (value) ->
        @value = value

T = (value, props) ->
    return new Token(value, props)

class Component extends Data

    constructor: (@name, props) ->
        super(name)


class Entity extends Data

    constructor: (@tags, props) ->
        @uuid = uuid.v4()
        @components = new NameSpace(name + ".components")
        super(props)

    add: (symbol, component) ->
        @components.bind(symbol, component)

    remove: (name) ->
        @components.unbind(name)

    part: (name) ->
        @components.symbol(name)


class Cell extends Entity

    constructor: (tags, props) ->
        super(tags, props)
        @observers= new NameSpace(name + ".observers")

    notify: (event) ->
       for ob in @observers.objects()
            ob.raise(event)

    add: (component) ->
        super component
        event = new Event("component-added", {component: component})
        @notify(event)

    remove: (name) ->
        super name
        event = new Event("component-removed", {component: component})
        @notify(event)

    observe: (symbol, discreteSystem) ->
        @observers.bind(symbol, discreteSystem)

    forget: (name) ->
        @observers.unbind(name)


class System

    constructor: (@flow, @conf) ->
        @inlets = new NameSpace("inlets")
        @inlets.bind([new Symbol("sysin")],[])
        @outlets = new NameSpace("outlets")
        @outlets.bind([new Symbol("sysout")],[])
        @outlets.bind([new Symbol("syserr")],[])

    inputValidator: (data, inlet) ->
        console.log(@symbol.name)
        console.log(data)
        data

    outputValidator: (data, outlet) ->
        console.log(@symbol.name)
        console.log(data)
        data

    push: (data, inlet_name) ->

        inlet_name = inlet_name || "sysin"

        validated_data = @inputValidator(data, "inlet")

        if validated_data instanceof Error
            @error(validated_data)
        else
            @process data, inlet_name

    process: (data, inlet_name) ->

    emit: (data, outlet_name) ->
        outlet_name = outlet || "sysout"

        validated_data = @outputValidator(data, outlet)

        if validated_data instanceof Error
            @error(validated_data)
            return

        for outlet in @outlets.objects()
            if outlet.name == outlet_name
                for connection in outlet.object
                    connection.object.transmit (data)

    error: (error) ->
        for outlet in @outlets.objects()
            if outlet.name == "syserr"
                for connection in outlet.object
                    connection.object.transmit (data)


class DiscreteSystem

    constructor: (@flow, @conf) ->

    raise: (event) ->


class GO extends DiscreteSystem

    constructor: (@flow, @conf) ->
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

    entity: (name) ->
        @entities.object(name)

    remove: (name) ->
        @entities.unbind(name)

    entityByID: (uuid) ->
        for entity in @entities.objects()
            if entity.uuid is uuid
                return entity

        return null

    removeById: (name) ->
        for entity_symbol in @entities.symbols()
            if entity_symbol.object is uuid
                @entities.unbind(entity_symbol.name)

        return null

    entitiesByTags: (tags) ->
        entities = []
        for entity in @entities.objects()
            for tag in tags
                if tag in entity.tags
                    entities.push entity

        return entities

class Bus

    constructor: ->
        @discreteSystems = new NameSpace("systems.discrete")

    add: (symbol, discreteSystemClass, conf) ->
        discrete_sytem = new discreteSystemClass(this, conf)
        @discreteSystems.bind(symbol, discrete_sytem)

    remove: (name) ->
        @discreteSystems.unbind(name)

    trigger: (event) ->
        for obj in @discreteSystems.objects()
                obj.raise(event)

class Flow

    constructor: () ->
        @bus = new Bus()
        @store = new Store()
        @systems = new NameSpace("systems")
        @connections = new NameSpace("systems.connections")

    connect: (source, sink, wire) ->

        name = "#{source}::#{wire.outlet}-#{sink}::#{wire.inlet}"
        symbol = new Symbol(name)
        connection = new Connection(source, sink, this, wire)
        @connections.bind(symbol, connection)

        for outlet in connection.source.outlets.symbols()
            if outlet.name is wire.outlet
                outlet.object.push(symbol)

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

    add: (symbol, systemClass, conf) ->
        system = new systemClass(this, conf)
        @systems.bind(symbol, system)

    system: (name) ->
        @systems.object(name)

    remove: (name) ->
        @systems.unbind(symbol, system)

exports.Symbol = Symbol
exports.S = S
exports.Token = Token
exports.T = T
exports.NameSpace = NameSpace
exports.System = System
exports.DiscreteSystem = DiscreteSystem
exports.Wire = Wire
exports.Connection = Connection
exports.Event = Event
exports.Entity = Entity
exports.Error = Error
exports.Bus = Bus
exports.Flow = Flow
exports.GO = GO

