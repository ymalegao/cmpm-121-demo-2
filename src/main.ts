import "./style.css";

// **Constants and Configuration**
const APP_NAME = "Sticker Sketchpad";
const CANVAS_SIZE = 256;
const THIN_MARKER_THICKNESS = 3;
const THICK_MARKER_THICKNESS = 9;

// **Initialize the App**
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// **UI Components Initialization**
const header = document.createElement("h1");
header.innerText = APP_NAME;

const canvas = document.createElement("canvas");
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
const ctx = canvas.getContext("2d")!;

const stickerContainer = createDiv("sticker-container"); // Container for stickers
const container = createDiv("container", "ui-container"); // General UI container
const _sliderDiv = createDiv("slider-container"); // Slider container (unused, prefixed with `_`)

// **Tool Settings and Options**
const colorPicker = createInput("color", "colorPicker", "color-picker", "#000000");
const slider = createInput("range", "toolPropertySlider", "slider", "0");
slider.min = "0";
slider.max = "360";

const thinMarkerButton = createButton("thinMarker", "Thin Marker", "marker", () => selectMarker(THIN_MARKER_THICKNESS));
const thickMarkerButton = createButton("thickMarker", "Thick Marker", "marker", () => selectMarker(THICK_MARKER_THICKNESS));
const addStickerButton = createButton("triggerStickerPrompt", "Add Sticker", "marker", addStickerPrompt);

const clearButton = createButton("clearButton", "Clear Canvas", "control-button", clearCanvas);
const undoButton = createButton("undoButton", "Undo", "control-button", undo);
const redoButton = createButton("redoButton", "Redo", "control-button", redo);
const exportButton = createButton("exportButton", "Export", "control-button", exportCanvas);

// **Drawing State Variables**
const lines: Array<DrawObject> = [];
const undoStack: Array<DrawObject> = [];
let currentLine: DrawObject | null = null;
const _toolPreview: ToolPreview | null = null;

let currentTool: MarkerTool | StickerTool = { type: "marker", thickness: THICK_MARKER_THICKNESS };
let mouseIsDown = false;
const currentColor = "#000000";
const currentRotation = 0;

// **Available Stickers**
const availableStickers: Array<string> = ["❌", "👍", "👎"];

// **Utility Functions**
function createButton(id: string, label: string, className?: string, onClick?: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = id;
  button.innerHTML = label;
  if (className) button.className = className;
  if (onClick) button.addEventListener("click", onClick);
  return button;
}

function createInput(type: string, id: string, className?: string, value?: string): HTMLInputElement {
  const input = document.createElement("input");
  input.type = type;
  input.id = id;
  if (className) input.className = className;
  if (value) input.value = value;
  return input;
}

function createDiv(id: string, className?: string): HTMLDivElement {
  const div = document.createElement("div");
  div.id = id;
  if (className) div.className = className;
  return div;
}

// **Drawing Interfaces**
interface DrawObject {
  drag(x: number, y: number): void;
  display(ctx: CanvasRenderingContext2D): void;
}

interface ToolPreview {
  draw(ctx: CanvasRenderingContext2D): void;
}

interface Tool {
  type: "marker" | "sticker";
}

interface MarkerTool extends Tool {
  type: "marker";
  thickness: number;
}

interface StickerTool extends Tool {
  type: "sticker";
  sticker: string;
}

// **Drawing Logic**
function createMarker(x: number, y: number, thickness: number, color: string): DrawObject {
  const points = [{ x, y }];
  return {
    drag(newX: number, newY: number) {
      points.push({ x: newX, y: newY }); // Correct keys
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.lineWidth = thickness;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    },
  };
}

function createSticker(x: number, y: number, sticker: string, rotation: number): DrawObject {
  return {
    drag() {
      // Stickers are static; no dragging required.
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(sticker, 0, 0);
      ctx.restore();
    },
  };
}

// **Event Listeners**
canvas.addEventListener("mousedown", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  mouseIsDown = true;

  if (currentTool.type === "marker") {
    const markerTool = currentTool as MarkerTool;
    currentLine = createMarker(x, y, markerTool.thickness, currentColor);
  } else if (currentTool.type === "sticker") {
    const stickerTool = currentTool as StickerTool;
    currentLine = createSticker(x, y, stickerTool.sticker, currentRotation);
  }

  if (currentLine) lines.push(currentLine);
});

canvas.addEventListener("mousemove", (e) => {
  if (mouseIsDown && currentLine) currentLine.drag(e.offsetX, e.offsetY);
  redrawCanvas();
});

canvas.addEventListener("mouseup", () => {
  mouseIsDown = false;
  currentLine = null;
  redrawCanvas();
});

// **Tool and Canvas Control**
function selectMarker(thickness: number) {
  currentTool = { type: "marker", thickness };
}

function addStickerPrompt() {
  const sticker = prompt("Enter a new sticker (e.g., 😊):");
  if (sticker && !availableStickers.includes(sticker)) {
    availableStickers.push(sticker);
    const stickerButton = createButton(
      `sticker-${sticker}`,
      sticker,
      "sticker",
      () => (currentTool = { type: "sticker", sticker })
    );
    stickerContainer.appendChild(stickerButton);
  } else {
    alert("Sticker already exists or invalid input.");
  }
}

function clearCanvas() {
  lines.length = 0;
  undoStack.length = 0;
  redrawCanvas();
}

function undo() {
  if (lines.length > 0) undoStack.push(lines.pop()!);
  redrawCanvas();
}

function redo() {
  if (undoStack.length > 0) lines.push(undoStack.pop()!);
  redrawCanvas();
}

function exportCanvas() {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = CANVAS_SIZE * 4;
  tempCanvas.height = CANVAS_SIZE * 4;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.scale(4, 4);
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  lines.forEach((line) => line.display(tempCtx));
  const link = document.createElement("a");
  link.download = "canvas-export.png";
  link.href = tempCanvas.toDataURL();
  link.click();
}

// **Redraw Canvas**
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => line.display(ctx));
}

// **Append Components to DOM**
container.append(colorPicker, slider);
stickerContainer.append(...availableStickers.map((sticker) => createButton(`sticker-${sticker}`, sticker, "sticker", () => (currentTool = { type: "sticker", sticker }))));
app.append(header, canvas, stickerContainer, container, thinMarkerButton, thickMarkerButton, addStickerButton, clearButton, undoButton, redoButton, exportButton);
