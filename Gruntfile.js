module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);
  grunt.registerTask("build", "to build", ["clean", "copy", "peg", "ts", "dist"]);
  grunt.registerTask("dist", "to make distribution version", ["browserify", "babel", "uglify"]);
  grunt.registerTask("default", "to watch & compile", ["build", "watch"]);
  grunt.registerTask("test", "to test", ["mochaTest"]);
  const pkg = grunt.file.readJSON("package.json");
  return grunt.initConfig({
    pkg,

    copy: {
      build: {
        cwd: "src",
        src: ["**/*.js"],
        dest: "lib",
        expand: true
      }
    },

    clean: {
      build: {
        src: ["lib", "dist"]
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

    babel: {
      options: {
        sourceMap: true,
        presets: ['@babel/preset-env']
      },
      dist: {
        files: {
          'dist/JSCPP.es5.js': 'dist/JSCPP.js'
        }
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

    peg: {
      build: {
        cwd: "pegjs",
        src: ["**/*.pegjs"],
        dest: "lib",
        ext: ".js",
        expand: true
      }
    },

    ts: {
      default: {
        src: ["src/**/*.ts"],
        outDir: "lib/",
        options: {
          rootDir: "src",
          additionalFlags: "--downlevelIteration"
        }
      },
    },

    watch: {
      ts: {
        files: ["src/**/*.ts", "test/test.ts"],
        tasks: ["newer:ts"]
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
