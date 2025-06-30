

class Config {
    static ROW_HEADER_WIDTH = 50;
    static COL_HEADER_HEIGHT = 24;
    static totalRows = 100000;
    static totalCols = 1000;
    static isDragging = false;
    static dragStartCell = null;
}
class GridRender {
    constructor(ColumnManager, RowManager, Cell, SelectionManager, ScrollManager, canvas, editor) {

        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.colManager = new ColumnManager();
        this.rowManager = new RowManager();

        this.cellMap = new Map();
        this.selectionManager = new SelectionManager;

        this.editor = editor;

        this.colManager = new ColumnManager();
        this.rowManager = new RowManager();
        this.selectionManager = new SelectionManager();
        this.cell = new Cell();


        this.scrollManager = new ScrollManager(this.canvas, this.rowManager, this.colManager, () => {
            this.drawGrid();
            this.updateEditorPosition(this.cellMap);
        });
        this.resizeCanvas();
        this.rendere(this.cellMap);
        this.updateEditorPosition(this.cellMap);
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
            // console.log("hello")
            // console.log(this.colManager.getOffset(col), this.scrollManager.scrollX);
            const x = Config.ROW_HEADER_WIDTH + this.colManager.getOffset(col) - this.scrollManager.scrollX;
            const width = this.colManager.getWidth(col);

            if (x + width < Config.ROW_HEADER_WIDTH || x > ctx.canvas.width) continue;
            // 🔵 Highlight if column is selected
            ctx.fillStyle = (col >= startCol && col <= endCol) ? '#d0e8ff' : '#f3f3f3';
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
            ctx.fillStyle = (row >= startRow && row <= endRow) ? '#d0e8ff' : '#f3f3f3';
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

    rendere() {


        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {

                Config.isDragging = false;
                Config.dragStartCell = null;
                this.drawGrid(); // Keep selection intact
            }
        });

        // On input, stop dragging
        this.editor.addEventListener("input", (e) => {
            console.log("input event")
            console.log(" =>  ", this.selectionManager.getSelectedRange())
            this.saveInputValueToCell();


        });
        // Handle pointer events for dragging and editing
        this.canvas.addEventListener("pointerdown", (e) => {
            console.log("pointer down")
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const cell = this.cell.getCellAtPosition(x, y, this.rowManager, this.colManager, this.scrollManager);
            if (!cell) return;

            const { row, col } = cell;
            console.log("settingh the start and end cell", row, col)
            this.selectionManager.setStart(row, col);
            this.selectionManager.setEnd(row, col);
            this.drawGrid();

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
                editor.style.display = "none"; // Hide if overlapping header
                return;
            }

            this.editor.style.left = canvasRect.left + cellLeft + 1 + "px";
            this.editor.style.top = canvasRect.top + cellTop + 1 + "px";
            this.editor.style.width = width + "px";
            this.editor.style.height = height + "px";
            this.editor.style.display = "block";

            this.editor.value = cellObj.value || ""; // Set input value to cell value
            setTimeout(() => {
                // editor.focus();
                // editor.select(); // Optional: select all content
            }, 1);
            this.editor.focus();

        });

        // Handle pointer move for dragging selection
        this.canvas.addEventListener("pointermove", (e) => {
            if (!Config.dragStartCell) return;

            if (Config.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cell = this.cell.getCellAtPosition(x, y, this.rowManager, this.colManager, this.scrollManager);
                if (!cell) return;

                this.selectionManager.setEnd(cell.row, cell.col);
                this.drawGrid();
                this.selectionManager.computeSelectionStats(this.cellMap);
            } else {


            }
        });

        // Handle pointer up to finalize dragging
        this.canvas.addEventListener("pointerup", () => {
            // alert('pointer up')

            Config.isDragging = false;
            Config.dragStartCell = null;
        });


    }
    updateEditorPosition(cellMap) {
        const { startRow, endRow, startCol, endCol } = this.selectionManager.getSelectedRange();
        const key = `${startRow},${startCol}`;
        if (!cellMap.has(key)) return;

        const cellLeft = Config.ROW_HEADER_WIDTH + colManager.getOffset(startCol) - scrollManager.scrollX;
        const cellTop = Config.COL_HEADER_HEIGHT + rowManager.getOffset(startRow) - scrollManager.scrollY;
        const width = colManager.getWidth(startCol);
        const height = rowManager.getHeight(startRow);

        const canvasRect = canvas.getBoundingClientRect();

        if (cellLeft < Config.ROW_HEADER_WIDTH || cellTop < Config.COL_HEADER_HEIGHT) {
            editor.style.display = "none";
            return;
        }

        editor.style.left = canvasRect.left + cellLeft + "px";
        editor.style.top = canvasRect.top + cellTop + "px";
        editor.style.width = width + "px";
        editor.style.height = height + "px";
        editor.style.display = "none";
    }

    saveInputValueToCell() {


        const { startRow, endRow, startCol, endCol } = this.selectionManager.getSelectedRange();

        const key = `${startRow},${startCol}`;
        if (!this.cellMap.has(key)) {
            this.cellMap.set(key, new Cell());
        }
        const cell = this.cellMap.get(key);
        cell.setValue(this.editor.value);

        this.cellMap.forEach(c => c.compute(this.cellMap));

        this.drawGrid();

    }

}
// --- Row Manager ---
class RowManager {
    constructor(defaultHeight = 24) {
        this.heights = new Map();
        this.defaultHeight = defaultHeight;
    }

