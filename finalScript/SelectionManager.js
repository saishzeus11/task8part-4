import Config from "./Config.js";
export default class SelectionManager {
    constructor() {
        this.startCell = { row: 0, col: 0 };
        this.endCell = { row: 0, col: 0 };
    }

    setStart(row, col) {
        this.startCell = { row, col };
        this.endCell = { row, col };
    }

    setEnd(row, col) {
        this.endCell = { row, col };
    }

    getSelectedRange() {
        if (!this.startCell || !this.endCell) {
            return null;
        }
        const minRow = Math.min(this.startCell.row, this.endCell.row);
        const maxRow = Math.max(this.startCell.row, this.endCell.row);
        const minCol = Math.min(this.startCell.col, this.endCell.col);
        const maxCol = Math.max(this.startCell.col, this.endCell.col);

        return { startRow: minRow, endRow: maxRow, startCol: minCol, endCol: maxCol };
    }
    setRowSelection(row, dragging = false) {
        if (!dragging) {
            this.startCell = { row, col: 0 };
        }
        this.endCell = { row, col: Config.totalCols - 1 };
    }

    setColumnSelection(col, dragging = false) {

        if (!dragging) {

            this.startCell = { row: 0, col };
        }
        this.endCell = { row: Config.totalRows - 1, col };
    }


    drawSelection(ctx, rowManager, colManager, scrollManager) {

        if (!this.startCell || !this.endCell) return;

        const { startRow, endRow, startCol, endCol } = this.getSelectedRange();

        // Detect selection type and log it
        if (startRow === 0 && endRow === Config.totalRows - 1 && startCol === endCol) {
            console.log("Column selection");
        } else if (startCol === 0 && endCol === Config.totalCols - 1 && startRow === endRow) {
            console.log("Row selection");
        } else {
            console.log("Normal selection");
        }

        //change in this if a column or row header is clicked take all the selection and not loop it 

        // Compute outer box
        const startX = Config.ROW_HEADER_WIDTH + colManager.getOffset(startCol) - scrollManager.scrollX;
        const startY = Config.COL_HEADER_HEIGHT + rowManager.getOffset(startRow) - scrollManager.scrollY;
        const width =
            colManager.getOffset(endCol) + colManager.getWidth(endCol) - colManager.getOffset(startCol);
        const height =
            rowManager.getOffset(endRow) + rowManager.getHeight(endRow) - rowManager.getOffset(startRow);

        if (startRow == 0 && startCol == 0 && endRow == 0 && endCol == 0) {
            ctx.fillStyle = 'rgba(255,255,255,0)';
        } else {
            ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
        }
        // Fill background of all selected cells
        console.log("col selc")
        console.log(startRow, startCol, endRow, endCol)

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                // If it's a column selection, skip the header cell (row 0 of the selected column)
                if (
                    startRow === 0 &&
                    endRow === Config.totalRows - 1 &&
                    startCol === endCol &&
                    row === 0
                ) {
                    continue;
                }
                // Skip the header cell for row selection
                if (
                    startCol === 0 &&
                    endCol === Config.totalCols - 1 &&
                    startRow === endRow &&
                    col === 0
                ) {
                    continue;
                }
                // If it's the very top-left cell (header), skip
                if (row === 0 && col === 0) continue;

                const x = Config.ROW_HEADER_WIDTH + colManager.getOffset(col) - scrollManager.scrollX;
                const y = Config.COL_HEADER_HEIGHT + rowManager.getOffset(row) - scrollManager.scrollY;
                const cellW = colManager.getWidth(col);
                const cellH = rowManager.getHeight(row);
                ctx.fillRect(x, y, cellW, cellH);
            }
        }

        // Draw outer border around entire selected region
        ctx.strokeStyle = '#137E43';

        if (startRow == 0 && startCol == 0 && endRow == 0 && endCol == 0) {
            ctx.lineWidth = 1;
        } else {
            ctx.lineWidth = 2;
        }

        ctx.strokeRect(startX, startY, width, height);

        // Draw distinct border around the starting cell (like Excel’s active cell)
        const activeX = Config.ROW_HEADER_WIDTH + colManager.getOffset(this.startCell.col) - scrollManager.scrollX;
        const activeY = Config.COL_HEADER_HEIGHT + rowManager.getOffset(this.startCell.row) - scrollManager.scrollY;
        const activeW = colManager.getWidth(this.startCell.col);
        const activeH = rowManager.getHeight(this.startCell.row);

        ctx.strokeStyle = '#137E43';
        ctx.lineWidth = 0.1;
        ctx.strokeRect(activeX + 1, activeY + 1, activeW - 2, activeH - 2); // inner bold border

        ctx.lineWidth = 1; // reset for other strokes
    }

    computeSelectionStats(cellMap) {
        const { startRow, endRow, startCol, endCol } = this.getSelectedRange();
        const values = [];

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const key = `${row},${col}`;
                const cell = cellMap.get(key);
                let val = cell?.getValue?.();

                if (typeof val === "string") val = val.trim();
                const num = parseFloat(val);

                if (!isNaN(num)) values.push(num); // Only add valid numbers
            }
        }

        const count = (endRow - startRow + 1) * (endCol - startCol + 1);
        const sum = values.reduce((acc, val) => acc + val, 0);
        if (!values) {
            min = 0;
            max = 0;
        } else {

        }
        let min = count > 0 ? Math.min(...values) : 0;
        let max = count > 0 ? Math.max(...values) : 0;

        if (!isFinite(min)) {
            min = 0;
        }
        if (!isFinite(max)) {
            max = 0;
        }


        const avg = count > 0 ? sum / values.length : 0;

        document.getElementById("count").textContent = count;
        document.getElementById("min").textContent = min.toFixed(2);
        document.getElementById("max").textContent = max.toFixed(2);
        document.getElementById("sum").textContent = sum.toFixed(2);
        document.getElementById("average").textContent = avg.toFixed(2);
    }


}



