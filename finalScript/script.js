import GridRender from "./GridRender.js";
import ColumnManager from "./ColumnManager.js";
import RowManager from "./RowManager.js";
import Cell from "./Cell.js";
import SelectionManager from "./SelectionManager.js";
import ScrollManager from "./ScrollManager.js";

class ExcelApp {
    constructor() {
        const { canvas, editor, input,rowTop,rowBottom,colLeft,colRight } = this.createUI();
        console.log("canvas", canvas, "editor", editor);
        // Now use `canvas` and `editor` directly
        this.renderer = new GridRender(
            ColumnManager,
            RowManager,
            Cell,
            SelectionManager,
            ScrollManager,
            canvas,
            editor,
            input,
            rowTop,rowBottom,colLeft,colRight
        );
    }

    createUI() {
        const container = document.createElement("div");
        container.id = "container";

        const title = document.createElement("h1");
        title.textContent = "EXCEL CLONE";

        const infoDiv = document.createElement("div");
        infoDiv.innerHTML = `
            count: <span id="count">0</span>,
            min: <span id="min">0</span>,
            max: <span id="max">0</span>,
            sum: <span id="sum">0</span>,
            average: <span id="average">0</span>
        `;

        const canvas = document.createElement("canvas");
        canvas.id = "spreadsheet";
        canvas.width = 1000;
        canvas.height = 600;

        const editor = document.createElement("input");
        editor.id = "cellEditor";
        editor.type = "text";
        editor.style.position = "absolute";
        editor.style.display = "none";

        const hScroll = document.createElement("div");
        hScroll.id = "h-scrollbar";
        const hThumb = document.createElement("div");
        hThumb.id = "h-thumb";
        hScroll.appendChild(hThumb);


        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.id = "jsonInput";

        const colRight = document.createElement("button");
        colRight.id = 'colRight';
        colRight.innerHTML="colRight"
        const rowTop = document.createElement("button");
        rowTop.id = 'rowTop';
        rowTop.innerHTML='rowTop'
        const colLeft = document.createElement("button");
        colLeft.id = 'colLeft';
        colLeft.innerHTML="colLeft"
        const rowBottom = document.createElement("button");
        rowBottom.id = 'rowBottom';
        rowBottom.innerHTML='rowBottom'



        const vScroll = document.createElement("div");
        vScroll.id = "v-scrollbar";
        const vThumb = document.createElement("div");
        vThumb.id = "v-thumb";
        vScroll.appendChild(vThumb);

        container.appendChild(title);
        container.appendChild(input);
        container.appendChild(infoDiv);
        container.appendChild(rowTop);
        container.appendChild(rowBottom);
        container.appendChild(colLeft);
        container.appendChild(colRight);
        container.appendChild(canvas);
        container.appendChild(editor);
        container.appendChild(hScroll);
        container.appendChild(vScroll);
 
        document.body.appendChild(container);
        window.addEventListener('resize', () => {
            this.renderer.resizeCanvas()
        })
        // Return canvas and editor so we don’t use getElementById later
        return { canvas, editor, input,rowTop,rowBottom,colLeft,colRight };
    }
}


// const GridObj = new GridRender()

const app = new ExcelApp();

