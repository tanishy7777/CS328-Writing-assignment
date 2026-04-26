function linesToText(value) {
  if (Array.isArray(value)) {
    return value.join("");
  }
  return value || "";
}

function create(tag, className) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  return node;
}

function textBlock(text, className) {
  const wrapper = create("div", className);
  const pre = create("pre");
  pre.textContent = text;
  wrapper.append(pre);
  return wrapper;
}

function renderMarkdownCell(cell) {
  const row = create("section", "cell markdown-cell");
  const prompt = create("div", "cell-prompt");
  prompt.textContent = "Markdown";

  const body = create("div", "cell-body");
  const panel = create("div", "markdown-panel");
  panel.innerHTML = window.marked.parse(linesToText(cell.source));
  body.append(panel);

  row.append(prompt, body);
  return row;
}

function outputData(output) {
  return output && output.data ? output.data : {};
}

function renderOutput(output) {
  if (output.output_type === "stream") {
    return textBlock(linesToText(output.text), "output-text");
  }

  if (output.output_type === "error") {
    const traceback = Array.isArray(output.traceback) ? output.traceback.join("\n") : output.evalue || "Error";
    return textBlock(traceback, "output-text");
  }

  const data = outputData(output);
  if (data["text/html"]) {
    const html = create("div", "output-html");
    html.innerHTML = Array.isArray(data["text/html"])
      ? data["text/html"].join("")
      : data["text/html"];
    return html;
  }

  if (data["image/png"]) {
    const img = create("img", "output-image");
    img.alt = "Notebook output figure";
    img.src = `data:image/png;base64,${data["image/png"]}`;
    return img;
  }

  if (data["text/plain"]) {
    return textBlock(linesToText(data["text/plain"]), "output-text");
  }

  return create("div", "output-empty");
}

function renderCodeCell(cell, index) {
  const row = create("section", "cell code-cell");
  const prompt = create("div", "cell-prompt");
  const executionCount = cell.execution_count == null ? " " : cell.execution_count;
  prompt.textContent = `In [${executionCount}]`;

  const body = create("div", "cell-body");
  const inputPanel = create("div", "code-panel");
  const inputLabel = create("div", "code-label");
  inputLabel.textContent = `Code cell ${index + 1}`;
  const input = create("div", "code-input");
  const pre = create("pre");
  pre.textContent = linesToText(cell.source);
  input.append(pre);
  inputPanel.append(inputLabel, input);
  body.append(inputPanel);

  if (Array.isArray(cell.outputs) && cell.outputs.length > 0) {
    const outputStack = create("div", "output-stack");
    cell.outputs.forEach((output) => {
      const outputPanel = create("div", "output-panel");
      const outputLabel = create("div", "output-label");
      outputLabel.textContent = "Output";
      const outputBody = create("div", "output-body");
      outputBody.append(renderOutput(output));
      outputPanel.append(outputLabel, outputBody);
      outputStack.append(outputPanel);
    });
    body.append(outputStack);
  }

  row.append(prompt, body);
  return row;
}

function notebookTitle(notebook) {
  const firstHeading = notebook.cells.find((cell) => {
    if (cell.cell_type !== "markdown") {
      return false;
    }
    return /^#\s+/.test(linesToText(cell.source));
  });

  if (!firstHeading) {
    return "Notebook";
  }

  return linesToText(firstHeading.source).split("\n")[0].replace(/^#\s+/, "").trim();
}

async function init() {
  const status = document.querySelector("#notebookStatus");
  const root = document.querySelector("#notebookRoot");

  try {
    const response = await fetch("data/co2_assignment_starter.ipynb");
    if (!response.ok) {
      throw new Error(`Failed to fetch notebook: ${response.status}`);
    }

    const notebook = await response.json();
    document.title = `${notebookTitle(notebook)} Notebook`;

    notebook.cells.forEach((cell, index) => {
      if (cell.cell_type === "markdown") {
        root.append(renderMarkdownCell(cell));
      } else if (cell.cell_type === "code") {
        root.append(renderCodeCell(cell, index));
      }
    });

    root.hidden = false;
    status.hidden = true;
  } catch (error) {
    status.textContent = `Unable to load the notebook: ${error.message}`;
  }
}

init();
