// Build both decks from reports/results.json.
//   npm install && npm run build            (from presentations/build)
//   node build_decks.js client|technical    (build one deck only)

const path = require("path");
const { loadResults } = require("./lib");
const { buildClient } = require("./client");
const { buildTechnical } = require("./technical");

const OUT = path.join(__dirname, "..");

async function main() {
  const which = process.argv[2] || "all";
  const results = loadResults();
  if (which === "all" || which === "client") {
    console.log("Built", await buildClient(results, path.join(OUT, "client", "Kickstarter_Launch_Check_Client.pptx")));
  }
  if (which === "all" || which === "technical") {
    console.log("Built", await buildTechnical(results, path.join(OUT, "technical", "Kickstarter_Success_Technical.pptx")));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
