const setCookie = (cname, cvalue) => document.cookie = encodeURIComponent(cname) + "=" + encodeURIComponent(cvalue) + "; ";

const getCookie = function (cname) {
    const name = encodeURIComponent(cname) + "=";
    const ca = document.cookie.split(';');
    for (let c of Array.from(ca)) {
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return decodeURIComponent(c.substring(name.length, c.length));
        }
    }
};

class VariablePanel extends React.Component {
    constructor() {
        super();
        this.displayName = "VariablePanel";
    }
    render() {
        const { vars, lastVars } = this.props;
        const lastVarsMap = {};
        for (const lastVar of lastVars) {
            lastVarsMap[lastVar.name] = lastVar;
        }
        return <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody>
                {
                    vars.map(v => {
                        const last = lastVarsMap[v.name]
                        const updated = last == null || last.value !== v.value || last.type !== v.type
                        return <tr key={v.name} className={updated && "updated-variable-item"}>
                            <td>{v.name}</td>
                            <td>{v.value}</td>
                            <td>{v.type}</td>
                        </tr>
                    })
                }
            </tbody>
        </Table>
    }
};


class Main extends React.Component {
    constructor() {
        super();
        this.defaultCode = `#include <iostream>
using namespace std;
int main() {
    int a;
    cin >> a;
    a += 7;
    cout << a*10 << endl;
    return 0;
}`;
        this.state = {
            code: this.defaultCode,
            output: "",
            input: "5",
            status: "editing",
            markers: [],
            vars: [],
            lastVars: [],
            busy: false
        };
        this.displayName = "Main";
    }

    componentDidMount() {
        jQuery.hotkeys.options.filterInputAcceptingElements = false;
        jQuery.hotkeys.options.filterContentEditable = false;
        $(document).bind("keydown", "ctrl+s", this.quickSave);
        $(document).bind("keydown", "ctrl+o", this.quickLoad);
    }

    onChange(code) {
        this.setState({
            code
        });
    }

    quickSave(e) {
        if (e != null) {
            e.preventDefault();
        }
        setCookie("code", this.state.code);
    }

    quickLoad(e) {
        if (e != null) {
            e.preventDefault();
        }
        this.setState({
            code: getCookie("code")
        });
    }

    handleError(e) {
        this.setState({
            output: this.output + "\n" + e
        });
    }

    run(debug, e) {
        e.preventDefault();
        const {
            code
        } = this.state;
        let {
            input
        } = this.state;
        this.output = "";
        this.runningInWorker = false;
        const config = {
            stdio: {
                drain() {
                    const x = input;
                    input = null;
                    return x;
                },
                write: s => {
                    this.output += s;
                    this.setState({
                        output: this.output
                    });
                }
            },
            debug
        };
        if (debug) {
            this.preDebug();
            try {
                this.debugger = JSCPP.run(code, input, config);
                return this.startDebug();
            } catch (error) {
                e = error;
                this.handleError(e);
                return this.debug_stop();
            }
        } else {
            this.preRun();
            try {
                const exitCode = JSCPP.run(code, input, config);
                return this.postRun(exitCode);
            } catch (error1) {
                e = error1;
                this.handleError(e);
                return this.setState({
                    status: "editing"
                });
            }
        }
    }

    async runInWorker(debug, e) {
        e.preventDefault();
        const {
            code
        } = this.state;
        let {
            input
        } = this.state;
        this.output = "";
        this.runningInWorker = true;
        const config = {
            stdio: {
                write: s => {
                    this.output += s;
                    this.setState({
                        output: this.output
                    });
                }
            },
            debug
        };
        if ((this.worker == null)) {
            this.debugger = new JSCPP.AsyncWebWorkerHelper("./dist/JSCPP.js");
        }
        if (debug) {
            this.preDebug();
            try {
                await this.debugger.run(code, input, config);
                await this.startDebug();
            } catch (error) {
                e = error;
                this.handleError(e);
                this.debug_stop();
            }
        } else {
            this.preRun();
            try {
                const exitCode = await this.debugger.run(code, input, config);
                return this.postRun(exitCode);
            } catch (error1) {
                e = error1;
                this.handleError(e);
                return this.setState({
                    status: "editing"
                });
            }
        }
    }

    preDebug() {
        this.codeBackup = this.state.code;
        return this.setState({
            output: "",
            status: "debugging"
        });
    }

    async startDebug() {
        this.setState({
            code: await this.debugger.getSource(),
            vars: [],
            lastVars: []
        });
        return this.debug_stepinto();
    }

    postDebug(exitCode) {
        const exitInfo = `\nprogram exited with code ${exitCode}.`;
        return this.setState({
            output: this.output + exitInfo
        });
    }

    async updateMarkers() {
        const s = await this.debugger.nextNode();
        const lastVars = this.state.vars;
        const vars = await this.debugger.variable();
        const marker = new Range(s.sLine - 1, s.sColumn - 1, s.sLine - 1, s.sColumn);
        return this.setState({
            markers: [marker],
            vars,
            lastVars
        });
    }

    debug_continue() {
        return this.debug_stepinto();
    }

    async debug_stepinto() {
        try {
            const done = await this.debugger.continue();
            if (done !== false) {
                this.debug_stop();
                return this.postDebug(done.v);
            } else {
                return await this.updateMarkers();
            }
        } catch (e) {
            this.handleError(e);
            return this.debug_stop();
        }
    }


    debug_stepover() {
        return this.debug_stepinto();
    }

    debug_stepout() {
        return this.debug_stepinto();
    }

