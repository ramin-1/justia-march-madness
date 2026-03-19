import { syncNcaaResults } from "../lib/result-sync/sync-service";

syncNcaaResults()
  .then((result) => {
    console.log("Sync complete:", result);
  })
  .catch((error) => {
    console.error("Sync failed:", error);
    process.exit(1);
  });