    getHeight(row) {
        return this.heights.get(row) ?? this.defaultHeight;
    }

    setHeight(row, height) {
        this.heights.set(row, height);
    }

    getOffset(row) {
        let offset = 0;
        for (let i = 0; i < row; i++) {
            offset += this.getHeight(i);
        }
        return offset;
    }

    getRowIndexAt(y) {
        let ry = 0;
        let row = 0;
        while (ry < y && row < Config.totalRows) {
            const h = this.getHeight(row);
            if (ry + h > y) return row;
            ry += h;
            row++;
        }
        return Math.min(row, Config.totalRows - 1);
    }

    getTotalHeight() {
        let total = 0;
        for (let i = 0; i < Config.totalRows; i++) {
            total += this.getHeight(i);
        }
        return total;
    }
}

// --- Column Manager ---
class ColumnManager {
    constructor(defaultWidth = 100) {
        this.widths = new Map();
        this.defaultWidth = defaultWidth;
    }

    getWidth(col) {
        return this.widths.get(col) ?? this.defaultWidth;
    }

    setWidth(col, width) {
        this.widths.set(col, width);
    }

    getOffset(col) {
        let offset = 0;
        for (let i = 0; i < col; i++) {
            offset += this.getWidth(i);
        }
        return offset;
    }

    getColIndexAt(x) {
        let cx = 0;
        let col = 0;
        while (cx < x && col < Config.totalCols) {
            const w = this.getWidth(col);
            if (cx + w > x) return col;
            cx += w;
            col++;
        }
        return Math.min(col, Config.totalCols - 1);
    }

    getTotalWidth() {
        let total = 0;
        for (let i = 0; i < Config.totalCols; i++) {
            total += this.getWidth(i);
        }
        return total;
    }
}

// --- Scrolling Manager ---
class ScrollManager {
    constructor(canvas, rowManager, colManager, onScroll) {
        this.canvas = canvas;
        this.rowManager = rowManager;
        this.colManager = colManager;
        this.onScroll = onScroll;
        this.scrollX = 0;
        this.scrollY = 0;
        this.attachWheelEvents();
        this.initScrollbars();
    }

    attachWheelEvents() {

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                // Horizontal scroll
                this.scrollX += Math.sign(e.deltaX || e.deltaY) * 30;

                this.scrollX = Math.max(0, Math.min(this.scrollX, this.getMaxScrollX()));

            } else {
                // Vertical scroll
                this.scrollY += Math.sign(e.deltaY) * 30;
                this.scrollY = Math.max(0, Math.min(this.scrollY, this.getMaxScrollY()));
            }

