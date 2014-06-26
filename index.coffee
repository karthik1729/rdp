class System

    constructor:(@name, @flow) ->
        @handlers = null

    # just data for single inlet
    push: (data, inlet) ->

    whenReady: (handler, outlet) ->

        if not outlet
            if @handlers
                @handlers.push(handler)
            else
               @handlers = [handler]

        else
            if @handlers.outlet is null
                @handlers.outlet = [handler]
            else
                @handlers.outlet.push handler

    emit: (data, outlet) ->

        if not outlet
            for handler in @handlers
                handler(data)
        else
            for handler in @handlers[outlet]
                handler(data)

    serialize: ->
        """
        <system name="#{@name}" />
        """

class Channel

    constructor: (@inlet, @outlet) ->

    serialize: ->
        "<channel inlet='#{@inlet}', outlet='#{@outlet}'/>"

class Connection

    constructor: (@name, @flow, source, sink, @channels) ->
        @source = @flow.getSystem(source)
        @sink = @flow.getSystem(sink)

    serialize: ->
            xml = """
            <connection name='#{@name}'>
                #{@source.serialize()}
                #{@sink.serialize()}
            """

            if @channels
                xml += "<channels>"
                for channel in @channels
                    xml += channel.serialize()
                xml += "</channels>"

            xml += "</connection>"

class Message

    constructor: (@event, @payload) ->

class StateBus

    constructor: ->
        @entities = {}
        @discreteSystems = {}

    addEntity: (entity) ->
        @entities[entiy.name] = entity

    getEntity: (name, create) ->
        if @entities[name]
            return @entities[name]
        else if create
            @entities[name] = {}
            return @entities[name]
        else
            return null

    addDiscreteSystem: (discrete_system, events) ->

        for event in events

            if @discreteSystems[event].systems is null
                @discreteSystems[event].systems = [discrete_system]
            else
                @discreteSystems[event].systems.append(discrete_system)

        trigger: (event, message) ->

            for system in @discreteSystems[event]
                message =- Message(event, message)
                system.raise(message)

class Flow

    constructor: ->

        # could be a ordered map
        @connections = []
        @bus = new StateBus
        @systems = {}

    addSystem: (system) ->
        @systems[system.name] = system

    getSystem: (name) ->
        @systems[name]

    addConnection: (connection) ->
        @connections.push(connection)

    serialize: ->
        xml = "<xml>"
        xml += "<flow name='#{@name}'>"

        for connection in @connections
            xml += "<connection>"
            xml += connection.serialize()
            xml += "</connection>"

        xml = "</flow>"
        xml = "</xml>"

    log: (x) ->
        console.log(x)

    start: ->

        for connection in @connections

            A = connection.source
            B = connection.sink

            this.log("#{A.name} -- #{B.name}")

            if connection.channels
                for channel in connection.channels
                    A.whenReady(((data) ->
                        B.push(inlet, data)),
                        A.channel.outlet)
            else
                A.whenReady (data) ->
                    B.push(data)


exports.System = System
exports.Channel = Channel
exports.Connection = Connection
exports.Message = Message
exports.StateBus = StateBus
exports.Flow = Flow

