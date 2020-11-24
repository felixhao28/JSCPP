const AceEditor = React.createClass({
    displayName() {
        return "AceEditor";
    },

    getDefaultProps() {
        return {
            name: "brace-editor",
            mode: "c_cpp",
            theme: "monokai",
            value: "",
            markers: [],
            fontSize: 12,
            showGutter: true,
            onChange: null,
            onLoad: null,
            maxLines: null,
            readOnly: false,
            highlightActiveLine: true,
            showPrintMargin: true
        };
    },

    markerIds: [],

    componentDidMount() {
        window.Range = ace.require("ace/range").Range;
        this.editor = ace.edit(this.props.name);
        this.editor.on("change", this.onChange);
        this.componentWillReceiveProps(this.props);
        if (this.props.onLoad) {
            return this.props.onLoad(this.editor);
        }
    },

    componentWillReceiveProps(nextProps) {
        const { markers, name, mode, theme, fontSize, maxLines, readOnly, highlightActiveLine, setShowPrintMargin, value, showGutter, onLoad } = nextProps;
        this.editor = ace.edit(name);
        this.editor.getSession().setMode("ace/mode/" + mode);
        this.editor.setTheme("ace/theme/" + theme);
        this.editor.setFontSize(fontSize);
        this.editor.setOption("maxLines", maxLines);
        this.editor.setOption("readOnly", readOnly);
        this.editor.setOption("highlightActiveLine", highlightActiveLine);
        this.editor.setOptions({
            showLineNumbers: true,
            enableBasicAutocompletion: true,
            enableSnippets: false,
            enableLiveAutocompletion: true
        });
        this.editor.setShowPrintMargin(setShowPrintMargin);
        for (let markerid of Array.from(this.markerIds)) {
            this.editor.getSession().removeMarker(markerid);
        }
        this.markerIds = [];
        for (let marker of Array.from(markers)) {
            this.markerIds.push(this.editor.getSession().addMarker(marker, "debug-highlight", "fullLine"));
        }
        if (this.editor.getValue() !== value) {
            this.editor.setValue(value, 1);
        }
        return this.editor.renderer.setShowGutter(showGutter);
    },

    onChange() {
        const value = this.editor.getValue();
        if (this.props.onChange) {
            return this.props.onChange(value);
        }
    },

    render() {
        const { name, className } = this.props;
        return <div id={name} className={className}>
        </div>
    }
});
