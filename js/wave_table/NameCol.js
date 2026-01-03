import $ from "jquery";
import { WaveTable } from "./WaveTable.js";
import { Tree } from "../core/tree.js";

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
    this.domContainer.unbind("dblclick");

    // handle select/deselect
    this.domContainer.on("click", "li.name-col-item", (event) => {
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

    // on double click do open/close too:
    this.domContainer.on("dblclick", ".name-col-item", (event) => {
      event.stopPropagation();
      const rowId = $(event.currentTarget).data("row-id");
      this.waveTable.toggleGroup(rowId);
    });

    // add dnd support.
    this.domContainer.sortable({
      items: ".name-col-item",

      helper: function (e, item) {
        // Move multiple element together
        if (window.waveTable.getSelectedRows().length < 2) {
          const rowId = item.data("row-id");
          window.waveTable.rowClicked(rowId, false, false);
        }
        var selected = $(".name-col-item-selected");
        var helper = $("<div/>");
        helper.addClass("dnd-helper").css("opacity", "0.5");
        helper.append(selected.clone());
        return helper;
      },
      start: function (e, ui) {
        var selected = ui.item.parent().children(".name-col-item-selected");
        ui.item.data("selected", selected);
        // Hide all selected except the dragged one
        // selected.not(ui.item).hide();
      },

      // start: function (event, ui) {
      //   ui.item.addClass(".name-col-item-selected");
      // },
      update: (event, ui) => {
        const rowIds = window.waveTable.getSelectedRows();
        const newPos = ui.item.index();
        // transform the position to a parent and a relative position in that parent:
        // get the orig node of newPos:
        const origNode = this.waveTable.getRowAtVisiblePos(newPos);
        const origNodeParent = origNode.parent;
        // get the position in that parent:
        const newrelativePos = origNodeParent.children.indexOf(origNode);
        this.waveTable.moveRows(rowIds, newrelativePos, origNodeParent.id);
      }
    });
  }

  reload() {
    this.domContainer.empty();

    //add ul element after each node which is not a leaf
    this.domContainer.append(
      `<ul id="ul-${this.toId(Tree.ROOT_ID)}" class="name-col-item" data-row-id="${Tree.ROOT_ID}">
        </ul>`
    );
    this.waveTable.getRows().forEach((row) => {
      const domId = this.toId(row.id);
      const name = row.data.name;
      const wfrId = row.id;
      const depth = row.getDepth();
      const isOpen = row.opened;
      var oclCharacter = "&nbsp".repeat(depth);
      const parentId = row.parent.id;
      const leaf = row.children.length == 0;
      if (!leaf) {
        oclCharacter = isOpen ? "▾" : "▸";
      }

      // get the parent ul element:
      const parentUl = $(`#ul-${this.toId(parentId)}`);

      // add li element for each node
      parentUl.append(
        `<li id="${domId}" class="name-col-item" data-row-id="${wfrId}">
        <div class="name-col-item-ocl">${oclCharacter}</div>
        <div class="name-col-item-text">${name}</div>
        </li>`
      );
      //add ul element after each node which is not a leaf
      if (!leaf) {
        parentUl.append(
          `<ul id="ul-${this.toId(wfrId)}" class="name-col-item${!isOpen ? " hidden" : ""}"></ul>`
        );
      }
    });

    this.selectRows();
  }

  clearAll() {}

  selectRow(rowId) {
    this.getDomItem(rowId).addClass("name-col-item-selected");
  }

  selectRows() {
    this.waveTable.getSelectedRows().forEach((rowId) => {
      this.selectRow(rowId);
    });
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
