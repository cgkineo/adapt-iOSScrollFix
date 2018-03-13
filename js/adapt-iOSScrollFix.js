define([
   'core/js/adapt',
   './mobile-iframe'
], function(Adapt, mobileIframe) {

  var Extension = Backbone.Controller.extend({

    initialize: function() {
      this.listenTo(Adapt, "app:dataReady", this.onDataReady);
    },

    onDataReady: function() {
      var config = Adapt.config.get("_iosscrollfix");
      var isEnabled =  (config && config._isEnabled && config._onHTMLClasses && $("html").is(config._onHTMLClasses));
      if (!isEnabled) return;
      this.scrollFix();

      if (config._isReflowFixEnabled) {
        this.reflow();
      }

      if (config._isIFrameFixEnabled) {
        this.iFrameFix();
        mobileIframe();
      }

    },

    scrollFix: function() {
       //add styling
      $("html").addClass("iosscrollfix");

      //move navigation outside the scrolling area
      var $navigationContainer = $('<div class="navigation-container"></div>');
      $("body").prepend($navigationContainer);

      Adapt.once("adapt:initialize", function() {
        $(".navigation").prependTo($navigationContainer);
      });

      //make fake html and body tags
      var $scrollingContainer = $('<div class="scrolling-container"><div class="scrolling-inner body"></div></div>');
      var $scrollingInner = $scrollingContainer.find(".scrolling-inner");

      //move wrapper inside fake tags
      $scrollingContainer.insertAfter($navigationContainer);
      $("#wrapper").appendTo($scrollingInner);

      //fix scrolling
      var originalElementScrollTo = $.fn.scrollTo;
      $.fn.scrollTo = function(target, duration, settings) {
        if (this[0] === window || this[0] === document.body) {
          return originalElementScrollTo.apply($(".scrolling-container"), arguments);
        } else {
          return originalElementScrollTo.apply(this, arguments);
        }
      };

      var originalScrollTo = $.scrollTo;
        $.scrollTo = function(target, duration, settings) {
        return originalElementScrollTo.apply($(".scrolling-container"), arguments);
      };

      var originalScrollTop = $.fn.scrollTop;
      $.fn.scrollTop = function() {
        if (this[0] === window || this[0] === document.body) {
          return originalScrollTop.apply($(".scrolling-container"), arguments);
        } else {
          return originalScrollTop.apply(this, arguments);
        }
      };

      window.scrollTo = function(x, y) {
        //console.log("window scrollTo", x || 0, y || 0);
        $(".scrolling-container")[0].scrollTop = y || 0;
        $(".scrolling-container")[0].scrollLeft = x || 0;
      };

      $(".scrolling-container").on("scroll", function() {
        $(window).scroll();
      });

      //fix jquery offset
      var jqueryOffset = $.fn.offset;
      $.fn.offset = function() {
        var offset = jqueryOffset.call(this);
        //console.log("fetching offset", offset.top, offset.left);
        var $stack = this.parents().add(this);
        var $scrollParents = $stack.filter(".scrolling-container");
        $scrollParents.each(function(index, item) {
          var $item = $(item);
          var scrolltop = parseInt($item.scrollTop());
          var scrollleft = parseInt($item.scrollLeft());
          offset.top += scrolltop;
          offset.left += scrollleft;
        });
        return offset;
      };

    },

    reflow: function() {
      function reflowMe() {
        console.log("iOSScrollFix: reflow");
        var $redraw = $('<div class="redraw">Redraw in progress</div>');
        $('.scrolling-container').append($redraw);
        _.defer(function() {
          $redraw.remove();
        });
      }
      var debouncedReflowMe = _.debounce(reflowMe, 100);
      Adapt.on("device:resize", reflowMe);
      Adapt.on("device:resize", debouncedReflowMe);
      Adapt.on("menuView:postRender pageView:postRender", reflowMe);
      Adapt.on("menuView:postRender pageView:postRender", debouncedReflowMe);
      debouncedReflowMe();
      $(document).on("touchstart", reflowMe);
    },

    iFrameFix: function() {
      var config = Adapt.config.get("_iosscrollfix");
      var heightTrim = config._iFrameFixHeightTrim || 0;
      function resizeMe(window, iframe) {
        console.log("iOSScrollFix: iframe resize");
        $(iframe).css({
          position: "fixed !important",
          top:0,
          left:0,
          right: window.innerWidth,
          width: window.innerWidth,
          height: window.innerHeight+heightTrim,
          bottom: window.innerHeight+heightTrim
        });
      }
      Adapt.on("iframe:change", resizeMe);
      Adapt.on("iframe:change", _.debounce(resizeMe, 100));
    }

  });

  return new Extension();

});