            this.updateScrollbars();
            if (this.onScroll) this.onScroll();
        });
    }

    initScrollbars() {
        this.initHorizontalScrollbar();
        this.initVerticalScrollbar();
    }

    initHorizontalScrollbar() {
        this.hScrollbar = document.getElementById('h-scrollbar');
        this.hThumb = document.getElementById('h-thumb');
        this.hDragging = false;

        this.hThumb.addEventListener('mousedown', (e) => {
            this.hDragging = true;
            this.hDragStartX = e.clientX;
            this.hScrollStartX = this.scrollX;
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (this.hDragging) {
                const dx = e.clientX - this.hDragStartX;
                const trackWidth = this.hScrollbar.offsetWidth - this.hThumb.offsetWidth;
                const maxScroll = this.getMaxScrollX();
                this.scrollX = Math.max(0, Math.min(this.hScrollStartX + dx * (maxScroll / trackWidth), maxScroll));
                this.updateScrollbars();
                if (this.onScroll) this.onScroll();
            }
        });

        window.addEventListener('mouseup', () => {
            this.hDragging = false;
            Config.isDragging = false;
            document.body.style.userSelect = '';
        });

        this.hScrollbar.addEventListener('click', (e) => {
            if (e.target === this.hThumb) return;
            const rect = this.hScrollbar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const thumbWidth = this.hThumb.offsetWidth;
            const trackWidth = this.hScrollbar.offsetWidth - thumbWidth;
            const maxScroll = this.getMaxScrollX();
            this.scrollX = Math.max(0, Math.min((clickX - thumbWidth / 2) * (maxScroll / trackWidth), maxScroll));
            this.updateScrollbars();
            if (this.onScroll) this.onScroll();
        });
    }

    initVerticalScrollbar() {
        this.vScrollbar = document.getElementById('v-scrollbar');
        this.vThumb = document.getElementById('v-thumb');
        this.vDragging = false;

        this.vThumb.addEventListener('mousedown', (e) => {
            this.vDragging = true;
            this.vDragStartY = e.clientY;
            this.vScrollStartY = this.scrollY;
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (this.vDragging) {
                const dy = e.clientY - this.vDragStartY;
                const trackHeight = this.vScrollbar.offsetHeight - this.vThumb.offsetHeight;
                const maxScroll = this.getMaxScrollY();
                this.scrollY = Math.max(0, Math.min(this.vScrollStartY + dy * (maxScroll / trackHeight), maxScroll));
                this.updateScrollbars();
                if (this.onScroll) this.onScroll();
            }
        });

        window.addEventListener('mouseup', () => {
            this.vDragging = false;
            document.body.style.userSelect = '';
        });

        this.vScrollbar.addEventListener('click', (e) => {
            if (e.target === this.vThumb) return;
            const rect = this.vScrollbar.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const thumbHeight = this.vThumb.offsetHeight;
            const trackHeight = this.vScrollbar.offsetHeight - thumbHeight;
            const maxScroll = this.getMaxScrollY();
            this.scrollY = Math.max(0, Math.min((clickY - thumbHeight / 2) * (maxScroll / trackHeight), maxScroll));
            this.updateScrollbars();
            if (this.onScroll) this.onScroll();
        });
    }

    getMaxScrollX() {
        const totalWidth = this.colManager.getTotalWidth();
        const visibleWidth = this.canvas.width - Config.ROW_HEADER_WIDTH;
        return Math.max(0, totalWidth - visibleWidth);
    }

    getMaxScrollY() {
        const totalHeight = this.rowManager.getTotalHeight();
        const visibleHeight = this.canvas.height - Config.COL_HEADER_HEIGHT;
        return Math.max(0, totalHeight - visibleHeight);
    }

    updateScrollbars() {
        this.updateHorizontalScrollbar();
        this.updateVerticalScrollbar();
    }

    updateHorizontalScrollbar() {

        const totalWidth = this.colManager.getTotalWidth();
        const visibleWidth = this.canvas.width - Config.ROW_HEADER_WIDTH;
        const trackWidth = this.hScrollbar.offsetWidth;
        const maxScroll = this.getMaxScrollX();

        let thumbWidth = Math.max(30, (visibleWidth / totalWidth) * trackWidth);
        let thumbLeft = maxScroll === 0 ? 0 : (this.scrollX / maxScroll) * (trackWidth - thumbWidth);
        if (!isFinite(thumbLeft)) thumbLeft = 0;

        this.hThumb.style.width = thumbWidth + 'px';
        this.hThumb.style.left = thumbLeft + 'px';
    }

    updateVerticalScrollbar() {
        const totalHeight = this.rowManager.getTotalHeight();
        const visibleHeight = this.canvas.height - Config.COL_HEADER_HEIGHT;
        const trackHeight = this.vScrollbar.offsetHeight;
        const maxScroll = this.getMaxScrollY();

        let thumbHeight = Math.max(30, (visibleHeight / totalHeight) * trackHeight);
        let thumbTop = maxScroll === 0 ? 0 : (this.scrollY / maxScroll) * (trackHeight - thumbHeight);
        if (!isFinite(thumbTop)) thumbTop = 0;

        this.vThumb.style.height = thumbHeight + 'px';
        this.vThumb.style.top = thumbTop + 'px';
    }

    getVisibleRange() {
        // Calculate visible columns
        const startCol = this.colManager.getColIndexAt(this.scrollX);
        const endCol = this.colManager.getColIndexAt(this.scrollX + this.canvas.width - Config.ROW_HEADER_WIDTH);

        // Calculate visible rows
        //scrollY is basically the top offset of the visible area means top of the canvas curently visible
        //scrollx is basically the left offset of the visible area means left of the canvas currently visible
        const startRow = this.rowManager.getRowIndexAt(this.scrollY);
        const endRow = this.rowManager.getRowIndexAt(this.scrollY + this.canvas.height - Config.COL_HEADER_HEIGHT);

        return {
            startRow: Math.max(0, startRow),
            endRow: Math.min(Config.totalRows - 1, endRow + 1),
            startCol: Math.max(0, startCol),
            endCol: Math.min(Config.totalCols - 1, endCol + 1)
        };
    }
}


