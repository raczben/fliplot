import $ from "jquery";
import "jstree"; // extend jQuery with .jstree()
import { WaveTable } from "./WaveTable.js";

export class NameCol {
  constructor(waveTable, init = true) {
    /** @type {string} */
    this.containerName = "#names-col-container-scroll";
    /** @type {WaveTable} */
    this.waveTable = waveTable;

    this.ready = false;

    if (init) {
      this.init();
    }
  }

  init() {
    const self = this;

    $(this.containerName).jstree("destroy").empty();
    $(this.containerName)
      .jstree({
        plugins: [
          // wholerow:
          // Makes each node appear block level which makes selection easier.
          // May cause slow down for large trees in old browsers.
          "wholerow",
          "dnd", // drag and drop
          //changed:
          // This plugin adds additional information about selection changes.
          // Once included in the plugins config option, each changed.jstree event data
          // will contain a new property named changed, which will give information about
          // selected and deselected nodes since the last changed.jstree event
          "changed"
        ],
        core: {
          data: [],
          animation: false,
          themes: {
            name: "default-dark",
            icons: false
          },
          check_callback: function (op, node, par, pos, more) {
            if (more && more.dnd) {
              return more.pos !== "i" && par.id == node.parent;
            }
            return true;
          }
        },
        dnd: {
          is_draggable: function (nodes) {
            // For simplification allow multiple nodes only id they share the same parent
            if (nodes.length > 1) {
              const parent = nodes[0].parent;
              for (let i = 1; i < nodes.length; i++) {
                if (nodes[i].parent != parent) {
                  return false;
                }
              }
            }
            return true;
          }
        }
      })
      .on("move_node.jstree", function (e, data) {
        console.log("NameCol: move_node.jstree", data);
        const nodeWtId = data.node.data; // the dragged node
        const parentNcId = data.parent;
        const parentWtId = self.toWaveTableId(parentNcId); // the intended new parent
        const oldParentNcId = data.old_parent;
        const oldParentWtId = self.toWaveTableId(oldParentNcId); // previous parent

        if (parentNcId !== "#") {
          const newParentData = self.waveTable.getRow(parentWtId).data;
          // if the new parent is a bus ask user to confirm if he wants to create a virtual bus
          if (newParentData.type == "signal") {
            if (
              !confirm(
                `The new parent (${newParentData.name}) is a bus. Do you want to create a virtual bus from that?`
              )
            ) {
              // cacel the move:
              return false;
            } else {
              // create a virtual bus
              setTimeout(() => {
                self.waveTable.removeRow(parentWtId);
                self.waveTable.addVirtualBus();
              }, 0);
              return false;
            }
          }
        }

        if (oldParentWtId !== "#" && oldParentWtId !== parentWtId) {
          const oldParentData = self.waveTable.getRow(parentWtId).data;
          // if the old parent is a bus ask user to confirm if he wants to create a virtual bus
          if (oldParentData.type == "signal") {
            if (
              !confirm(
                `The old parent (${oldParentData.name}) is a bus. Do you want to create a virtual bus from that?`
              )
            ) {
              // cacel the move:
              return false;
            } else {
              // create a virtual bus
              setTimeout(() => {
                self.waveTable.removeRow(parentWtId);
                self.waveTable.addVirtualBus();
              }, 0);
              return false;
            }
          }
        }
        self.waveTable.moveRow(data.node.data, data.position);
        return true;
      })
      .on("open_node.jstree", function (e, data) {
        // console.log("NameCol: open_node.jstree", data);
        self.waveTable.openGroup(data.node.data);
      })
      .on("close_node.jstree", function (e, data) {
        // console.log("NameCol: close_node.jstree", data);
        self.waveTable.closeGroup(data.node.data);
      })
      .on("changed.jstree", function (evt, data) {
        // console.log("NameCol: changed.jstree", data);
        data.changed.selected.forEach((element) => {
          const data = self._getTree().get_node(element).data;
          self.waveTable.selectRow(data);
        });
        data.changed.deselected.forEach((element) => {
          const data = self._getTree().get_node(element).data;
          self.waveTable.deSelectRow(data);
        });
      })
      .on("ready.jstree", function (evt, data) {
        console.log("NameCol: ready.jstree", data);
      })
      .on("load_all.jstree", function (evt, data) {
        console.log("NameCol: load_all", data);
      });

    setTimeout(() => {
      this.reload();
    }, 0);
  }

  reload() {
    const tree = [];
    this.waveTable.getRows().forEach((row) => {
      var treeObj = {};
      treeObj["id"] = this.toNameColId(row.id);
      if (row.parent.id == "#") {
        treeObj["parent"] = "#";
      } else {
        treeObj["parent"] = this.toNameColId(row.parent.id);
      }
      treeObj["text"] = row.data.name;
      treeObj["data"] = row.id;
      tree.push(treeObj);
    });

    this._getTree().settings.core.data = tree;
    clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(() => {
      this.refresh();
    }, 10);
  }

  rowClicked(rowId, shiftKey, ctrlKey) {
    // Based on: https://stackoverflow.com/a/28896335/2506522

    var clickEvent = jQuery.Event("click");
    clickEvent.shiftKey = shiftKey;
    clickEvent.ctrlKey = ctrlKey;

    $("li#" + this.toNameColId(rowId) + " > .jstree-anchor").trigger(clickEvent);
  }

  refresh() {
    this._getTree().refresh();
  }

  clearAll() {
    $(this.containerName).jstree("destroy").empty();
    // d3.select(this.containerName).selectAll("*").remove();
  }

  deSelectAllRows() {
    this._getTree().deselect_all();
  }

  moveRow(rowId, pos) {
    this.reload();
  }

  openGroup(rowId) {
    this._getTree().open_node(this.toNameColId(rowId));
  }

  closeGroup(rowId) {
    this._getTree().select_node(this.toNameColId(rowId));
  }

  insertRow(rowId, parent, pos = "last") {
    this.reload();
  }

  removeRow(rowId) {
    this.removeRows(rowId);
  }

  removeRows(rowIds) {
    this._getTree().delete_node(this.toNameColId(rowIds));
  }

  getSelectedRows() {
    return this._getTree()
      .get_selected(true)
      .map((element) => element.data);
  }

  /**
   * Check if the row is selected.
   * @param {string} rowId - The ID of the row to check
   * @returns {boolean} - True if the row is selected, false otherwise
   */
  isSelected(rowId) {
    return this._getTree().is_selected(this.toNameColId(rowId));
  }

  getActiveRow() {
    return this._getTree().get_selected(true)[0].data;
  }

  rename(rowId, name) {
    this._getTree().rename_node(this.toNameColId(rowId), name);
  }

  toNameColId(wtId) {
    return `name-col-${wtId}`;
  }

  toWaveTableId(ncId) {
    return ncId.substring(9); // remove "name-col-"
  }

  _getTree(arg = true) {
    return $(this.containerName).jstree(arg);
  }

  get_node(rowId) {
    return this._getTree().get_node(this.toNameColId(rowId));
  }

  editName(rowId) {
    const nameEditorId = "nameeditorinput";
    const nameEditorId2 = `#${nameEditorId}`;
    const li = $(`#${this.toNameColId(rowId)}`);
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
    const li = $(`#${this.toNameColId(rowId)}`);
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
