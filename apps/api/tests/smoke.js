const fetch = (...args) => import("node-fetch").then(({ default: fn }) => fn(...args));

async function main() {
  const base = process.env.API_BASE || "http://localhost:4000";
  const res = await fetch(`${base}/health`);
  if (!res.ok) {
    console.error("Healthcheck failed", res.status);
    process.exit(1);
  }
  console.log("API healthy");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




