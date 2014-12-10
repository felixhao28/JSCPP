buf = 'var module = {};\n'
with open('rt.js', 'r') as f:
	buf += f.read()
buf += '\nvar _CRuntime = module.exports;\n'
with open('interpreter.js', 'r') as f:
	buf += f.read()
buf += '\nvar _Interpreter = module.exports;\n'
with open('ast.js', 'r') as f:
	buf += f.read()
buf += '\nvar ast = module.exports;\n'
with open('includes/iostream.js', 'r') as f:
	buf += f.read()
buf += '\nvar iostream = module.exports;\n'
with open('includes/cmath.js', 'r') as f:
	buf += f.read()
buf += '\nvar cmath = module.exports;\n'
with open('includes/cstring.js', 'r') as f:
	buf += f.read()
buf += '\nvar cstring = module.exports;\n'
with open('includes/cctype.js', 'r') as f:
	buf += f.read()
buf += '\nvar cctype = module.exports;\n'

with open('jscpp_page.js', 'w') as f:
	f.write(buf)