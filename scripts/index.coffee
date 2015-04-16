setCookie = (cname, cvalue) ->
    document.cookie = encodeURIComponent(cname) + "=" + encodeURIComponent(cvalue) + "; "

getCookie = (cname) ->
    name = encodeURIComponent(cname) + "="
    ca = document.cookie.split(';')
    for c in ca
        while c.charAt(0) is ' '
            c = c.substring(1)
        if c.indexOf(name) is 0
            return decodeURIComponent(c.substring(name.length, c.length))
    ""

VariablePanel = React.createClass
    displayName: "VariablePanel"
    render: ->
        mydebugger = @props.debugger
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody>
                {
                    vars = mydebugger.variable()
                    for v, i in vars
                        <tr key={i}>
                            <td>{v.name}</td>
                            <td>{v.type}</td>
                            <td>{v.value}</td>
                        </tr>
                }
            </tbody>
        </Table>

Main = React.createClass
    displayName: "Main"
    getInitialState: ->
        code: @defaultCode
        output: ""
        input: "5"
        status: "editing"
        markers: []

    defaultCode: """
        #include <iostream>
        int main() {
            int a;
            cin >> a;
            cout << a*10 << endl;
            return 0;
        }
        """

    componentDidMount: ->
        jQuery.hotkeys.options.filterInputAcceptingElements = false
        jQuery.hotkeys.options.filterContentEditable = false
        $(document).bind("keydown", "ctrl+s", @quickSave)
        $(document).bind("keydown", "ctrl+o", @quickLoad)

    onChange: (code) ->
        @setState
            code: code

    quickSave: (e) ->
        e.preventDefault()
        setCookie("code", @state.code)

    quickLoad: (e) ->
        e.preventDefault()
        @setState
            code: getCookie("code")

    run: (debug, e) ->
        e.preventDefault()
        code = @state.code
        input = @state.input
        @output = ""
        config =
            stdio:
                drain: ->
                    x = input
                    input = null
                    return x
                write: (s) =>
                    @output += s
                    @setState
                        output: @output
                    return
            debug: debug
        if debug
            @preDebug()
            @debugger = JSCPP.run(code, input, config)
            @startDebug()
        else
            @preRun()
            exitCode = JSCPP.run(code, input, config)
            @postRun(exitCode)

    preDebug: ->
        @codeBackup = @state.code
        @setState
            output: ""
            status: "debugging"

    startDebug: ->
        @setState
            code: @debugger.src
        @debug_stepinto()

    postDebug: (exitCode) ->
        exitInfo = "\nprogram exited with code #{exitCode}."
        @setState
            output: @output + exitInfo

    updateMarkers: ->
        s = @debugger.nextNode()
        marker = new Range(s.sLine-1,s.sColumn-1,s.sLine-1,s.sColumn)
        @setState
            markers: [marker]

    debug_continue: ->
        @debug_stepinto()

    debug_stepinto: ->
        done = @debugger.continue()
        if done isnt false
            @debug_stop()
            @postDebug(done.v)
        else
            @updateMarkers()

    debug_stepover: ->
        @debug_stepinto()

    debug_stepout: ->
        @debug_stepinto()

    debug_stop: ->
        @debugger = null
        @setState
            status: "editing"
            code: @codeBackup
            markers: []

    preRun: ->
        @setState
            output: ""
            status: "running"
        @timer = new Date().getTime()

    postRun: (exitCode) ->
        if @timer
            ellaps = new Date().getTime() - @timer
            @timer = null
            exitInfo = "\nprogram exited with code #{exitCode} in #{ellaps}ms."
            @setState
                output: @output + exitInfo
                status: "editing"

    onChangeInput: (e) ->
        @setState
            input: @refs.input.getValue()

    onChangeOutput: (e) ->
        @setState
            output: @refs.output.getValue()

    render: ->
        {code, input, output, status, markers} = @state
        debugging = status is "debugging"
        editing = status is "editing"
        running = status is "running"
        brand =
            <a href="https://github.com/felixhao28/JSCPP" className="logo">
                JSCPP
            </a>
        <div>
            <Navbar brand={brand}>
                <Nav>
                    <DropdownButton title="File">
                        <MenuItem>Quick Open (Ctrl + O)</MenuItem>
                        <MenuItem>Quick Save (Ctrl + S)</MenuItem>
                    </DropdownButton>
                    <NavItem href="#" onClick={@run.bind @, false} disable={editing}>Run</NavItem>
                    <NavItem href="#" onClick={@run.bind @, true} disable={editing}>Debug</NavItem>
                </Nav>
            </Navbar>
            <Grid>
                {
                    if debugging
                        <Row className="debug-toolbar">
                            <Col md={12}>
                                <ButtonGroup>
                                    <Button disabled onClick={@debug_continue}>Continue</Button>
                                    <Button onClick={@debug_stepinto}>Step Into</Button>
                                    <Button disabled onClick={@debug_stepover}>Step Over</Button>
                                    <Button disabled onClick={@debug_stepout}>Step Out</Button>
                                    <Button onClick={@debug_stop}>Stop</Button>
                                </ButtonGroup>
                            </Col>
                        </Row>
                }
                <Row className="main-row">
                    <Col md={if debugging then 8 else 12}>
                        <AceEditor
                            ref="editor"
                            name="editor"
                            className="editor"
                            value={code}
                            onChange={@onChange}
                            theme="monokai"
                            readOnly={not editing}
                            markers={markers}
                        />
                    </Col>
                    {
                        if debugging
                            <Col md={4}>
                                <VariablePanel debugger=@debugger />
                            </Col>
                    }
                </Row>
                <Row className="io-row">
                    <Col md={6}>
                        <Input ref="input"
                            className="input-area"
                            type="textarea"
                            label="Standard Input"
                            rows={5}
                            value={input}
                            onChange={@onChangeInput}
                        />
                    </Col>
                    <Col md={6}>
                        <Input ref="output"
                            className="output-area"
                            type="textarea"
                            label="Standard Output"
                            rows={5}
                            value={output}
                            onChange={@onChangeOutput}
                        />
                    </Col>
                </Row>
            </Grid>
        </div>

React.render(<Main />, document.getElementById("mycontainer"))