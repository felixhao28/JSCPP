var AceEditor;

AceEditor = React.createClass({
  displayName: function() {
    return "AceEditor";
  },
  getDefaultProps: function() {
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
  componentDidMount: function() {
    window.Range = ace.require("ace/range").Range;
    this.editor = ace.edit(this.props.name);
    this.editor.on("change", this.onChange);
    this.componentWillReceiveProps(this.props);
    if (this.props.onLoad) {
      return this.props.onLoad(this.editor);
    }
  },
  componentWillReceiveProps: function(nextProps) {
    var fontSize, highlightActiveLine, i, j, len, len1, marker, markerid, markers, maxLines, mode, name, onLoad, readOnly, ref, setShowPrintMargin, showGutter, theme, value;
    markers = nextProps.markers, name = nextProps.name, mode = nextProps.mode, theme = nextProps.theme, fontSize = nextProps.fontSize, maxLines = nextProps.maxLines, readOnly = nextProps.readOnly, highlightActiveLine = nextProps.highlightActiveLine, setShowPrintMargin = nextProps.setShowPrintMargin, value = nextProps.value, showGutter = nextProps.showGutter, onLoad = nextProps.onLoad;
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
    ref = this.markerIds;
    for (i = 0, len = ref.length; i < len; i++) {
      markerid = ref[i];
      this.editor.getSession().removeMarker(markerid);
    }
    this.markerIds = [];
    for (j = 0, len1 = markers.length; j < len1; j++) {
      marker = markers[j];
      this.markerIds.push(this.editor.getSession().addMarker(marker, "debug-highlight", "fullLine"));
    }
    if (this.editor.getValue() !== value) {
      this.editor.setValue(value);
    }
    return this.editor.renderer.setShowGutter(showGutter);
  },
  onChange: function() {
    var value;
    value = this.editor.getValue();
    if (this.props.onChange) {
      return this.props.onChange(value);
    }
  },
  render: function() {
    var className, name, ref;
    ref = this.props, name = ref.name, className = ref.className;
    return React.createElement("div", {
      "id": name,
      "className": className
    });
  }
});
