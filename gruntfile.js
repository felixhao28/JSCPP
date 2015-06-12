module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt);
    var pkg = grunt.file.readJSON("package.json");
    grunt.initConfig({
        pkg: pkg,
        cjsx: {
            build: {
                options: {
                    bare: true,
                    sourceMap: false
                },
                files: [
                  {
                      expand: true,
                      cwd: "scripts",
                      src: ["**/*.coffee"],
                      dest: "scripts",
                      ext: ".js"
                  }
                ]
            }
        },
        watch: {
            coffee: {
                files: ["**/*.coffee"],
                tasks: ["newer:cjsx"]
            }
        }
    });
    grunt.registerTask("build", "to build", ["cjsx"]);
    grunt.registerTask("default", "to watch & compile", ["cjsx", "watch"]);
};