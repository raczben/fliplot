import { SimDB } from "../core/SimDB.js";
import { SimulationObject } from "../core/SimulationObject.js";
import { Tree } from "../core/tree.js";
import { WaveformRow } from "../core/WaveformRow.js";
import { NameCol } from "./NameCol.js";
import { ValueCol } from "./ValueCol.js";
import { WaveCanvas } from "./WaveCanvas.js";
import { config} from "../interact.js";


export class WaveTable {
  constructor(simDB) {
    if (simDB.constructor != SimDB) {
      throw "ERROR";
    }
    this.simDB = simDB;
    /**  @type {Tree} */
    this.tree = new Tree();
    this.nameCol = new NameCol(this);
    this.valueCol = new ValueCol(this);
    this.wave = new WaveCanvas(this);

    this.mainContainerScrolly = document.getElementById('main-container-scroll-y');
    this.waveAxisContainer = document.getElementById('wave-axis-container');
    if (!this.mainContainerScrolly || !this.waveAxisContainer) {
      throw new Error("WaveTable: mainContainerScrolly or waveAxisContainer not found");
    }

    // Connect event listeners.
    this.mainContainerScrolly.addEventListener('scroll', () => this.handleVerticalScroll());
    this.waveAxisContainer.addEventListener('scroll', () => this.handleHorizontalScroll());
    const resizeObserver = new ResizeObserver(() => this.handleWaveAxisContainerResize());
    resizeObserver.observe(this.waveAxisContainer);
    this._waveAxisResizeObserver = resizeObserver;
    this.attachZoomHandler();
    this.waveAxisContainer.addEventListener('click', (event) => this.handleClickOnWaveAxis(event));
  }

