uuid = require "node-uuid"

class NameSpace

    constructor: (@name, sep) ->
        @names = []
        @symbols = {}
        @sep = sep || "."

    intern: (symbol) ->
        if not @symbols[symbol.name]
            @names.push(symbol.name)
            @symbols[symbol.name] = symbol
        else
            @symbols[symbol.name] = symbol

        symbol.ns = this

    unintern: (symbol) ->
        delete @symbols[symbol.name]
        @names = (item for item in @names when item != symbol.name)
        symbol.ns = undefined

    getSymbol: (name) ->
        @symbols[name]

    get: (name) ->
        @symbols[name].value

    allSymbols: () ->
        symbols = []

        for name in @names
            symbols.push(@symbols[name])

        return symbols

    all: () ->
        values = []

        for name in @names
            values.push(@symbols[name].value)

        return values


class Symbol

    constructor: (@name, @value, @ns) ->
        @uuid = uuid.v4()

    is: (symbol, deep) ->
       equality = {
           names: -1
           namespaces: -1
           attrs: -1
       }

       if @name == symbol.name
           equality.names = 1

       if !@ns
           equality.namespaces = 1
       else if @ns and @ns.id is symbol.id
           equality.namespaces = 1

       equality.attrs = 1

       for k,v in this
           if v != symbol[k]
               equality.attrs = -1

       if deep
           if equality.names == 1 and equality.namespaces ==1 and equality.attrs == 1
               return true
       else
           if equality.names == 1 and equality.namespaces ==1
               return true

       return false

    toString: ->
       if @ns
           return @ns.id + @ns.sep + @name
        else
           return @name

S = (name) ->
    return new Symbol(name)


class Token extends Symbol

    constructor: (@name) ->
        @append(@name)

    append: (@name) ->
        @value = @name
        if typeof @name is "string"
            this[@name] = true


T = (name) ->
    return new Token(name)

class Event extends Symbol

    constructor: (@name, @payload) ->

class Entity extends Symbol

    constructor: (@name, @tags, @value) ->

class Component extends Symbol

    constructor: (@name, attrs) ->
        for k, v in attrs
            this[k] = v

class System

    constructor:(@flow, @options) ->
        @handlers = null

    push: (data, inlet) ->

    # just data for single inlet
    whenReady: (handler, outlet) ->

        if not outlet
            if @handlers
               @handlers.push(handler)
            else
               @handlers = [handler]

        else
            if @handlers
                @handlers.outlet.push(handler)
            else
                @handlers.outlet = [handler]



    emit: (data, outlet) ->
        if not outlet
            for handler in @handlers
                handler(data)
        else
            for handler in @handlers[outlet]
                handler(data)

class DiscreteSystem

    constructor: (@flow, @events) ->

    raise: (event) ->

class Channel

    constructor: (@inlet, @outlet) ->

class Connection

    constructor: (source, sink, @flow, @channels) ->
        @source = @flow.systems.get(source)
        @sink = @flow.systems.get(sink)


class Bus

    constructor: ->
        @entities = new NameSpace("bus.entities")
        @discreteSystems = new NameSpace("bus.systems")

    addDiscreteSystem: (id, discreteSystemClass) ->
        discrete_sytem = new discreteSystemClass(this)
        id.value = discrete_sytem
        @discreteSystems.intern(id)

    createEntity: (name, tags, value) ->
        tags = tags || []
        value = value || undefined
        entity = new Entity(name, tags, value)
        @entities.intern(entity)
        entity

    getEntity: (name, value) ->
        if @entities.getSymbol(name)
            return @entities.getSymbol(name)
        else if value
            return @createEntity(name, value)
        else
            return null

    getEntitiesByTags: (tags) ->
        entities = []
        for entity in @entities.allSymbols()
            for tag in tags
                if tag in entity.tags
                    entities.push entity

        return entities


    trigger: (event) ->

        for symbol in @discreteSystems.allSymbols()
            if event.name in symbol.events
                symbol.value.raise(event)

class Flow

    constructor: (@id) ->
        @bus = new Bus
        @systems = new NameSpace("systems")
        @connections = new NameSpace("systems.connections")
        @views = new NameSpace("systems.views")

    connect: (id, source, sink, channels) ->
        connection = new Connection(source, sink, this, channels)

        if connection.channels
            for channel in connection.channels
                connection.source.whenReady((((data) ->
                    connection.sink.push.call(connection.sink, channel.inlet, data))),
                    channel.outlet)
        else
            connection.source.whenReady(((data) ->
                connection.sink.push(data)))

        if !id.name
            id.name = "#{source}-#{sink}"

        id.value = connection
        @connections.intern(id)

    addSystem: (id, systemClass, options) ->
        system = new systemClass(this, options)
        id.value = system
        @systems.intern(id)

    addView: (id, viewClass, options) ->
        view = new viewClass(this, options)
        id.value = view
        @views.intern(id)


class GO

    constructor: (@flow, options) ->
    show: (data) ->
    interact: (data) ->

exports.Symbol = Symbol
exports.S = S
exports.Token = Token
exports.T = T
exports.NameSpace = NameSpace
exports.System = System
exports.DiscreteSystem = DiscreteSystem
exports.Channel = Channel
exports.Connection = Connection
exports.Event = Event
exports.Entity = Entity
exports.Bus = Bus
exports.Flow = Flow
exports.GO = GO

