import Config from "./Config.js";
import Cell from "./Cell.js";
import { CommandHistory } from "./CommandManager.js";
import { CellEditCommand, ResizeCommand } from "./CommandManager.js";


export default class GridRender {
    constructor(ColumnManager, RowManager, Cell, SelectionManager, ScrollManager, canvas, editor, input, rowTop,rowBottom,colLeft,colRight) {

        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.colManager = new ColumnManager();
        this.rowManager = new RowManager();
        this.input = input;
        this.cellMap = new Map();
        this.selectionManager = new SelectionManager;

        this.rowTop = rowTop;
        this.rowBottom = rowBottom;
        this.colLeft=colLeft;
        this.colRight=colRight;
        this.editor = editor;


        this.colManager = new ColumnManager();
        this.rowManager = new RowManager();
        this.selectionManager = new SelectionManager();
        this.cell = new Cell();
        // In your GridRender constructor:
        this.editingCell = { row: null, col: null };
        this.commandHistory = new CommandHistory();
        this.scrollManager = new ScrollManager(this.canvas, this.rowManager, this.colManager, () => {
            this.drawGrid();
            this.updateEditorPosition(this.cellMap);
        });
        this.resizingTarget = null; // { type: "row"/"col", index, start, original }


        this.prevCell = null;
        this.currCell = null;
        this.prevVal = "";
        this.currVal = "";
        this.resizeCanvas();
        this.rendere(this.cellMap);
        this.updateEditorPosition(this.cellMap);
        this.bindResizeHandlers();

    }


    bindResizeHandlers() {
        const edgeThreshold = 5;

        this.canvas.addEventListener("pointermove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // console.log(rect.top)
            const visibleRange = this.scrollManager.getVisibleRange();

            if (!this.resizingTarget) {
                this.canvas.style.cursor = "default";

                // Check row edge
                if (x < Config.ROW_HEADER_WIDTH) {
                    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
                        const yStart = Config.COL_HEADER_HEIGHT + this.rowManager.getOffset(row) - this.scrollManager.scrollY;
                        const edgeY = yStart + this.rowManager.getHeight(row);
                        if (y >= edgeY - edgeThreshold && y <= edgeY + edgeThreshold) {
                            this.canvas.style.cursor = "row-resize";
                            break;
                        }
                    }
                }
                // Check col edge
                else if (y < Config.COL_HEADER_HEIGHT) {
                    for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
                        const xStart = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(col) - this.scrollManager.scrollX;
                        const edgeX = xStart + this.colManager.getWidth(col);
                        if (x >= edgeX - edgeThreshold && x <= edgeX + edgeThreshold) {
                            this.canvas.style.cursor = "col-resize";
                            break;
                        }
                    }
                }
            }

