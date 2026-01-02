import $ from "jquery";
import "jstree"; // extend jQuery with .jstree()
import { simDB } from "./interact.js";

export class ObjectTree {
  constructor(waveTable) {
    /** @type {string} */
    this.containerName = "#object-tree";

    this.waveTable = waveTable;
  }

  showTree() {
    const tree = [];
    for (var key in simDB.objects) {
      if (Object.prototype.hasOwnProperty.call(simDB.objects, key)) {
        /** @type {SimulationObject} */
        const obj = simDB.objects[key];
        var treeObj = {};
        treeObj["id"] = obj.hierarchy;
        treeObj["data"] = key;
        if (obj.hierarchy.length > 1) {
          treeObj["parent"] = obj.hierarchy.slice(0, -1);
        } else {
          treeObj["parent"] = "#";
        }
        treeObj["text"] = obj.hierarchy[obj.hierarchy.length - 1];

        treeObj["type"] = obj.type;

        tree.push(treeObj);
      }
    }

    $("#object-tree").jstree("destroy").empty();
    $("#object-tree").jstree({
      plugins: ["search", "wholerow", "types"],
      core: {
        data: tree,
        animation: false
      },

      types: {
        module: {
          icon: "glyphicon glyphicon-oil" // looks like an IC
        },
        signal: {
          icon: "glyphicon glyphicon-leaf"
        },
        default: {}
      },
      search: {
        show_only_matches: true,
        show_only_matches_children: true
      }
    });

    var to = false;
    $("#structure-search").keyup(function () {
      if (to) {
        clearTimeout(to);
      }
      to = setTimeout(function () {
        var v = $("#structure-search").val();
        $("#object-tree").jstree(true).search(v);
      }, 150);
    });

    const self = this;

    $.contextMenu({
      selector: "#main-container-tree",
      callback: function (key, options) {
        switch (key) {
          case "addToWave":
            self.waveTable.addObjects(self.getSelectedObjects());
            break;
          case "showInWave":
            // waveTable.selectRow(getSelectedRows());
            break;
          default:
            console.log(`unknown key: ${key}`);
            break;
        }
      },

      zIndex: 1100,
      items: {
        addToWave: { name: "Add to wave" },
        showInWave: { name: "Show in wave" }
      }
    });
  }

  getSelectedObjects() {
    return this._getTree()
      .get_selected(true)
      .map((element) => element.data);
  }

  _getTree(arg = true) {
    return $(this.containerName).jstree(arg);
  }
}
