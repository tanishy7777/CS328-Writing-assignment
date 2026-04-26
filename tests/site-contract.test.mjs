import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("site renders the notebook itself", async () => {
  const html = await readFile(new URL("site/index.html", root), "utf8");
  const renderer = await readFile(new URL("site/notebook-render.js", root), "utf8");
  const notebook = JSON.parse(
    await readFile(new URL("site/data/co2_assignment_starter.ipynb", root), "utf8"),
  );

  assert.match(html, /Loading notebook/);
  assert.match(html, /data\/co2_assignment_starter\.ipynb/);
  assert.match(renderer, /fetch\("data\/co2_assignment_starter\.ipynb"\)/);

  assert.ok(Array.isArray(notebook.cells), "notebook cells are present");
  assert.ok(notebook.cells.length >= 100, "full notebook is published");

  const markdownCells = notebook.cells.filter((cell) => cell.cell_type === "markdown");
  const codeWithOutputs = notebook.cells.filter(
    (cell) => cell.cell_type === "code" && Array.isArray(cell.outputs) && cell.outputs.length > 0,
  );

  assert.ok(markdownCells.length >= 20, "markdown narrative is present");
  assert.ok(codeWithOutputs.length >= 10, "renderable notebook outputs are present");
});
