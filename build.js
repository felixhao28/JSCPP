process.env.NODE_ENV = "production";
process.env.BABEL_ENV = "production";
require("child_process").exec("npx babel scripts", (error, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);
});
