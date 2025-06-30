import GridRender from "./GridRender.js";
import ColumnManager from "./ColumnManager.js";
import RowManager from "./RowManager.js";
import Cell from "./Cell.js";
import SelectionManager from "./SelectionManager.js";
import ScrollManager from "./ScrollManager.js";

class ExcelApp {
    constructor() {
        const {
            canvas, editor, input,
            rowTop, rowBottom, colLeft, colRight,
            contextMenu, menuButtons
        } = this.createUI();

        this.renderer = new GridRender(
            ColumnManager,
            RowManager,
            Cell,
            SelectionManager,
            ScrollManager,
            canvas,
            editor,
            input,
            rowTop, rowBottom, colLeft, colRight,
            contextMenu, menuButtons
        );
    }

    createUI() {
        const container = document.createElement("div");
        container.id = "container";

        const excelHeading = document.createElement("div");
        excelHeading.id = "excelHeading";

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

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.id = "jsonInput";

        const colRight = document.createElement("button");
        colRight.id = 'colRight';
        colRight.innerHTML = "colRight";

        const rowTop = document.createElement("button");
        rowTop.id = 'rowTop';
        rowTop.innerHTML = 'rowTop';

        const colLeft = document.createElement("button");
        colLeft.id = 'colLeft';
        colLeft.innerHTML = "colLeft";

        const rowBottom = document.createElement("button");
        rowBottom.id = 'rowBottom';
        rowBottom.innerHTML = 'rowBottom';

        const insertRowCol = document.createElement('div');
        insertRowCol.appendChild(colRight);
        insertRowCol.appendChild(colLeft);
        insertRowCol.appendChild(rowTop);
        insertRowCol.appendChild(rowBottom);




        const hScroll = document.createElement("div");
        hScroll.id = "h-scrollbar";
        const hThumb = document.createElement("div");
        hThumb.id = "h-thumb";
        hScroll.appendChild(hThumb);

        const vScroll = document.createElement("div");
        vScroll.id = "v-scrollbar";
        const vThumb = document.createElement("div");
        vThumb.id = "v-thumb";
        vScroll.appendChild(vThumb);


  excelHeading.appendChild(title);
        excelHeading.appendChild(input)
excelHeading.appendChild(infoDiv)
excelHeading.appendChild(insertRowCol)

        // ✅ Add context menu with buttons
        const contextMenu = document.createElement("div");
        contextMenu.id = "contextMenu";
        contextMenu.style.cssText = `
            position: absolute;
            display: none;
            background: white;
            border: 1px solid #ccc;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 999;

                width: 135px;
    height: 130px;
 
   
     
    display: flex
;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
        `;

        const menuButtons = {
            insertRowAbove: document.createElement("button"),
            insertRowBelow: document.createElement("button"),
            insertColLeft: document.createElement("button"),
            insertColRight: document.createElement("button")
        };

        menuButtons.insertRowAbove.innerText = "Insert Row Above";
        menuButtons.insertRowBelow.innerText = "Insert Row Below";
        menuButtons.insertColLeft.innerText = "Insert Col Left";
        menuButtons.insertColRight.innerText = "Insert Col Right";

        for (let key in menuButtons) {
            contextMenu.appendChild(menuButtons[key]);
        }

        // container.appendChild(title);
        // container.appendChild(input);
        // container.appendChild(infoDiv);
        // container.appendChild(rowTop);
        // container.appendChild(rowBottom);
        // container.appendChild(colLeft);
        // container.appendChild(colRight);
        container.appendChild(excelHeading)
        container.appendChild(canvas);
        container.appendChild(editor);
        container.appendChild(hScroll);
        container.appendChild(vScroll);
        container.appendChild(contextMenu); // ✅ Add context menu

        document.body.appendChild(container);

        window.addEventListener('resize', () => {
            this.renderer.resizeCanvas()
        });

        return {
            canvas, editor, input,
            rowTop, rowBottom, colLeft, colRight,
            contextMenu, menuButtons
        };
    }
}

const app = new ExcelApp();
