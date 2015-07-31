var es6ify;

es6ify = require("es6ify");

module.exports = function(grunt) {
  var pkg;
  require("load-grunt-tasks")(grunt);
  grunt.registerTask("build", "to build", ["clean", "copy", "peg", "coffee", "dist"]);
  grunt.registerTask("dist", "to make distribution version", ["browserify", "shell", "concat", "uglify"]);
  grunt.registerTask("default", "to watch & compile", ["build", "watch"]);
  grunt.registerTask("test", "to test", ["mochaTest"]);
  pkg = grunt.file.readJSON("package.json");
  return grunt.initConfig({
    pkg: pkg,
    copy: {
      build: {
        cwd: "src",
        src: ["**", "!**/*.coffee"],
        dest: "lib",
        expand: true
      }
    },
    clean: {
      build: {
        src: ["lib", "dist"]
      }
    },
    coffee: {
      build: {
        options: {
          bare: true
        },
        files: [
          {
            expand: true,
            cwd: "src",
            src: ["**/*.coffee"],
            dest: "lib",
            ext: ".js"
          }, {
            expand: true,
            cwd: "test",
            src: ["**/*.coffee"],
            dest: "test",
            ext: ".js"
          }, {
            expand: true,
            cwd: "demo",
            src: ["**/*.coffee"],
            dest: "demo",
            ext: ".js"
          }, {
            expand: true,
            cwd: "",
            src: ["*.coffee"],
            desc: "",
            ext: ".js"
          }
        ]
      }
    },
    browserify: {
      dist: {
        files: {
          "dist/JSCPP.js": ["lib/**/*.js"]
        }
      }
    },
    uglify: {
      dist: {
        files: {
          "dist/JSCPP.es5.min.js": ["dist/JSCPP.es5.js"]
        }
      }
    },
    shell: {
      dist: {
        command: "node node_modules\\traceur\\traceur --out dist\\JSCPP.es5.js --script dist\\JSCPP.js"
      }
    },
    concat: {
      options: {
        separator: ";"
      },
      dist: {
        src: ["node_modules/traceur/bin/traceur-runtime.js", "dist/JSCPP.es5.js"],
        dest: "dist/JSCPP.es5.js"
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: "spec",
          captureFile: "test.log",
          require: "mocha-traceur"
        },
        src: ["test/**/*.js"]
      }
    },
    peg: {
      build: {
        cwd: "pegjs",
        src: ["**/*.pegjs"],
        dest: "lib",
        ext: ".js",
        expand: true
      }
    },
    watch: {
      coffee: {
        files: ["src/**/*.coffee", "test/test.coffee", "demo/**/*.coffee", "*.coffee", "!Gruntfile.coffee"],
        tasks: ["newer:coffee"]
      },
      peg: {
        files: "pegjs/**/*.pegjs",
        tasks: ["newer:peg"]
      },
      copy: {
        files: ["src/**", "!src/**/*.coffee"],
        tasks: ["newer:copy"]
      }
    }
  });
};
