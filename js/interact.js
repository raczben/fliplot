import {
  showSignals,
  zoomAutoscale,
  zoomFit,
  zoomOut,
  zoomIn,
  removeAllSignals,
  dbg_setEnableUpdateRenderRange,
  dbg_setEnableRender,
  moveCursorTo,
  getCursorTime,
  getHighlightedSignal
} from './wave.js';

import {
  setSimDB,
  updateDBInitialX,
  now,
  getTimeAnyTransition
} from './core.js';

// TODO should be moved somewhere else.
export var config = {};


$(".demo-file-button").click(function () {
  $.ajax({
    url: "parse-vcd",
    type: "POST",
    data: JSON.stringify({
      fname: $(this).attr('data-file'),
      other_fields: {
        a: 1,
        b: null
      }
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: (data) => {
      console.log(data);
      const simDB = vcdpy2simDb(data);
      setSimDB(simDB, data.now);
      updateDBInitialX();

      console.log(simDB);

      setTimeout(() => {
        showSignals()
      }, 0)
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

$("#cursor-to-prev-transition").click(() => {
  const tCurr = getCursorTime();
  const sig = getHighlightedSignal();
  const tNew = getTimeAnyTransition(sig.signal, tCurr, -1);
  moveCursorTo(tNew);
});

$("#cursor-to-next-transition").click(() => {
  const tCurr = getCursorTime();
  const sig = getHighlightedSignal();
  const tNew = getTimeAnyTransition(sig.signal, tCurr, +1);
  moveCursorTo(tNew);
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

$("#file-open-shadow").on('change', openFile);

function vcdpy2simDb(parsedContent) {
  parsedContent["signals"] = parsedContent["children"];
  delete parsedContent["children"];
  
  return parsedContent;
}

$.ajax({
  url: 'defaults.json',
  dataType: 'json',
  success: function (data) {
    config = data;

    $( ".resizable-col" ).resizable({
      handles: "e"
      });
  },
  error: function (data, textStatus, errorThrown) {
    alert(`While getting defaults.json: ${textStatus} ${errorThrown}`);
  }
})

function openFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.readAsText(input.files[0], "UTF-8");
  reader.onload = function (evt) {
    console.log(evt.target.result);
    
    $.ajax({
      url: "parse-vcd",
      type: "POST",
      data: JSON.stringify({
        fname: input.files[0].name,
        content: evt.target.result
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        console.log(data);
        const simDB = vcdpy2simDb(data);
        setSimDB(simDB, data.now);

        console.log(simDB);

        setTimeout(() => {
          showSignals()
        }, 0)
      }
    })

  }
}
