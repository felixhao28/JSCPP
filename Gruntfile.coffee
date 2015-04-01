module.exports = (grunt) ->
	grunt.initConfig
        pkg: grunt.file.readJSON 'package.json'

        copy:
            build:
                cwd: "src"
                src: ["**", "!**/*.coffee"]
                dest: "lib"
                expand: true

        clean:
            build:
                src: ["lib", "dist"]

        coffee:
            build:
                options:
                    bare: true
                files: [
                        expand: true
                        cwd: "src"
                        src: ["**/*.coffee"]
                        dest: "lib"
                        ext: ".js"
                    ,
                        expand: true
                        cwd: "test"
                        src: ["**/*.coffee"]
                        dest: "test"
                        ext: ".js"
                ]

        browserify:
            build:
                files:
                    "dist/JSCPP.js": ["lib/**/*.js"]

        uglify:
            build:
                files:
                    "dist/JSCPP.min.js": ["dist/JSCPP.js"]

        mochaTest:
            test:
                options:
                    reporter: 'spec',
                    captureFile: "test.log"
                src: ["test/**/*.js"]

        peg:
            build:
                cwd: "pegjs"
                src: ["**/*.pegjs"]
                dest: "lib"
                ext: ".js"
                expand: true

        watch:
            coffee:
                files: "**/*.coffee"
                tasks: ["coffee"]
            peg:
                files: "pegjs/**/*.coffee"
                tasks: ["peg"]
            copy:
                files: ["src/**", "!src/**/*.coffee"]
                tasks: ["copy"]

    grunt.loadNpmTasks 'grunt-contrib-copy'
    grunt.loadNpmTasks 'grunt-contrib-clean'
    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-browserify'
    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-mocha-test'
    grunt.loadNpmTasks 'grunt-peg'
    grunt.loadNpmTasks "grunt-contrib-watch"

    grunt.registerTask "build", "to build", ["clean", "copy", "peg", "coffee", "browserify", "uglify"]
    grunt.registerTask "test", "to test", ["mochaTest"]
    grunt.registerTask "default", "to watch & compile", ["build", "watch"]