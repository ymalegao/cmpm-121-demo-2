import "./style.css";

const APP_NAME = "Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Utility Functions
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

const header = document.createElement("h1");

const canvas = document.createElement("canvas")
canvas.width = 256
canvas.height = 256;


const button = createButton("clearButton", "clear");
const undoButton = createButton("undoButton", "undo");
const redoButton = createButton("redoButton", "redo");

const stickerContainer = createDiv("sticker-container");
app.appendChild(stickerContainer);

const thinMarkerThickness = 3;
const thickMarkerThickness = 9;

const availableStickers : Array<string> = ["❌", "👍", "👎"];
const container = document.createElement("div");
container.className = "container";

const colorPicker = createInput("color", "colorPicker", "color-picker", "#000000");
container.appendChild(colorPicker);

const sliderDiv = document.createElement("div");
sliderDiv.className = "slider-container";
const slider = createInput("range", "toolPropertySlider", "slider", "0");
slider.min = "0";
slider.max = "360";
sliderDiv.appendChild(slider);
container.appendChild(sliderDiv);

app.appendChild(container);

availableStickers.forEach((stickerPrompt) => {
    const stickerButton = document.createElement("button");
    stickerButton.innerHTML = stickerPrompt;
    stickerButton.className = "sticker";
    stickerButton.classList.add("marker");
    stickerButton.addEventListener("click", () => {
        currentTool = { type: "sticker", sticker: stickerPrompt };
        selectTool(stickerButton);
    });
    stickerContainer.append(stickerButton);
});


const thinMarker = document.createElement("button")
thinMarker.id = "thinMarker"
thinMarker.innerHTML = "thin marker"
thinMarker.className = "marker"

const thickMarker = document.createElement("button")
thickMarker.id = "thickMarker"
thickMarker.innerHTML = "thick marker"
thickMarker.className = "marker"

const triggerStickerPrompt = document.createElement("button")
triggerStickerPrompt.id = "triggerStickerPrompt"
triggerStickerPrompt.innerHTML = "add sticker"
triggerStickerPrompt.className = "marker"

const exportButton = document.createElement("button")
exportButton.id = "exportButton"
exportButton.innerHTML = "export"


const ctx = canvas.getContext("2d");



app.append(header, canvas, button )



interface DrawObject {
    