            // Active resize
            // Inside pointermove, during active resize:
            if (this.resizingTarget) {
                const delta = this.resizingTarget.type === "row"
                    ? e.clientY - this.resizingTarget.start
                    : e.clientX - this.resizingTarget.start;

                const newSize = Math.max(
                    this.resizingTarget.type === "row" ? 20 : 30,
                    this.resizingTarget.original + delta
                );

                if (this.resizingTarget.type === "row") {
                    // Resize all selected rows
                    if (this.resizingTarget.selectedRows && this.resizingTarget.selectedRows.length > 1) {
                        for (const row of this.resizingTarget.selectedRows) {
                            const cmd = new ResizeCommand("row", this.rowManager, row, this.rowManager.getHeight(row), newSize);
                            this.commandHistory.execute(cmd);
                        }
                    } else {
                        const cmd = new ResizeCommand("row", this.rowManager, this.resizingTarget.index, this.resizingTarget.original, newSize);
                        this.commandHistory.execute(cmd);
                    }
                } else {
                    // Resize all selected columns
                    if (this.resizingTarget.selectedCols && this.resizingTarget.selectedCols.length > 1) {
                        for (const col of this.resizingTarget.selectedCols) {
                            const cmd = new ResizeCommand("col", this.colManager, col, this.colManager.getWidth(col), newSize);
                            this.commandHistory.execute(cmd);
                        }
                    } else {
                        const cmd = new ResizeCommand("col", this.colManager, this.resizingTarget.index, this.resizingTarget.original, newSize);
                        this.commandHistory.execute(cmd);
                    }
                }

                this.scrollManager.updateScrollbars();
                this.drawGrid();
            }
        });

        this.canvas.addEventListener("pointerdown", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const visibleRange = this.scrollManager.getVisibleRange();

            // Check row resize
            // Check row resize
            if (x < Config.ROW_HEADER_WIDTH) {
                for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
                    const yStart = Config.COL_HEADER_HEIGHT + this.rowManager.getOffset(row) - this.scrollManager.scrollY;
                    const edgeY = yStart + this.rowManager.getHeight(row);
                    if (y >= edgeY - edgeThreshold && y <= edgeY + edgeThreshold) {
                        // Get selected rows
                        const { startRow, endRow } = this.selectionManager.getSelectedRange();
                        let selectedRows = [];
                        for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
                            selectedRows.push(r);
                        }
                        this.resizingTarget = {
                            type: "row",
                            index: row,
                            start: e.clientY,
                            original: this.rowManager.getHeight(row),
                            selectedRows // <-- store selected rows
                        };
                        return;
                    }
                }
            }
            // 78909876543353543544
            // Check col resize123456789
            // asdf
            // asdf
            // Inside pointerdown, when starting column resize:
            if (y < Config.COL_HEADER_HEIGHT) {
                for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
                    const xStart = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(col) - this.scrollManager.scrollX;
                    const edgeX = xStart + this.colManager.getWidth(col);
                    if (x >= edgeX - edgeThreshold && x <= edgeX + edgeThreshold) {
                        // Get selected columns
                        const { startCol, endCol } = this.selectionManager.getSelectedRange();
                        let selectedCols = [];
                        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
                            selectedCols.push(c);
                        }
                        this.resizingTarget = {
                            type: "col",
                            index: col,
                            start: e.clientX,
                            original: this.colManager.getWidth(col),
                            selectedCols // <-- store selected columns
                        };
                        return;
                    }
                }
            }
        });

        this.canvas.addEventListener("pointerup", () => {
            if (this.resizingTarget) {
                const { type, index, original } = this.resizingTarget;
                const newSize = type === "row"
                    ? this.rowManager.getHeight(index)
                    : this.colManager.getWidth(index);

                const cmd = new ResizeCommand(type, type === "row" ? this.rowManager : this.colManager, index, original, newSize);
                this.commandHistory.execute(cmd);
            }
            this.resizingTarget = null;
            this.canvas.style.cursor = "default";
        });
    }

    insertColumnRight() {
        const { startCol } = this.selectionManager.getSelectedRange();
        const insertIndex = startCol + 1;

        const newMap = new Map();

        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(",").map(Number);

            if (col >= insertIndex) {
                newMap.set(`${row},${col + 1}`, cell); // Shift right
            } else {
                newMap.set(key, cell); // Keep as-is
            }
        }

        this.cellMap = newMap;
        this.colManager.insertColumn(insertIndex); // You need to implement this
        Config.totalCols++;
        this.drawGrid();
    }
    insertRowBelow() {
        const { startRow } = this.selectionManager.getSelectedRange();
        const insertIndex = startRow + 1;

        const newMap = new Map();

        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(",").map(Number);

            if (row >= insertIndex) {
                newMap.set(`${row + 1},${col}`, cell); // Shift down
            } else {
                newMap.set(key, cell); // Keep as-is
            }
        }

        this.cellMap = newMap;
        this.rowManager.insertRow(insertIndex); // You need to implement this
         Config.totalRows++; // 👈 Increase row count
        this.drawGrid();
    }
    insertRowAbove() {
        const { startRow } = this.selectionManager.getSelectedRange();
        const insertIndex = startRow; // Insert above the current row

        const newMap = new Map();

        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(",").map(Number);

            if (row >= insertIndex) {
                newMap.set(`${row + 1},${col}`, cell); // Shift down
            } else {
                newMap.set(key, cell);
            }
        }

        this.cellMap = newMap;
        this.rowManager.insertRow(insertIndex); // Same helper used
          Config.totalRows++; // 👈 Increase row count
        this.drawGrid();
    }
    insertColumnLeft() {
        const { startCol } = this.selectionManager.getSelectedRange();
        const insertIndex = startCol; // Insert to the left of current

        const newMap = new Map();

        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(",").map(Number);

            if (col >= insertIndex) {
                newMap.set(`${row},${col + 1}`, cell); // Shift right
            } else {
                newMap.set(key, cell);
            }
        }

        this.cellMap = newMap;
        this.colManager.insertColumn(insertIndex); // Same helper used
        Config.totalCols++;
        this.drawGrid();
    }


    drawGrid() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const range = this.scrollManager.getVisibleRange();
        const { startRow, endRow, startCol, endCol } = this.selectionManager.getSelectedRange();

        // Save context for clipping
        ctx.save();

        // Draw column headers (always visible, no clipping needed)
        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(Config.ROW_HEADER_WIDTH, 0, ctx.canvas.width - Config.ROW_HEADER_WIDTH, Config.COL_HEADER_HEIGHT);

        for (let col = range.startCol; col <= range.endCol; col++) {

            const x = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(col) - this.scrollManager.scrollX;
            const width = this.colManager.getWidth(col);

            if (x + width < Config.ROW_HEADER_WIDTH || x > ctx.canvas.width) continue;
            // 🔵 Highlight if column is selected
            ctx.fillStyle = (col >= startCol && col <= endCol) ? '#CAEAD8' : '#f3f3f3';
            ctx.fillRect(x, 0, width, Config.COL_HEADER_HEIGHT);

            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(x, 0, width, Config.COL_HEADER_HEIGHT);

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(this.getColName(col), x + 5, 16);
        }

        // Draw row headers (always visible, no clipping needed)
        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(0, Config.COL_HEADER_HEIGHT, Config.ROW_HEADER_WIDTH, ctx.canvas.height - Config.COL_HEADER_HEIGHT);

        for (let row = range.startRow; row <= range.endRow; row++) {
            const y = Config.COL_HEADER_HEIGHT + this.rowManager.getOffset(row) - this.scrollManager.scrollY;
            const height = this.rowManager.getHeight(row);

            if (y + height < Config.COL_HEADER_HEIGHT || y > ctx.canvas.height) continue;
            // 🔵 Highlight if row is selected
            ctx.fillStyle = (row >= startRow && row <= endRow) ? '#caead8' : '#f3f3f3';
            ctx.fillRect(0, y, Config.ROW_HEADER_WIDTH, height);
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(0, y, Config.ROW_HEADER_WIDTH, height);

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(row + 1, 5, y + height / 2 + 4);
        }

        // Clip the cell area to prevent overlap with headers
        ctx.beginPath();
        ctx.rect(Config.ROW_HEADER_WIDTH, Config.COL_HEADER_HEIGHT,
            ctx.canvas.width - Config.ROW_HEADER_WIDTH,
            ctx.canvas.height - Config.COL_HEADER_HEIGHT);
        ctx.clip();

        this.cellMap.forEach(cell => cell.compute(this.cellMap));

        // Draw cells (clipped to cell area)
        for (let row = range.startRow; row <= range.endRow; row++) {
            for (let col = range.startCol; col <= range.endCol; col++) {
                const x = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(col) - this.scrollManager.scrollX;
                const y = Config.COL_HEADER_HEIGHT + this.rowManager.getOffset(row) - this.scrollManager.scrollY;
                const width = this.colManager.getWidth(col);
                const height = this.rowManager.getHeight(row);

                const key = `${row},${col}`;
                const cell = this.cellMap.get(key);

                if (cell) {
                    cell.draw(ctx, x, y, width, height);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(x, y, width, height);
                    ctx.strokeStyle = '#eee';
                    ctx.strokeRect(x, y, width, height);
                }
            }
        }

        // Draw selection (also clipped)
        this.selectionManager.drawSelection(ctx, this.rowManager, this.colManager, this.scrollManager);

        // Restore context
        ctx.restore();

        // Draw header borders on top (not clipped)
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        // Vertical line separating row headers
        ctx.beginPath();
        ctx.moveTo(Config.ROW_HEADER_WIDTH, 0);
        ctx.lineTo(Config.ROW_HEADER_WIDTH, ctx.canvas.height);
        ctx.stroke();
        // Horizontal line separating column headers  
        ctx.beginPath();
        ctx.moveTo(0, Config.COL_HEADER_HEIGHT);
        ctx.lineTo(ctx.canvas.width, Config.COL_HEADER_HEIGHT);
        ctx.stroke();
    }
    loadData(dataArray) {
        for (const item of dataArray) {
            const row = item.id - 1; // 0-based index
            this.cellMap.set(`${row},0`, new Cell(item.id.toString()));
            this.cellMap.set(`${row},1`, new Cell(item.firstName));
            this.cellMap.set(`${row},2`, new Cell(item.lastName));
            this.cellMap.set(`${row},3`, new Cell(item.Age.toString()));
            this.cellMap.set(`${row},4`, new Cell(item.Salary.toString()));
        }

        this.drawGrid();
    }
    getColName(index) {
        let name = '';
        while (index >= 0) {
            name = String.fromCharCode((index % 26) + 65) + name;
            index = Math.floor(index / 26) - 1;
        }
        return name;
    }
    // Resize canvas to fit viewport
    resizeCanvas() {
        this.canvas.width = window.innerWidth - 17; // Account for scrollbar
        this.canvas.height = window.innerHeight - 17; // Account for scrollbar
        this.scrollManager.updateScrollbars();
        this.drawGrid();
    }

    commitEditorChange(startRow, startCol) {
        console.log("comiteditorchange")
        console.log(startRow, startCol)
        const key = `${startRow},${startCol}`;

        const newValue = this.editor.value == "" ? this.prevVal : this.editor.value;
        const oldValue = this.editor.dataset.originalValue;


        if (newValue === oldValue) return; // nothing changed
        if (!this.cellMap.has(key)) {
            this.cellMap.set(key, new Cell());
        }

        const cell = this.cellMap.get(key);
        const command = new CellEditCommand(cell, newValue);
        this.commandHistory.execute(command);

        this.cellMap.forEach(c => c.compute(this.cellMap));
        this.drawGrid();

        this.editor.dataset.originalValue = newValue;
    }


    rendere() {
        this.colLeft.addEventListener("click", () => {
            this.insertColumnLeft();
        })
        this.colRight.addEventListener("click", () => {
            this.insertColumnRight();
        })
        this.rowBottom.addEventListener("click", () => {
            this.insertRowBelow();
        })
        this.rowTop.addEventListener("click", () => {
            this.insertRowAbove();
        })
        this.editor.addEventListener("input", () => {
            // Optional: prevent accidental blur on mousedown elsewhere
            this.currVal = this.editor.value;
        });
        this.input.addEventListener("change", (e) => {

            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);

                    if (!Array.isArray(jsonData)) {
                        alert("Invalid JSON format");
                        return;
                    }
                    console.log(jsonData);
                    this.loadData(jsonData);
                } catch (err) {
                    alert("Invalid JSON file.");
                    console.error(err);
                }
            };

            reader.readAsText(file);

        });
        this.editor.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {
                const { startRow, startCol } = this.selectionManager.getSelectedRange();
                this.commitEditorChange(startRow, startCol);
                this.editor.blur(); // hide editor
            }
        });
        this.editor.addEventListener("blur", () => {
            this.prevVal = this.currVal;
            this.currVal = "";


            const { startRow, startCol } = this.selectionManager.getSelectedRange();
            if (this.prevCell == null) return;

            const { row, col } = this.prevCell;

            console.log(startRow, startCol)
            console.log("row,col: ", row, col)


            this.commitEditorChange(row, col); // Only commit if changed 
        });

        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "z") {
                this.commandHistory.undo();
                this.updateEditorPosition(this.cellMap);
                this.drawGrid();
            }
            if (e.ctrlKey && e.key === "y") {
                this.commandHistory.redo();
                this.updateEditorPosition(this.cellMap);
                this.drawGrid();
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {

                Config.isDragging = false;
                Config.dragStartCell = null;
                this.drawGrid(); // Keep selection intact
            }
        });




        // Handle pointer events for dragging and editing
        this.canvas.addEventListener("pointerdown", (e) => {
            this.prevCell = this.currCell;


            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const isInColHeader = y < Config.COL_HEADER_HEIGHT && x > Config.ROW_HEADER_WIDTH;
            const isInRowHeader = x < Config.ROW_HEADER_WIDTH && y > Config.COL_HEADER_HEIGHT;
            const cell = this.cell.getCellAtPosition(x, y, this.rowManager, this.colManager, this.scrollManager);
            this.currCell = cell;
            if (!cell) return;

            if (!cell) return;
            console.log("-----------------")
            console.log(this.currCell)
            console.log(this.prevCell)
            console.log("-----------------")

            if (cell.headerType === "column") {
                const colXStart = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(cell.col) - this.scrollManager.scrollX;
                const colWidth = this.colManager.getWidth(cell.col);
                const edgeThreshold = 5;

                // Skip selection if clicked near right edge (intended for resizing)
                if (x >= colXStart + colWidth - edgeThreshold && x <= colXStart + colWidth + edgeThreshold) {
                    return; // near edge → do not select column
                }


                Config.selectionMode = "column";
                this.selectionManager.setStart(0, cell.col);
                this.selectionManager.setEnd(Config.totalRows - 1, cell.col);

                this.drawGrid();
                this.editor.style.display = "none"; // Don’t show input for headers

            }

            if (cell.headerType === "row") {
                const rowYStart = Config.COL_HEADER_HEIGHT + this.rowManager.getOffset(cell.row) - this.scrollManager.scrollY;
                const rowHeight = this.rowManager.getHeight(cell.row);
                const edgeThreshold = 5;

                // Skip selection if clicked near bottom edge (intended for resizing)
                if (y >= rowYStart + rowHeight - edgeThreshold && y <= rowYStart + rowHeight + edgeThreshold) {
                    console.log("retuned")
                    return; // near edge → do not select row
                }

                Config.selectionMode = "row";
                this.selectionManager.setStart(cell.row, 0);
                this.selectionManager.setEnd(cell.row, Config.totalCols - 1);
                this.drawGrid();
                this.editor.style.display = "none"; // Don’t show input for headers

            }

            if (cell.headerType === "corner") {
                Config.selectionMode = "corner";
                this.selectionManager.setStart(0, 0);
                this.selectionManager.setEnd(Config.totalRows - 1, Config.totalCols - 1);
                this.drawGrid();
                this.editor.style.display = "none"; // Don’t show input for headers
                return;
            }
            const { row, col } = cell;

            this.editingCell = { row, col }; // Store the cell being edited
            if (isInColHeader) {
                Config.dragStartCell = cell;


                Config.isDragging = true;
                this.selectionManager.setColumnSelection(col);

            } else if (isInRowHeader) {
                console.log("is in row header" + row)
                Config.dragStartCell = cell;


                Config.isDragging = true;
                this.selectionManager.setRowSelection(row);
            } else {
                console.log("settingh the start and end cell", row, col)
                this.selectionManager.setStart(row, col);
                this.selectionManager.setEnd(row, col);


                const key = `${row},${col}`;
                if (!this.cellMap.has(key)) {
                    this.cellMap.set(key, new Cell(""));
                }
                Config.dragStartCell = cell;


                Config.isDragging = true;
                const cellObj = this.cellMap.get(key);
                const cellLeft = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(col) - this.scrollManager.scrollX;
                const cellTop = Config.COL_HEADER_HEIGHT + this.rowManager.getOffset(row) - this.scrollManager.scrollY;
                const width = this.colManager.getWidth(col);
                const height = this.rowManager.getHeight(row);

                const canvasRect = this.canvas.getBoundingClientRect();

                // Prevent input from overlapping row/col headers
                if (cellLeft < Config.ROW_HEADER_WIDTH || cellTop < Config.COL_HEADER_HEIGHT) {
                    this.editor.style.display = "none"; // Hide if overlapping header
                    return;
                }

                this.editor.style.left = canvasRect.left + cellLeft + 1 + "px";
                this.editor.style.top = canvasRect.top + cellTop + 1 + "px";
                this.editor.style.width = width + "px";
                this.editor.style.height = height + "px";
                // this.editor.style.display = "block";


                // this.editor.value = cellObj.value || ""; // Set input value to cell value

                this.editor.value = cellObj.value || "";

                this.editor.dataset.originalValue = this.editor.value; // ✅ Set once
                this.editor.style.display = "block";
                setTimeout(() => {
                    this.editor.focus();
                    // editor.select(); // Optional: select all content
                }, 1);
                this.drawGrid();
                // this.editor.focus();
            }




        });

        // Handle pointer move for dragging selection
        this.canvas.addEventListener("pointermove", (e) => {
            if (!Config.dragStartCell || !Config.isDragging) return;


            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.cell.getCellAtPosition(x, y, this.rowManager, this.colManager, this.scrollManager);
            if (!cell) return;
            const isInColHeader = y < Config.COL_HEADER_HEIGHT && x > Config.ROW_HEADER_WIDTH;
            const isInRowHeader = x < Config.ROW_HEADER_WIDTH && y > Config.COL_HEADER_HEIGHT;

            if (isInColHeader || Config.dragStartCell.headerType == 'column') {
                this.selectionManager.setColumnSelection(cell.col, true);

            } else if (isInRowHeader || Config.dragStartCell.headerType == 'row') {
                this.selectionManager.setRowSelection(cell.row, true);
            } else {
                this.selectionManager.setEnd(cell.row, cell.col);
            }

            this.selectionManager.computeSelectionStats(this.cellMap);
            this.drawGrid();

        });

        // Handle pointer up to finalize dragging
        this.canvas.addEventListener("pointerup", () => {
            // alert('pointer up')

            Config.isDragging = false;
            Config.dragStartCell = null;
        });


    }
    updateEditorPosition(cellMap) {
        console.log("update")
        const { startRow, endRow, startCol, endCol } = this.selectionManager.getSelectedRange();
        const key = `${startRow},${startCol}`;
        if (!cellMap.has(key)) return;

        const cellLeft = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(startCol) - this.scrollManager.scrollX;
        const cellTop = Config.COL_HEADER_HEIGHT + this.rowManager.getOffset(startRow) - this.scrollManager.scrollY;
        const width = this.colManager.getWidth(startCol);
        const height = this.rowManager.getHeight(startRow);

        const canvasRect = this.canvas.getBoundingClientRect();

        if (cellLeft < Config.ROW_HEADER_WIDTH || cellTop < Config.COL_HEADER_HEIGHT) {
            this.editor.style.display = "none";
            return;
        }
        this.editor.style.left = canvasRect.left + cellLeft + "px";
        this.editor.style.top = canvasRect.top + cellTop + "px";
        this.editor.style.width = width + "px";
        this.editor.style.height = height + "px";
        this.editor.style.display = "none";
    }

    saveInputValueToCell() {


        const { startRow, endRow, startCol, endCol } = this.selectionManager.getSelectedRange();

        const key = `${startRow},${startCol}`;
        if (!this.cellMap.has(key)) {
            this.cellMap.set(key, new Cell());
        }
        const cell = this.cellMap.get(key);
        // const command = new CellEditCommand(cell, this.editor.value);
        // this.commandHistory.execute(command);
        cell.setValue(this.editor.value);

        this.cellMap.forEach(c => c.compute(this.cellMap));

        this.drawGrid();

    }

}