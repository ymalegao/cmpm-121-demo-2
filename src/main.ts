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

function createLine(startX: number, startY: number): DrawObject {
    let points: Array<{x: number, y: number}> = [{x: startX, y: startY}];

    return {
        drag(x:number, y:number) {
            points.push({x, y});
        },
        display(ctx: CanvasRenderingContext2D) {
            if (points.length === 0) return;
            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((point) => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }
    }
}




const lines: Array<DrawObject> = [];
let currentLine: DrawObject | null = null;
const undoStack: Array<DrawObject> = [];
let redoStack: Array<DrawObject> = [];

const cursor = {active: false, x: 0, y:0};



canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine = createLine(cursor.x, cursor.y);
    lines.push(currentLine);
})

canvas.addEventListener("mousemove", (e) => {
    if (cursor.active && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        const event = new Event("drawing-changed");
        canvas.dispatchEvent(event);

    }
});

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;
})

canvas.addEventListener("drawing-changed", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach((line) => {
        line.display(ctx!);
    });


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

app.append(button, undoButton, redoButton)



