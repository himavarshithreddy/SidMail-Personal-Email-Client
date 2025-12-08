const isDev = process.env.NODE_ENV !== "production";

function log(...args) {
  if (isDev) {
    console.log(...args);
  }
}

function error(...args) {
  console.error(...args);
}

module.exports = { log, error };




