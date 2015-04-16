AceEditor = React.createClass
    displayName: ->
        "AceEditor"

    getDefaultProps: ->
        name   : "brace-editor"
        mode   : "c_cpp"
        theme  : "monokai"
        value  : ""
        markers: []
        fontSize   : 12
        showGutter : true
        onChange   : null
        onLoad     : null
        maxLines   : null
        readOnly   : false
        highlightActiveLine : true
        showPrintMargin     : true

    markerIds: []

    componentDidMount: ->
        window.Range = ace.require("ace/range").Range
        @editor = ace.edit(@props.name)
        @editor.on("change", @onChange)
        @componentWillReceiveProps(@props)
        if @props.onLoad
            @props.onLoad(@editor)

    componentWillReceiveProps: (nextProps) ->
        {markers, name, mode, theme, fontSize, maxLines, readOnly, highlightActiveLine, setShowPrintMargin, value, showGutter, onLoad} = nextProps
        @editor = ace.edit(name)
        @editor.getSession().setMode("ace/mode/" + mode)
        @editor.setTheme("ace/theme/" + theme)
        @editor.setFontSize(fontSize)
        @editor.setOption("maxLines", maxLines)
        @editor.setOption("readOnly", readOnly)
        @editor.setOption("highlightActiveLine", highlightActiveLine)
        @editor.setOptions
            showLineNumbers: true
            enableBasicAutocompletion: true
            enableSnippets: false
            enableLiveAutocompletion: true
        @editor.setShowPrintMargin(setShowPrintMargin)
        for markerid in @markerIds
            @editor.getSession().removeMarker(markerid)
        @markerIds = []
        for marker in markers
            @markerIds.push @editor.getSession().addMarker(marker, "debug-highlight", "fullLine")
        if @editor.getValue() isnt value
            @editor.setValue(value)
        @editor.renderer.setShowGutter(showGutter)

    onChange: ->
        value = @editor.getValue()
        if @props.onChange
            @props.onChange(value)

    render: ->
        {name, className} = @props
        <div id={name} className={className}>
        </div>
