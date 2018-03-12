(function() {

  var scritpTag = document.querySelector("script#iframefix");
  var frame = document.querySelector("iframe[data-iframefix]") || document.querySelector("frame[data-iframefix]");

  window.addEventListener("orientationchange", function() {
    try {
    if (!frame || !frame.contentWindow) return;
    frame.style.width = 0;
    frame.style.height = 0;
    frame.style.bottom = 0;
    frame.style.right = 0;
    frame.contentWindow.postMessage({
      type: "orientationchange"
    }, "*");
    } catch(e) {}
  }, false);

  window.addEventListener("resize", function() {
    try {
    if (!frame || !frame.contentWindow) return;
    frame.style.width = 0;
    frame.style.height = 0;
    frame.style.bottom = 0;
    frame.style.right = 0;
    frame.contentWindow.postMessage({
      type: "resize"
    }, "*");
    } catch(e) {}
  }, false);

  document.body.style.overflow = "hidden";

})();