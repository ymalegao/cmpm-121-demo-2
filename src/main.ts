import "./style.css";

const APP_NAME = "upfated";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;


const header = document.createElement("h1");

const canvas = document.createElement("canvas")
canvas.width = 256
canvas.height = 256;


const button = document.createElement("button")
button.id = "clearButton"
button.innerHTML = "clear"

const undoButton = document.createElement("button")
undoButton.id = "undoButton"
undoButton.innerHTML = "undo"

const redoButton = document.createElement("button")
redoButton.id = "redoButton"
redoButton.innerHTML = "redo"


const thinMarkerThickness = 3;
const thickMarkerThickness = 9;
const sticker1Sticker = "❌";
const sticker2Sticker = "💯";
const sticker3Sticker = "❤️‍🔥";


const thinMarker = document.createElement("button")
thinMarker.id = "thinMarker"
thinMarker.innerHTML = "thin marker"
thinMarker.className = "marker"

const thickMarker = document.createElement("button")
thickMarker.id = "thickMarker"
thickMarker.innerHTML = "thick marker"
thickMarker.className = "marker"

const sticker1 = document.createElement("button");
sticker1.innerHTML = sticker1Sticker
sticker1.className = "marker" 


const sticker2 = document.createElement("button");
sticker2.innerHTML = sticker2Sticker
sticker2.className = "marker"

const sticker3 = document.createElement("button");
sticker3.innerHTML = sticker3Sticker
sticker3.className = "marker"



const ctx = canvas.getContext("2d");



app.append(header, canvas, button)




//thse hold objects that have a 
//display(ctx) method that accepts a 
//context parameter 
//(the same context from canvas.getContext("2d"))
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

interface ToolThickness{
    thickness: number;
}


const lines: Array<DrawObject> = [];
let currentLine: DrawObject | null = null;
const undoStack: Array<DrawObject> = [];
// let redoStack: Array<DrawObject> = [];

let currentTool: Tool = { type: "marker", thickness: thickMarkerThickness };

let showPreview = true; // Flag to show or hide tool preview when drawing


let toolPreview: ToolPreview | null = null;

const cursor = {active: false, x: 0, y:0};

let mouseIsDown = false;




function createLine(startX: number, startY: number, thickness: number): DrawObject {
    const points: Array<{x: number, y: number}> = [{x: startX, y: startY}];

    return {
        drag(x:number, y:number) {
            points.push({x, y});
        },
        display(ctx: CanvasRenderingContext2D) {
            if (points.length === 0) return;
            ctx.lineWidth = thickness;

            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((point) => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }
    }
}



//craete a circle of radius thickness over the cursor 
function createToolPreview(
    x: number, y: number, thickness: number): ToolPreview {
    return {
      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(x, y, thickness / 2, 0, 2 * Math.PI);
        ctx.fill();
      },
    };
  }


function createStickerPreview(x: number,y: number, sticker: string): ToolPreview {
    return {
      draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sticker, x, y);
      },
    };
}




function createSticker(startX: number,startY: number,sticker: string): DrawObject {
    let x = startX;
    let y = startY;
    
    return {
        drag(newX: number, newY: number) {
        x = newX;
        y = newY;
        },
        display(ctx: CanvasRenderingContext2D) {
        ctx.fillText(sticker, x, y);
        },
    };
    }

 

function setThickness(thickness: number){
    currentTool.thickness = thickness;
}

function selectTool(selectedButton: HTMLButtonElement){
    const buttons = document.querySelectorAll(".marker");
    buttons.forEach((button) => {
        button.classList.remove("selected");
    });
    selectedButton.classList.add("selected");
}

thinMarker.addEventListener("click", () => {
    currentTool = { type: "marker", thickness: 4 };

    setThickness(3);
    selectTool(thinMarker);
})

thickMarker.addEventListener("click", () => {
    currentTool = { type: "marker", thickness: 9 };
    setThickness(9);
    selectTool(thickMarker);
})

sticker1.addEventListener("click", () => {
    currentTool = { type: "sticker", sticker: "🐱" };
    selectTool(sticker1);
  });
  
  sticker2.addEventListener("click", () => {
    currentTool = { type: "sticker", sticker: "🌟" };
    selectTool(sticker2);
  });
  
  sticker3.addEventListener("click", () => {
    currentTool = { type: "sticker", sticker: "🍀" };
    selectTool(sticker3);
  });









  canvas.addEventListener("mousedown", (e) => {
    mouseIsDown = true;
    const x = e.offsetX;
    const y = e.offsetY;
    if (currentTool.type === "marker") {
      const markerTool = currentTool as MarkerTool;
      currentLine = createLine(x, y, markerTool.thickness);
      lines.push(currentLine);
      showPreview = false;
    } else if (currentTool.type === "sticker") {
      const stickerTool = currentTool as StickerTool;
      currentLine = createSticker(x, y, stickerTool.sticker);
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
    toolPreview = createToolPreview(x, y, markerTool.thickness);
  } else if (currentTool.type === "sticker") {
    const stickerTool = currentTool as StickerTool;
    toolPreview = createStickerPreview(x, y, stickerTool.sticker);
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
        undoStack.push(lines.pop());
        redoStack = [];
        const event = new Event("drawing-changed");
        canvas.dispatchEvent(event);
    }
})

redoButton.addEventListener("click", () => {
    if (undoStack.length > 0) {
        lines.push(undoStack.pop()!);
        const event = new Event("drawing-changed");
        canvas.dispatchEvent(event);
    }
})

app.append(button, undoButton, redoButton, thinMarker, thickMarker, sticker1, sticker2, sticker3);



