import { waveformDB } from "../core/WaveformDB.js";
// import { waveTable } from "./WaveTable.js";

export class ValueCol {
  constructor(waveTable) {
    ValueCol.containerName = '#values-col-container';
    ValueCol.waveTable = waveTable;
  }

  init(){
    $(ValueCol.containerName).jstree("destroy").empty();
    $(ValueCol.containerName).jstree({
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
    }).on('move_node.jstree', function (e, data, d) {
      openSignalGroup(data.node.data);
    }).on('open_node.jstree', function (e, data) {
      ValueCol.waveTable.openGroup(data.node.data);
    }).on('close_node.jstree', function (e, data) {
      ValueCol.waveTable.closeGroup(data.node.data);
    }).on('changed.jstree', function (evt, data) {
      data.changed.selected.forEach(element => {
        const data = $(ValueCol.containerName).jstree().get_node(element).data;
        ValueCol.waveTable.selectRow(data);
      });
      data.changed.deselected.forEach(element => {
        const data = $(ValueCol.containerName).jstree().get_node(element).data;
        ValueCol.waveTable.deSelectRow(data);
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
      treeObj['id'] = `signal-value-${row.id}`;
      treeObj['parent'] = '#';
      treeObj['text'] = row.getValueAt(0);
      treeObj['data'] = row.id;
      tree.push(treeObj)
      if (row.waveStyle == 'bus') {
        for (var idx = 0; idx < row.simObj.signal.width; idx++) {
          treeObj = {};
          treeObj['id'] = `signal-value-${row.id}.${idx}`;
          treeObj['parent'] = `signal-value-${row.id}`;
          treeObj['text'] = '- NaN - ';
          treeObj['data'] = row.id;
          tree.push(treeObj)
        }
      }
    });

    $(ValueCol.containerName).jstree(true).settings.core.data = tree;
    this.refresh();
  }

  refresh(){
    $(ValueCol.containerName).jstree(true).refresh();
  }

  clearAll() {
    $(ValueCol.containerName).jstree("destroy").empty();
    // d3.select(ValueCol.containerName).selectAll("*").remove();
  }

  selectRow(rowId) {
    $(ValueCol.containerName).jstree().select_node(`signal-value-${rowId}`);
  }

  deSelectRow(rowId) {
    $(ValueCol.containerName).jstree().deselect_node(`signal-value-${rowId}`);
  }

  moveRow(rowId, pos) {
    this.reload();
  }

  openGroup(rowId) {
    $(ValueCol.containerName).jstree().open_node(`signal-value-${rowId}`);
  }

  closeGroup(rowId) {
    $(ValueCol.containerName).jstree().close_node(`signal-value-${rowId}`);
  }

  insertRow(rowId, pos = 'last') {
    const tree = [];
    const row = waveformDB.get(rowId)
    var treeObj = {};
    treeObj['id'] = `signal-value-${row.id}`;
    // treeObj['parent'] = '#';
    treeObj['text'] = row.name;
    treeObj['data'] = row.id;
    // tree.push(treeObj)
    $(ValueCol.containerName).jstree().create_node('#', treeObj, pos);
    if (row.waveStyle == 'bus') {
      for (var idx = 0; idx < row.simObj.signal.width; idx++) {
        treeObj = {};
        treeObj['id'] = `signal-value-${row.id}.${idx}`;
        treeObj['parent'] = `signal-value-${row.id}`;
        treeObj['text'] = `[${idx}]`;
        treeObj['data'] = row.id;
        $(ValueCol.containerName).jstree().create_node(`signal-value-${row.id}`, treeObj, pos);
      }
    }
  }

  removeRow(rowId) {
  }

  getSelectedRows() {
    return $(ValueCol.containerName).jstree.get_selected(true).map(
      element => waveformDB.get(element.data)
    );
  }

  getActiveRow() {
    return waveformDB.get($(ValueCol.containerName).get_selected(true)[0].data);
  }

  showValuesAt(time) {
    waveformDB.rows.forEach(row => {
      $(ValueCol.containerName).jstree().rename_node(`signal-value-${row.id}`, row.getValueAt(time));
    });
  }
  
}
