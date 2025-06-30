import Config from "./Config.js";
export default class ScrollManager {
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