    display(ctx: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

interface ToolPreview{
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



const lines: Array<DrawObject> = [];
let currentLine: DrawObject | null = null;
const undoStack: Array<DrawObject> = [];

let currentTool: MarkerTool | StickerTool = { type: "marker", thickness: thickMarkerThickness };

let showPreview = true; 

let toolPreview: ToolPreview | null = null;

const cursor = {active: false, x: 0, y:0};

let mouseIsDown = false;

let currentColor = "#000000";

let currentRotation = 0;


function createLine(startX: number, startY: number, thickness: number, color: string): DrawObject {
    const points: Array<{x: number, y: number}> = [{x: startX, y: startY}];

    return {
        drag(x:number, y:number) {
            points.push({x, y});
        },
        display(ctx: CanvasRenderingContext2D) {
            if (points.length === 0) return;
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;

            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((point) => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }
    }
}

function createToolPreview(
    x: number, y: number, thickness: number, color:string): ToolPreview {
    return {
      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(x, y, thickness / 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      },
    };
  }


function createStickerPreview(x: number,y: number, sticker: string, rotation:number): ToolPreview {
    return {
      draw(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.translate(x, y); // Move to sticker position
            ctx.rotate((rotation * Math.PI) / 180); // Rotate the sticker preview
            ctx.fillText(sticker, 0, 0);
            ctx.restore();
      },
    };
}

function createSticker(startX: number,startY: number,sticker: string, rotation:number): DrawObject {
    let x = startX;
    let y = startY;
    
    return {
        drag(newX: number, newY: number) {
        x = newX;
        y = newY;
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.save(); // Save the current canvas state
            ctx.translate(x, y); // Move to sticker position
            ctx.rotate((rotation * Math.PI) / 180); // Rotate based on the slider value
            ctx.fillText(sticker, 0, 0); // Draw the sticker at the origin after rotation
            ctx.restore(); // Restore the canvas state to prevent rotating other elements
        },
    };
    }

 

function setThickness(thickness: number){
    if (currentTool.type === "marker"){
        const currentMarker = currentTool as MarkerTool;
        currentMarker.thickness = thickness;
    }
}

function selectTool(selectedButton: HTMLButtonElement){
    const buttons = document.querySelectorAll(".marker");
    buttons.forEach((button) => {
        button.classList.remove("selected");
    });
    selectedButton.classList.add("selected");
}

thinMarker.addEventListener("click", () => {
    currentTool = { type: "marker", thickness: thinMarkerThickness };

    setThickness(3);
    selectTool(thinMarker);
})

thickMarker.addEventListener("click", () => {
    currentTool = { type: "marker", thickness: thickMarkerThickness };
    setThickness(9);
    selectTool(thickMarker);
})



triggerStickerPrompt.addEventListener("click", () => {
    const stickerPrompt = prompt("Enter a sticker", "❌");
    if (stickerPrompt) {
        if (availableStickers.includes(stickerPrompt)){
            alert("sticker already exists");
            return;
        } else {
            availableStickers.push(stickerPrompt);
            addStickerButtons(stickerPrompt);
        }
    }
    
});

function addStickerButtons(stickerPrompt: string) {
    
    const stickerButton = document.createElement("button");
    stickerButton.innerHTML = stickerPrompt;
    stickerButton.className = "sticker";
    stickerButton.classList.add("marker");
    stickerButton.addEventListener("click", () => {
        currentTool = { type: "sticker", sticker: stickerPrompt };
        selectTool(stickerButton);
    });
    stickerContainer.append(stickerButton);
}


colorPicker.addEventListener("input", (e) => {
    currentColor = (e.target as HTMLInputElement).value;
});


canvas.addEventListener("mousedown", (e) => {
    mouseIsDown = true;
    const x = e.offsetX;
    const y = e.offsetY;
    if (currentTool.type === "marker") {
      const markerTool = currentTool as MarkerTool;
      currentLine = createLine(x, y, markerTool.thickness, currentColor);
      lines.push(currentLine);
      showPreview = false;
    } else if (currentTool.type === "sticker") {
      const stickerTool = currentTool as StickerTool;
      currentLine = createSticker(x, y, stickerTool.sticker, currentRotation);
      lines.push(currentLine);
      showPreview = false;
    }
  });

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
  
    if (mouseIsDown && currentLine) {
      currentLine.drag(x, y);
      const drawingChangedEvent = new Event("drawing-changed");
      canvas.dispatchEvent(drawingChangedEvent);
    } else {
      const toolMovedEvent = new CustomEvent("tool-moved", {
        detail: { x, y },
      });
      canvas.dispatchEvent(toolMovedEvent);
    }
  });



canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    mouseIsDown = false;

    currentLine = null;
    showPreview = true;
})

canvas.addEventListener("tool-moved", (e) => {
    const { x, y } = (e as CustomEvent).detail;
  if (currentTool.type === "marker") {
    const markerTool = currentTool as MarkerTool;
    toolPreview = createToolPreview(x, y, markerTool.thickness, currentColor);
  } else if (currentTool.type === "sticker") {
    const stickerTool = currentTool as StickerTool;
    toolPreview = createStickerPreview(x, y, stickerTool.sticker, currentRotation);
  }
  showPreview = true;

  const drawingChangedEvent = new Event("drawing-changed");
  canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("drawing-changed", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach((line) => {
        line.display(ctx!);
    });

    if (toolPreview && showPreview) {
        toolPreview.draw(ctx!);
    }


});



button.addEventListener("click", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    while (lines.length > 0) {
        undoStack.push(lines.pop()!);
    }
})

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop();
        if (lastLine) {
            undoStack.push();
            const event = new Event("drawing-changed");
            canvas.dispatchEvent(event);
        }
    }
})

redoButton.addEventListener("click", () => {
    if (undoStack.length > 0) {
        lines.push(undoStack.pop()!);
        const event = new Event("drawing-changed");
        canvas.dispatchEvent(event);
    }
})

exportButton.addEventListener("click", () => {

    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = 1024
    tempCanvas.height = 1024;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx?.scale(4,4);
    tempCtx?.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    lines.forEach((line) => {
        line.display(tempCtx!);
    });
    const link = document.createElement("a");
    link.href = tempCanvas.toDataURL("image/png");
    link.download = "drawing.png";
    link.click();

});

slider.addEventListener("input", (e) => {
    const sliderValue = parseInt((e.target as HTMLInputElement).value, 10);

    if (currentTool.type === "marker") {
        const hue = sliderValue; 
        currentColor = `hsl(${hue}, 100%, 50%)`; 
    } else if (currentTool.type === "sticker") {
        currentRotation = sliderValue;
    }
});

app.append(button, undoButton, redoButton, thinMarker, thickMarker, triggerStickerPrompt, exportButton);



