import {
  showSignals,
  zoomAutoscale,
  zoomFit,
  zoomOut,
  zoomIn,
  removeAllSignals,
  dbg_setEnableUpdateRenderRange,
  dbg_setEnableRender,
  moveCursorTo
} from './wave.js';

import {
  setDrawDB,
  updateDBInitialX,
  updateDBNow,
  now
} from './core.js';

// TODO should be moved somewhere else.
export var config = {};


$("#wiki").click(() => {
  $.ajax({
    url: "parse-vcd",
    type: "POST",
    data: JSON.stringify({
      fname: "test/wiki.vcd",
      other_fields: {
        a: 1,
        b: null
      }
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: (data, status) => {
      console.log(data);
      const drawDB = vcdpy2draw(data);
      setDrawDB(drawDB, data.now);

      console.log(drawDB);

      setTimeout(() => {
        showSignals()
      }, 0)
    }
  })

});

$("#Axi").click(() => {
  $.ajax({
    url: "parse-vcd",
    type: "POST",
    data: JSON.stringify({
      fname: "test/AxiRegTC_test_write.vcd",
      other_fields: {
        a: 1,
        b: null
      }
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: (data, status) => {
      console.log(data);
      const drawDB = vcdpy2draw(data);
      setDrawDB(drawDB, data.now);
      updateDBInitialX();
      updateDBNow();

      console.log(drawDB);

      setTimeout(()=>{
        showSignals()
      },0)
    }
  })
});

$("#zoom-fit").click(() => {
  zoomFit();
});

$("#zoom-autoscale").click(() => {
  zoomAutoscale();
});

$("#zoom-in").click(() => {
  zoomIn();
});

$("#zoom-out").click(() => {
  zoomOut();
});

$("#remove-all").click(() => {
  removeAllSignals();
});

$("#cursor-to-0").click(() => {
  moveCursorTo(0);
});

$("#cursor-to-end").click(() => {
  moveCursorTo(now);
});

$( ".resizable-col" ).resizable({
  handles: "e"
  });

$("#dbg_updateRenderRange").click(() => {
  dbg_setEnableUpdateRenderRange($("#dbg_updateRenderRange").is(":checked"));
});

$("#dbg_enableRender").click(() => {
  dbg_setEnableRender($("#dbg_enableRender").is(":checked"));
});

$("#file-open-button").click(() => {
  $("#file-open-shadow").click();
});

$("#file-open-shadow").change(openFile);

function vcdpy2draw(parsedContent) {
  var positionY = 0;

  function traverse(node) {
    node.id = encodeURIComponent(node.name).replace(/\./g, '_');

    if (node.type == 'struct') {
      return node.children.reduce((acc, child) => {
        var children = traverse(child)
        if (children) {
          acc.push(children);
        }
        return acc;
      }, []);
    } else {
      var nodeCpy = {
        ...node
      };
      nodeCpy.rowHeight = config.rowHeight;
      nodeCpy.positionY = positionY;
      positionY += nodeCpy.rowHeight;
      if (node.width == 1) {
        nodeCpy.waveStyle = 'bit'
      } else {
        nodeCpy.waveStyle = 'bus'
        console.log(`Unsupported width: ${node.width}`)
      }
      return nodeCpy;
    }
  };
  return traverse(parsedContent);
}

$.ajax({
  url: 'defaults.json',
  dataType: 'json',
  success: function (data) {
    config = data;
    // showDemo();

    $( ".resizable-col" ).resizable({
      handles: "e"
      });
  },
  error: function (data, textStatus, errorThrown) {
    alert(`While getting defaults.json: ${textStatus} ${errorThrown}`);
  }
})


var openFile = function (event) {
  var input = event.target;

  var reader = new FileReader();
  reader.onload = function () {
    var text = reader.result;
    try {
     /* parse(text).then((parsedContent) => {
        console.log(parsedContent);
      });*/
    } catch (error) {
      console.error(error);
    }
  };
  reader.readAsText(input.files[0]);
};
