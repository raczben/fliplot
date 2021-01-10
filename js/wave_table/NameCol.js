import { waveformDB } from "../core/WaveformDB.js";
import { WaveTable } from "./WaveTable.js";

export class NameCol {
  constructor(waveTable) {
    /** @type {string} */
    NameCol.containerName = '#names-col-container-scroll';
    /** @type {WaveTable} */
    NameCol.waveTable = waveTable;
  }

  init(){
    $(NameCol.containerName).jstree("destroy").empty();
    $(NameCol.containerName).jstree({
      'plugins': ['wholerow', 'dnd', 'changed'],
      'core': {
        'data': [],
        'animation': false,
        "themes": {
          "icons": false
        },
        "check_callback": function (op, node, par, pos, more) {
          if (more && more.dnd) {
            return more.pos !== "i" && par.id == node.parent;
          }
          return true;
        },
      },
    }).on('move_node.jstree', function (e, data) {
      NameCol.waveTable.moveRow(data.node.data, data.position);
    }).on('open_node.jstree', function (e, data) {
      NameCol.waveTable.openGroup(data.node.data);
    }).on('close_node.jstree', function (e, data) {
      NameCol.waveTable.closeGroup(data.node.data);
    }).on('changed.jstree', function (evt, data) {
      data.changed.selected.forEach(element => {
        const data = $(NameCol.containerName).jstree().get_node(element).data;
        NameCol.waveTable.selectRow(data);
      });
      data.changed.deselected.forEach(element => {
        const data = $(NameCol.containerName).jstree().get_node(element).data;
        NameCol.waveTable.deSelectRow(data);
      });
    });

    setTimeout(() => {
      
      this.reload();
    }, 100);

  }

  reload() {
    const tree = []
    waveformDB.rows.forEach(row => {
      var treeObj = {};
      treeObj['id'] = `signal-name-${row.id}`;
      treeObj['parent'] = '#';
      treeObj['text'] = row.name;
      treeObj['data'] = row.id;
      tree.push(treeObj)
      if (row.waveStyle == 'bus') {
        for (var idx = 0; idx < row.simObj.signal.width; idx++) {
          treeObj = {};
          treeObj['id'] = `signal-name-${row.id}.${idx}`;
          treeObj['parent'] = `signal-name-${row.id}`;
          treeObj['text'] = `[${idx}]`;
          treeObj['data'] = row.id;
          tree.push(treeObj)
        }
      }
    });

    $(NameCol.containerName).jstree(true).settings.core.data = tree;
    this.refresh();
  }

  refresh(){
    $(NameCol.containerName).jstree(true).refresh();
  }

  clearAll() {
    $(NameCol.containerName).jstree("destroy").empty();
    // d3.select(NameCol.containerName).selectAll("*").remove();
  }

  selectRow(rowId) {
    $(NameCol.containerName).jstree().select_node(`signal-name-${rowId}`);
  }

  deSelectRow(rowId) {
    $(NameCol.containerName).jstree().deselect_node(`signal-name-${rowId}`);
  }

  moveRow(rowId, pos) {
    this.reload();
  }

  openGroup(rowId) {
    $(NameCol.containerName).jstree().open_node(`signal-name-${rowId}`);
  }

  closeGroup(rowId) {
    $(NameCol.containerName).jstree().select_node(`signal-name-${rowId}`);
  }

  insertRow(rowId, pos = 'last') {
    const tree = [];
    const row = waveformDB.get(rowId)
    var treeObj = {};
    treeObj['id'] = `signal-name-${row.id}`;
    // treeObj['parent'] = '#';
    treeObj['text'] = row.name;
    treeObj['data'] = row.id;
    // tree.push(treeObj)
    $(NameCol.containerName).jstree().create_node('#', treeObj, pos);
    if (row.waveStyle == 'bus') {
      for (var idx = 0; idx < row.simObj.signal.width; idx++) {
        treeObj = {};
        treeObj['id'] = `signal-name-${row.id}.${idx}`;
        treeObj['parent'] = `signal-name-${row.id}`;
        treeObj['text'] = `[${idx}]`;
        treeObj['data'] = row.id;
        $(NameCol.containerName).jstree().create_node(`signal-name-${row.id}`, treeObj, pos);
      }
    }
  }

  removeRow(rowId) {
  }

  getSelectedRows() {
    return $(NameCol.containerName).jstree.get_selected(true).map(
      element => waveformDB.get(element.data)
    );
  }

  getActiveRow() {
    return waveformDB.get($(NameCol.containerName).get_selected(true)[0].data);
  }

  rename(rowId, name) {
    $('##names-col-container-scroll').jstree().rename_node(`signal-name-${rowId}`, name);
  }
}