    debug_stop() {
        if (this.runningInWorker) {
            this.debugger.worker.terminate();
            this.debugger = null;
            this.setState({
                status: "editing",
                code: this.codeBackup,
                markers: []
            });
        } else {
            this.debugger = null;
            this.setState({
                status: "editing",
                code: this.codeBackup,
                markers: []
            });
        }
    }

    preRun() {
        this.setState({
            output: "",
            status: "running"
        });
        this.timer = new Date().getTime();
    }

    postRun(exitCode) {
        if (this.timer) {
            const ellaps = new Date().getTime() - this.timer;
            this.timer = null;
            const exitInfo = `\nprogram exited with code ${exitCode} in ${ellaps}ms.`;
            return this.setState({
                output: this.output + exitInfo,
                status: "editing"
            });
        }
    }

    onChangeInput(e) {
        return this.setState({
            input: this.refs.input.getValue()
        });
    }

    onChangeOutput(e) {
        return this.setState({
            output: this.refs.output.getValue()
        });
    }

    download() {
        const pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.state.code));
        pom.setAttribute('download', 'source.cpp');

        if (document.createEvent != null) {
            const event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            return pom.dispatchEvent(event);
        } else {
            return pom.click();
        }
    }

    upload() {
        return this.refs.hiddenfile.getDOMNode().click();
    }

    handleFile(e) {
        const { files } = e.target;
        if (files.length > 0) {
            const file = files.item(0);
            const fr = new FileReader();
            fr.onloadend = () => {
                return this.setState({
                    code: fr.result
                });
            };
            return fr.readAsText(file);
        }
    }

    filemenu(eventKey) {
        switch (eventKey) {
            case "quick-open":
                return this.quickLoad();
            case "quick-save":
                return this.quickSave();
            case "download":
                return this.download();
            case "upload":
                return this.upload();
        }
    }

    render() {
        let running;
        const { code, input, output, status, markers, vars, lastVars, busy } = this.state;
        const debugging = status === "debugging";
        const editing = status === "editing";
        running = status === "running";
        const brand = <a href="https://github.com/felixhao28/JSCPP" className="logo">
            JSCPP
            </a>;
        return <div>
            <input type="file" ref="hiddenfile" style={{ display: "none" }} onChange={this.handleFile.bind(this)} />;
            <Navbar brand={brand}>
                <Nav>
                    <DropdownButton title="File" onSelect={this.filemenu.bind(this)}>
                        <MenuItem eventKey="quick-open">
                            <Glyphicon glyph="floppy-open" />Quick Open (Ctrl + O)
                        </MenuItem>
                        <MenuItem eventKey="quick-save">
                            <Glyphicon glyph="floppy-save" />Quick Save (Ctrl + S)
                        </MenuItem>
                        <MenuItem eventKey="upload">
                            <Glyphicon glyph="upload" />Open...
                        </MenuItem>
                        <MenuItem eventKey="download">
                            <Glyphicon glyph="save" />Download
                        </MenuItem>
                    </DropdownButton>
                    <NavItem href="#" onClick={editing && this.run.bind(this, false)} disabled={!editing}>
                        <Glyphicon glyph="play" />Run
                    </NavItem>
                    <NavItem href="#" onClick={editing && this.run.bind(this, true)} disabled={!editing}>
                        <Glyphicon glyph="sunglasses" />Debug
                    </NavItem>
                    <NavItem href="#" onClick={editing && this.runInWorker.bind(this, false)} disabled={!editing}>
                        <Glyphicon glyph="play" />Run in WebWorker
                    </NavItem>
                    <NavItem href="#" onClick={editing && this.runInWorker.bind(this, true)} disabled={!editing}>
                        <Glyphicon glyph="sunglasses" />Debug in WebWorker
                    </NavItem>
                </Nav>
            </Navbar>
            <Grid>
                {
                    debugging ?
                        <Row className="debug-toolbar">
                            <Col md={12}>
                                <ButtonGroup disabled={busy}>
                                    <Button disabled onClick={this.debug_continue.bind(this)}>Continue</Button>
                                    <Button onClick={this.debug_stepinto.bind(this)}>Step Into</Button>
                                    <Button disabled onClick={this.debug_stepover.bind(this)}>Step Over</Button>
                                    <Button disabled onClick={this.debug_stepout.bind(this)}>Step Out</Button>
                                    <Button onClick={this.debug_stop.bind(this)}>Stop</Button>
                                </ButtonGroup>
                            </Col>
                        </Row>
                        : null
                }
                <Row className="main-row">
                    <Col md={debugging ? 8 : 12}>
                        <AceEditor
                            ref="editor"
                            name="editor"
                            className="editor"
                            value={code}
                            onChange={this.onChange.bind(this)}
                            theme="monokai"
                            readOnly={!editing}
                            markers={markers}
                            onLoad={(editorInstance) => {
                                editorInstance.container.style.resize = "both";
                                document.addEventListener("mouseup", (e) => (
                                    editorInstance.resize()
                                ))
                            }}
                        />
                    </Col>
                    {
                        debugging ?
                            <Col md={4}>
                                <VariablePanel mydebugger={this.debugger} vars={vars} lastVars={lastVars} />
                            </Col>
                            : null
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
                            onChange={this.onChangeInput.bind(this)}
                        />
                    </Col>
                    <Col md={6}>
                        <Input ref="output"
                            className="output-area"
                            type="textarea"
                            label="Standard Output"
                            rows={5}
                            value={output}
                            onChange={this.onChangeOutput.bind(this)}
                        />
                    </Col>
                </Row>
            </Grid>
        </div>
    }
};

React.render(<Main />, document.getElementById("mycontainer"));
