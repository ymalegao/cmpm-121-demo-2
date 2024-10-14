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

const cursor = {active: false, x: 0, y:0};

let lines: Array<Array<{x: number, y: number}>> = [];
let currentLine: Array<{x: number, y: number}> = [];
let undoStack: Array<Array<{x: number, y: number}>> = [];
let redoStack: Array<Array<{x: number, y: number}>> = [];



canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine = [{x: cursor.x, y: cursor.y}];
    lines.push(currentLine);
})

canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        const newPoint = {x: e.offsetX, y: e.offsetY};
        currentLine.push(newPoint);

        const event = new Event("drawing-changed");
        canvas.dispatchEvent(event);

        cursor.x = e.offsetX;
        cursor.y = e.offsetY;

    }
});

canvas.addEventListener("mouseup", (e) => {
    cursor.active = false;
})

canvas.addEventListener("drawing-changed", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    ctx?.beginPath();
    lines.forEach((line) => {
        ctx?.moveTo(line[0].x, line[0].y);
        line.forEach((point) => {
            ctx?.lineTo(point.x, point.y);
        });
    });
    ctx?.stroke()


});


button.addEventListener("click", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    lines = []
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