  /**
   * Handles resize events for the wave-axis-container.
   * Note: The wave-axis-container will be resized also when values-col or names-col are resized.
   */
  handleWaveAxisContainerResize() {
    console.log("handleWaveAxisContainerResize");
    // Throttle resize handling to avoid excessive calls
    // this is necessary because resize is called multiple times
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
    }
    this._resizeTimeout = setTimeout(() => {
      this.wave.setSize(this.waveAxisContainer.clientWidth, this.waveAxisContainer.clientHeight);
      this.wave.render();
      this._resizeTimeout = null;
    }, 10);
    return;
  }

  /**
   * Handles scroll events for the wave-axis-container.
   */
  handleHorizontalScroll() {
    const scrollLeft = this.waveAxisContainer.scrollLeft;
    this.wave.setLeftOffset(scrollLeft);
    this.wave.requestRender();
  }

  handleVerticalScroll() {
    console.log("handleVerticalScroll");
    // getting the scroll position
    const scrollTop = this.mainContainerScrolly.scrollTop;
    this.wave.setScrollTop(scrollTop);
    this.wave.requestRender();
  }

  // Handle zoom (Ctrl + mouse wheel) and allow normal scroll otherwise
  attachZoomHandler() {
    this.waveAxisContainer.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        // get the mouse position to choose as fix point for zooming
        const rect = this.waveAxisContainer.getBoundingClientRect();
        const fixPointX = e.clientX - rect.left; // x position within the element

        // prevent default scrolling behavior
        e.preventDefault();
        // calculate zoom delta based on the wheel delta
        const delta = -e.deltaY / 1300 * 3; // deltaY is +/-138
        this.zoomInOut(delta, fixPointX);

      }
      // else: let normal scroll work
    }, { passive: false });
  }

  /** handle Click on the wave axis and draw the cursor */
  handleClickOnWaveAxis(event) {
    const rect = this.waveAxisContainer.getBoundingClientRect();

    // The x position determines the time (and the position of the cursor) on the waveform
    const x = event.clientX - rect.left; // x position within the element
    const time = this.wave.getTimeFromX(x);
    this.wave.setCursorTime(time);

    // The y position gives the signal to be selected (and activated)
    const yBase = event.clientY - rect.top; // y position within the element
    const yAbbs = yBase + this.mainContainerScrolly.scrollTop; // y position within the entire wave axis container
    const rowsToPlot = this.getRows({hidden:false, content:true});
    var rowBottom = 0;
    for(var row of rowsToPlot) {
      // TODO each row could have different height...
      const rowHeight = config.rowHeight;
      rowBottom += rowHeight;
      if (yAbbs < rowBottom) {
        // we found the row that was clicked
        // select the row in the nameCol and valueCol
        const rowId = row.id;
        this.nameCol.deSelectAllRows();
        // this.valueCol.deSelectAllRows(); <-- not needed Names col will call it...
        this.nameCol.selectRow(rowId);
        // this.valueCol.selectRow(rowId); <-- not needed Names col will call it...
        break;
      } 
    }
    
    //update values column to the clicked time
    this.valueCol.showValuesAt(time);
    this.wave.requestRender();
  }

  /**
   * Zoom in or out based on the wheel delta.
   * Note this calls directly the wave.render() method to update the wave display.
   * @param {number} delta - The zoom delta, positive for zoom in, negative for zoom out.
   * @param {number} fixPointX - The x position within the wave axis container to use as the fix point for zooming.
   * 
   */
  zoomInOut(delta=0.3, fixPointX=-1) {
    let scroll = this.wave.zoomInOut(delta, fixPointX);
    if (scroll < 0) {
      scroll = 0;
    }
    this.wave.requestRender();
 
    // otherwise, scroll the wave axis container, which will trigger the horizontal scroll event
    // scorll effectively the wave axis container DOM element
    this.waveAxisContainer.scrollTo({left:scroll});
  }


  reload() {
    this.nameCol.init();
    this.valueCol.init();
    this.wave.init();

    this.nameCol.reload();
    this.valueCol.reload();
    this.wave.reload();
  }

  refresh() {
    this.nameCol.refresh();
    this.valueCol.refresh();
    this.wave.refresh();
  }

  clearAll() {
    this.nameCol.clearAll();
    this.valueCol.clearAll();
    this.wave.clearAll();
  }

  selectRow(rowId) {
    this.nameCol.selectRow(rowId);
    this.valueCol.selectRow(rowId);
    this.wave.requestRender();
  }

  deSelectRow(rowId) {
    this.nameCol.deSelectRow(rowId);
    this.valueCol.deSelectRow(rowId);
    this.wave.requestRender();
  }

  moveRow(rowId, pos, parent) {
    this.tree.move(rowId, pos, parent);
    this.nameCol.moveRow(rowId, pos, parent);
    this.valueCol.moveRow(rowId, pos, parent);
    this.wave.moveRow(rowId, pos, parent);
  }

  openGroup(rowId) {
    this.tree.open(rowId);
    this.nameCol.openGroup(rowId);
    this.valueCol.openGroup(rowId);
    this.wave.openGroup(rowId);
  }

  closeGroup(rowId) {
    this.tree.close(rowId);
    this.nameCol.closeGroup(rowId);
    this.valueCol.closeGroup(rowId);
    this.wave.closeGroup(rowId);
  }

  removeRow(rowId) {
    this.tree.remove(rowId);
    this.nameCol.removeRow(rowId);
    this.valueCol.removeRow(rowId);
    this.wave.removeRow(rowId);
  }

  removeRows(rowIds) {
    if (rowIds === undefined) {
      rowIds = this.getSelectedRows();
    }
    rowIds.forEach(element => {
      this.removeRow(element);
    });
  }

  /**
   * Insert a new signal to waveform window.
   *
   * @param {string[]} hierarchy
   * @param {string|null} parent
   * @param {number} position
   * @param {boolean} busAsBus
   * @param {boolean} render
   */
  insertWaveSignal(hierarchy, parent = null, position = -1, busAsBus = true, render = true) {
    /** @type {SimulationObject} obj */
    const obj = this.simDB.getObject(hierarchy);
    /** @type {WaveformRow} rowItem */
    const rowItem = new WaveformRow(obj);

    this.tree.insert(rowItem.id, parent, position, rowItem);

    if (busAsBus && rowItem.waveStyle == "bus") {
      // If the signal is a bus, insert all sub-signals
      for (var i = 0; i < obj.signal.width; i++) {
        const subObj = obj.cloneRange(i);
        const subRowItem = new WaveformRow(subObj);
        this.tree.insert(subRowItem.id, rowItem.id, position, subRowItem);
      }
    }

    if (render) {
      this.nameCol.reload();
      this.valueCol.reload();
    }

    return rowItem.id;
  }

  /**
   * Add all signal from the simDB to the waveform window.
   */
  addAllWaveSignal(clear = true) {
    if (clear) {
      this.tree = new Tree();
    }

    for (var key in this.simDB.objects) {
      if (Object.prototype.hasOwnProperty.call(this.simDB.objects, key)) {
        if (this.simDB.objects[key].type == SimulationObject.Type.SIGNAL) {
          this.insertWaveSignal(
            key.split("."), // hierarchy
            null,           // parent = null
            -1,             // position = -1,
            true,           // busAsBus = true
            false           // render = false
          );
        }
      }
    }
    this.nameCol.reload();
    this.valueCol.reload();
  }

  addObjects(hierarchies) {
    hierarchies.forEach((hier) => this.insertWaveSignal(hier));
  }

  getRows({
    traverse = Tree.Traverse.PREORDER,
    parent = null,
    hidden = true,
    content = false,
  } = {}) {
    var field = content ? "data" : null;
    return this.tree.getChildren(parent, traverse, field, hidden);
  }

  getRow({ id, content = false }) {
    const n = this.get(id);
    return content ? n.data : n;
  }

  getSelectedRows(ids = true) {
    if (ids) {
      return this.nameCol.getSelectedRows();
    } else {
      // return rows itself
      return this.nameCol
        .getSelectedRows()
        .map((element) => this.tree.get(element).data);
    }
  }

  /**
   * Returns if the given row is selected, fetching from the nameCol jsTree structure.
   * @param {string} rowId - The ID of the row to check
   * @returns {boolean} - True if the row is selected, false otherwise
   */
  isSelected(id) {
    return this.nameCol.isSelected(id);
  }

  getActiveRow(id = true) {
    const activeId = this.nameCol.getActiveRow();
    if (id) {
      return activeId;
    } else {
      return this.tree.get(activeId).data;
    }
  }

  rename(rowId, name) {
    this.tree.get(rowId).data.name = name;
    this.nameCol.reload();
  }

  setRadix(radix, rowIds) {
    if (rowIds === undefined) {
      rowIds = this.getSelectedRows();
    }
    rowIds.forEach((element) => {
      this.tree.get(element).forEach((n) => {
        n.data.setRadix(radix);
      });
      this.valueCol.setRadix(element);
      this.wave.setRadix(element);
    });
  }

  moveCursorTo(time) {
  }

  getCursorTime() {
    return this.wave.getCursorTime();
  }


  zoomFit() {
    // Zoom to fit the entire waveform in the view.
    // simDB.now should be the at the right edge of the waveform.
    const width = this.waveAxisContainer.clientWidth - 10; // 10px padding
    const timeScale = width / this.simDB.now;
    // Workaround: calculate the delta scale based on the current zoom level
    const currentScale = this.wave.getTimeScale();
    const deltaScale = timeScale / currentScale-1;
    this.zoomInOut(deltaScale);
  }

  zoomAutoscale() {
    this.wave.zoomAutoscale();
  }

  zoomIn() {
    this.zoomInOut(0.3);
  }

  zoomOut() {
    this.zoomInOut(-0.3);
  }
}

