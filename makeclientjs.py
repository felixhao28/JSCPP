def require(name):
    global buf
    with open('%s.js' % name, 'r') as f:
        buf += f.read()
    buf += '\nvar %s = module.exports;\n' % name


def include(name):
    global buf
    with open('includes/%s.js' % name, 'r') as f:
        buf += f.read()
    buf += '\nvar _%s = module.exports;\n' % name

requires = ['rt', 'interpreter', 'ast', 'prepast', 'preprocessor']
includes = ['cctype', 'cmath', 'cstring', 'iostream']
buf = 'var module = {};\n'

for name in requires:
    require(name)
for name in includes:
    include(name)

with open('jscpp_page.js', 'w') as f:
    f.write(buf)
