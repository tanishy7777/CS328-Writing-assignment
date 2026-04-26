import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("dashboard exposes the full notebook hypothesis scope", async () => {
  const html = await readFile(new URL("site/index.html", root), "utf8");
  const dashboard = JSON.parse(
    await readFile(new URL("site/data/co2-dashboard.json", root), "utf8"),
  );

  for (const label of ["H4 Land Use", "H5 History", "H6 Decoupling"]) {
    assert.match(html, new RegExp(label));
  }

  assert.ok(Array.isArray(dashboard.landUse), "landUse data is present");
  assert.ok(Array.isArray(dashboard.historical), "historical data is present");
  assert.ok(Array.isArray(dashboard.decoupling), "decoupling data is present");

  assert.ok(dashboard.landUse.length >= 6, "land-use comparison has examples");
  assert.ok(dashboard.historical.length >= 20, "historical responsibility has countries");
  assert.ok(dashboard.decoupling.length >= 20, "decoupling data has countries");

  assert.equal(dashboard.meta.years.land_use, 2024);
  assert.equal(dashboard.meta.years.historical, 2024);
  assert.equal(dashboard.meta.years.decoupling_start, 1990);
  assert.equal(dashboard.meta.years.decoupling_end, 2022);
});
