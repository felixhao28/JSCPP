assert = require "assert"
fs = require "fs"
JSCPP = require "../lib/main"
chai = require "chai"

expect = chai.expect

testFolder = './test/'

doTest = (cppFile, inFile, outFile, cb) ->
    outputBuffer = ""

    _cpp = fs.readFileSync testFolder + "#{cppFile}.cpp"

    _in = fs.readFileSync testFolder + inFile

    _out = fs.readFileSync testFolder + outFile

    console.log "lauching #{cppFile}.cpp, input = #{inFile}, output = #{outFile}"
    JSCPP.launcher.run(_cpp, _in, {stdio: {write: (str) -> outputBuffer += str}})
    result = outputBuffer
    return -> cb(result, _out.toString())

todolist = []

files = fs.readdirSync testFolder

for file in files when file.slice(-4) is ".cpp"
    todolist.push file.slice(0, -4)

prepareOutput = (str) ->
    str.replace(/\r\n/g, "\n").replace(/\r/, "\n").trim()

describe "Tests", ->
    for cppFile in todolist
        describe(cppFile, do ->
            if cppFile.slice(-5) is ".fail"
                testName = cppFile.slice(0, -5)
                inFile = "#{testName}.in"
                outFile = "#{testName}.out"
                shouldPass = false
            else if cppFile.slice(-5) is ".pass"
                testName = cppFile.slice(0, -5)
                inFile = "#{testName}.in"
                outFile = "#{testName}.out"
                shouldPass = true
            else
                return ->
            doTest(cppFile, inFile, outFile, (output, expected) ->
                output = prepareOutput output
                expected = prepareOutput expected
                if shouldPass
                    it "should match expected output", ->
                        expect(output).to.equal(expected)
                else
                    it "should not match expected output", ->
                        expect(output).not.to.equal(expected)
            ))