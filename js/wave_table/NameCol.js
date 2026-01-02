import $ from "jquery";
import { WaveTable } from "./WaveTable.js";

export class NameCol {
  constructor(waveTable, init = true) {
    /** @type {string} */
    this.domContainerName = "#names-col-container-scroll";
    /**  @type {HTMLElement} */
    this.domContainer = $(this.domContainerName);
    if (this.domContainer.length == 0) {
      throw `ValueCol: Cannot find container ${this.domContainerName}`;
    }
    /** @type {WaveTable} */
    this.waveTable = waveTable;

    if (init) {
      this.init();
    }
  }

  init() {
    setTimeout(() => {
      this.reload();
    }, 0);

    this.domContainer.unbind("click");

    // handle select/deselect
    this.domContainer.on("click", ".name-col-item", (event) => {
      const rowId = $(event.currentTarget).data("row-id");
      const ctrlkey = event.ctrlKey || event.metaKey;
      const shiftkey = event.shiftKey;
      this.waveTable.rowClicked(rowId, shiftkey, ctrlkey);
    });

    // handle open/close
    this.domContainer.on("click", ".name-col-item-ocl", (event) => {
      const rowId = $(event.currentTarget).parent().data("row-id");
      this.waveTable.toggleGroup(rowId);
    });
  }

  reload() {
    this.domContainer.empty();
    this.waveTable.getRows({ hidden: false }).forEach((row) => {
      var domId = this.toId(row.id);
      var name = row.data.name;
      var wfrId = row.id;
      var depth = row.getDepth();
      var isOpen = row.opened;
      var oclCharacter = "&nbsp".repeat(depth);
      var leaf = row.children.length == 0;
      if (!leaf) {
        oclCharacter = isOpen ? "▾" : "▸";
      }

      // add a new div to domContainer
      this.domContainer.append(
        `<div id="${domId}" class="name-col-item" data-row-id="${wfrId}">
        <div class="name-col-item-ocl">${oclCharacter}</div>
        <div class="name-col-item-text">${name}</div>
        </div>`
      );
    });
  }

  clearAll() {}

  selectRow(rowId) {
    this.getDomItem(rowId).addClass("name-col-item-selected");
  }

  deSelectRow(rowId) {
    this.getDomItem(rowId).removeClass("name-col-item-selected");
  }

  deSelectAll(rowId) {
    $(".name-col-item").removeClass("name-col-item-selected");
  }

  moveRow(rowId, pos) {
    this.reload();
  }

  openGroup(rowId) {
    this.reload();
  }

  closeGroup(rowId) {
    this.reload();
  }

  insertRow(rowId, parent, pos = "last") {
    this.reload();
  }

  removeRow(rowId) {
    this.reload();
  }

  removeRows(rowIds) {
    this.reload();
  }

  getSelectedRows() {
    return this.waveTable.getSelectedRows();
  }

  getActiveRow() {
    return this.waveTable.getActiveRow();
  }

  rename(rowId, name) {
    this._getTree().rename_node(this.toId(rowId), name);
  }

  toId(rowId) {
    return `signal-name-${rowId}`;
  }

  getDomItem(rowId) {
    return $(`#${this.toId(rowId)}`);
  }

  get_node(rowId) {
    return this.waveTable.getRow(rowId);
  }

  editName(rowId) {
    const nameEditorId = "nameeditorinput";
    const nameEditorId2 = `#${nameEditorId}`;
    const li = $(`#${this.toId(rowId)}`);
    li.find("a").toggle();
    li.find("div").toggle();
    const input = $("<input></input>")
      .attr("id", nameEditorId)
      .val(this.get_node(rowId).text)
      .keypress((e) => {
        if (e.which == 13) {
          this.editNameEnd(rowId);
        }
        if (e.which == 27) {
          this.editNameEnd(rowId, false);
        }
      })
      .focusout((e) => {
        this.editNameEnd(rowId, false);
      });
    li.append(input);
    input.focus();
    input[0].setSelectionRange(0, 1000);
  }

  editNameEnd(rowId, accept = true) {
    const li = $(`#${this.toId(rowId)}`);
    const input = li.find("input");
    const val = input.val();
    input.remove();
    li.find("a").toggle();
    li.find("div").toggle();
    if (accept) {
      this.waveTable.rename(rowId, input.val());
    }
  }
}
