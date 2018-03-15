define([
  "core/js/adapt"
], function(Adapt) {

  return function() {
    var isOnMobile = false;
    switch (Adapt.device.OS) {
      case "android":
      case "ios":
        isOnMobile = true;
        break;
      default:
        isOnMobile = false;
        return false;
    }

    var isInChildWindow = (window.top.document !== document)
    if (!isInChildWindow) return false;

    var containerFrame = (function getContainerFrame() {
      if (!isInChildWindow) return;
      var frames = $("iframe, frame", window.top.document);
      if (!frames.length) return;
      var containerFrame = null;
      for (var i = 0, l = frames.length; i < l; i++) {
        var frame = frames[i];
        if (window.location.href.substr(0, frame.src.length) !== frame.src) continue;
        containerFrame = frame;
        break;
      }
      return containerFrame;
    })();

    var isInIFrame = !!containerFrame;
    if (!isInIFrame) return false;+

    $(containerFrame).attr("data-iframefix", true);

    window.addEventListener("message", function(message) {
      if (typeof message.data !== "object") return;
      if (!message.data.type) return;
      switch (message.data.type) {
        case "orientationchange":
        case "resize":
          Adapt.trigger("iframe:change", window.top, containerFrame);
          break;
      }
    }, false);

    var a = document.createElement("a");
    a.href = "iframe-fix.js";

    window.top.eval('var head = document.querySelector("head"); var script = document.createElement("script"); script.id="iframefix"; script.src="'+a.href+'"; head.appendChild(script);');
    Adapt.trigger("iframe:change", window.top, containerFrame);

  };

});