import "./style.css";

const APP_NAME = "upfated";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;


const header = document.createElement("h1");
const canvas = document.createElement("canvas")
app.append(header)

const ctx = canvas.getContext("2d");
ctx.fillStyle = "green";

canvas.width = 256
canvas.height = 256;


ctx?.fillRect(0,0,canvas.width,canvas.height)
app.append(canvas)

const cursor = {active: false, x: 0, y:0};


canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
})

canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        ctx?.beginPath()
        ctx?.moveTo(cursor.x, cursor.y)
        ctx?.lineTo(e.offsetX,e.offsetY);
        ctx?.stroke();
        cursor.x = e.offsetX
        cursor.y = e.offsetY;

    }
})

canvas.addEventListener("mouseup", (e) => {
    cursor.active = false;
})

const button = document.createElement("button")
button.id = "clearButton"
button.innerHTML = "clear"

button.addEventListener("click", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
})

app.append(button)



