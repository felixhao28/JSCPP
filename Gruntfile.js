module.exports = function(grunt) {
  var pkg;
  require("load-grunt-tasks")(grunt);
  grunt.registerTask("build", "to build", ["clean", "copy", "peg", "coffee", "dist"]);
  grunt.registerTask("build6to5", "to build es6 with traceur", ["traceur", "rename:build_es6", "concat:build_es6"]);
  grunt.registerTask("dist", "to make distribution version", ["browserify:dist"]);
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
        src: ["lib", "dist", "lib-es5"]
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
      },
      dist_es6: {
        files: {
          "dist/JSCPP_es5.js": ["lib-es5/**/*.js", "!lib-es5/traceur_runtime.js", "!lib-es5/main.js"]
        }
      }
    },
    uglify: {
      dist_es6: {
        files: {
          "dist/JSCPP_es5.min.js": ["dist/JSCPP_es5.js"]
        }
      }
    },
    rename: {
      build_es6: {
        src: "lib-es5/main.js",
        dest: "lib-es5/main-es6.js"
      }
    },
    concat: {
      build_es6: {
        src: ["lib-es5/traceur_runtime.js", "lib-es5/main-es6.js"],
        dest: "lib-es5/main.js"
      },
      dist_es6: {
        src: ["lib-es5/traceur_runtime.js", "dist/JSCPP_es5.js"],
        dest: "dist/JSCPP_es5.js"
      }
    },
    traceur: {
      options: {
        sourceMap: false,
        generators: true,
        copyRuntime: "lib-es5"
      },
      es6: {
        files: [
          {
            expand: true,
            cwd: "lib",
            src: ["**/*.js"],
            dest: "lib-es5"
          }
        ]
      },
      dist_es6: {
        files: {
          "dist/JSCPP_es5.js": "dist/JSCPP.js"
        }
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
