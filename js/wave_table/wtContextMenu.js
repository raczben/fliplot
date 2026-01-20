import { event } from "jquery";
import $ from "jquery";
import "jquery-contextmenu";
import { WaveformRow } from "./WaveformRow.js";

/**
 * Initialize the context menu for the wave table.
 */
export function initContextMenu() {
  $.contextMenu({
    selector:
      "#names-col-container .jstree-node, #values-col-container .value-col-item, #wave-axis-container",
    callback: function (key, options) {
      switch (true) {
        case /rename/.test(key):
          setTimeout(() => {
            window.waveTable.nameCol.editName(window.waveTable.getActiveRow());
          }, 0);
          break;
        case /remove/.test(key):
          setTimeout(() => {
            window.waveTable.removeRows();
          }, 0);
          break;
        case /radix-.+/.test(key):
          setTimeout(() => {
            window.waveTable.setRadix(key.split("-")[1]);
          }, 0);
          break;
        case /waveStyle-.+/.test(key):
          // window.waveTable.getSelectedRows()[0].radix = key.split('-')[1];
          break;
        case /virtualBus/.test(key):
          window.waveTable.addVirtualBus();
          break;
        case /group/.test(key):
          setTimeout(() => {
            window.waveTable.createGroup();
          }, 0);
          break;
        case /analog/.test(key):
          setTimeout(() => {
            window.waveTable.setWaveStyle(WaveformRow.WaveStyle.ANALOG);
          }, 0);
        default:
          console.log(`unknown key: ${key}`);
          break;
      }
    },

    events: {
      show: function (options) {
        console.log("Context menu shown:", options);
      }
    },

    build: function ($triggerElement, e) {
      var rowId;
      // determine which selector was used:
      if ($triggerElement.attr("id") === "wave-axis-container") {
        const y = e.clientY;
        if (y === undefined) {
          // TODO
          console.error("Could not get clientY from context menu event:", e);
          return {};
        }
        rowId = window.waveTable.getRowfromY(y).id;
        console.log("wave-axis-container");
      } else if ($triggerElement.hasClass("jstree-node")) {
        rowId = window.waveTable.nameCol.toWaveTableId($triggerElement.attr("id"));
        console.log("jstree-node");
      } else if ($triggerElement.hasClass("value-col-item")) {
        rowId = $triggerElement.data("row-id");
        console.log("value-col-item");
      } else {
        console.error("Unknown context menu trigger element:", $triggerElement);
      }

      // Trigger a click event in the waveTable class to set the active row
      window.waveTable.rowClicked(rowId, false, false, true);
      return {};
    },
    zIndex: 1100,
    items: {
      rename: { name: "Rename", icon: "edit" },
      waveStyle: {
        name: "Wave Style",
        items: {
          "waveStyle-analog": { name: "analog" },
          "waveStyle-bus": { name: "bus" }
        }
      },
      radix: {
        name: "Radix",
        items: {
          "radix-bin": { name: "bin" },
          "radix-hex": { name: "hex" },
          "radix-signed": { name: "signed" },
          "radix-unsigned": { name: "unsigned" },
          // Add floating point option conditionally:
          // only a 32 bit signal can be set to float
          "radix-float": {
            name: "float",
            disabled: function () {
              const row = window.waveTable.getActiveRow(false);
              return !(row && row.simObj && row.simObj.getWidth() === 32);
            }
          }
        }
      },
      sep1: "---------",
      group: { name: "New Group" },
      virtualBus: {
        name: "New Virtual Bus",
        disabled: function () {
          const selectedRows = window.waveTable.getSelectedRows(false);
          if (selectedRows.length < 1) {
            return true;
          }
          // only "bit-signal" types can be combined into a virtual bus
          for (let i = 0; i < selectedRows.length; i++) {
            if (selectedRows[i].isBitSignal() == false) {
              return true;
            }
          }
          return false;
        }
      },
      sep2: "---------",
      remove: { name: "Remove", icon: "delete" }
    }
  });
}