class Cell {
    constructor(value = '', options = {}) {
        this.value = value;
        this.bold = options.bold ?? false;
        this.italic = options.italic ?? false;
        this.background = options.background ?? '#fff';
        this.computedValue = value;
        this.selectionManager = new SelectionManager();
    }

    setValue(val) {
        this.value = val;
        this.compute(); // Recompute on value set
    }

    getValue() {
        return this.computedValue;
    }
    compute(cellMap = new Map()) {
        if (typeof this.value !== 'string' || !this.value.startsWith('=')) {
            this.computedValue = this.value;
            return;
        }
        let expr = this.value.slice(1).toUpperCase();
        // Replace cell references with actual values
        expr = expr.replace(/[A-Z]+[0-9]+/g, ref => {
            const col = ref.charCodeAt(0) - 65; // A=0, B=1...
            const row = parseInt(ref.slice(1), 10) - 1; // A1 -> row 0

            const key = `${row},${col}`;
            const cell = cellMap.get(key);
            const val = cell?.getValue();

            return isNaN(val) ? '0' : val;
        });

        try {
            this.computedValue = eval(expr);
        } catch (e) {
            this.computedValue = 'ERR';
        }
    }

    draw(ctx, x, y, width, height) {
        ctx.fillStyle = this.background;
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = '#000';
        ctx.font = `${this.bold ? 'bold ' : ''}12px Arial`;
        ctx.fillText(this.getValue(), x + 5, y + height / 2 + 4);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, width, height);
    }
    getCellAtPosition(x, y, rowManager, colManager, scrollManager) {
        if (x < Config.ROW_HEADER_WIDTH || y < Config.COL_HEADER_HEIGHT) return null;

        const adjustedX = x - Config.ROW_HEADER_WIDTH + scrollManager.scrollX;
        const adjustedY = y - Config.COL_HEADER_HEIGHT + scrollManager.scrollY;

        const col = colManager.getColIndexAt(adjustedX);
        const row = rowManager.getRowIndexAt(adjustedY);

        if (row >= Config.totalRows || col >= Config.totalCols) return null;
        return { row, col };
    }


}

class SelectionManager {
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


    drawSelection(ctx, rowManager, colManager, scrollManager) {
        if (!this.startCell || !this.endCell) return;

        const { startRow, endRow, startCol, endCol } = this.getSelectedRange();

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

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {

                const x = Config.ROW_HEADER_WIDTH + colManager.getOffset(col) - scrollManager.scrollX;
                const y = Config.COL_HEADER_HEIGHT + rowManager.getOffset(row) - scrollManager.scrollY;
                const cellW = colManager.getWidth(col);
                const cellH = rowManager.getHeight(row);
                ctx.fillRect(x, y, cellW, cellH);
            }
        }

        // Draw outer border around entire selected region
        ctx.strokeStyle = '#4a90e2';

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

        ctx.strokeStyle = '#0a60c0';
        ctx.lineWidth = 2;
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

 
class ExcelApp {
    constructor() {
        const { canvas, editor } = this.createUI();
        console.log("canvas", canvas, "editor", editor);
        // Now use `canvas` and `editor` directly
        this.renderer = new GridRender(
            ColumnManager,
            RowManager,
            Cell,
            SelectionManager,
            ScrollManager,
            canvas,
            editor
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

        const vScroll = document.createElement("div");
        vScroll.id = "v-scrollbar";
        const vThumb = document.createElement("div");
        vThumb.id = "v-thumb";
        vScroll.appendChild(vThumb);

        container.appendChild(title);
        container.appendChild(infoDiv);
        container.appendChild(canvas);
        container.appendChild(editor);
        container.appendChild(hScroll);
        container.appendChild(vScroll);

        document.body.appendChild(container);

        // Return canvas and editor so we don’t use getElementById later
        return { canvas, editor };
    }
}

// Initialize app after DOM is ready
window.onload = () => {
    const app = new ExcelApp();
};












