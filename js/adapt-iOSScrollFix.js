define([
   'core/js/adapt',
   './mobile-iframe'
], function(Adapt, mobileIframe) {

  var Extension = Backbone.Controller.extend({

    initialize: function() {
      this.listenTo(Adapt, "configModel:dataLoaded", this.onConfigDataLoaded);
    },

    onConfigDataLoaded: function() {
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
      $.scrollTo = _.extend(function(target, duration, settings) {
        return originalElementScrollTo.apply($(".scrolling-container"), arguments);
      }, originalScrollTo);

      var originalScrollTop = $.fn.scrollTop;
      $.fn.scrollTop = function() {
        if (this[0] === window || this[0] === document.body) {
          return originalScrollTop.apply($(".scrolling-container"), arguments);
        } else {
          return originalScrollTop.apply(this, arguments);
        }
      };

      window.scrollTo = function(x, y) {
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
      var reflowParent = function() {
        console.log("iOSScrollFix: reflow parent");
        var $redraw = $('<div class="redraw">Redraw in progress</div>', window.top.document);
        $('.scrolling-container', window.top.document).append($redraw);
        _.defer(function() {
          $redraw.remove();
        });
      }.bind(this);
      var reflowChild = function() {
        console.log("iOSScrollFix: reflow child");
        var $redraw = $('<div class="redraw">Redraw in progress</div>');
        $('.scrolling-container').append($redraw);
        _.defer(function() {
          $redraw.remove();
        });
      }.bind(this);
      var reflowMe = function() {
        reflowParent();
        reflowChild();
      }.bind(this);
      var reflow = function() {
        reflowMe();
      }.bind(this);
      Adapt.on("device:resize", reflow);
      Adapt.on("menuView:postRender pageView:postRender", reflow);
      reflow();
      $(document).on("touchstart", reflow);
    },

    iFrameFix: function() {
      var config = Adapt.config.get("_iosscrollfix");
      var heightTrim = config._iFrameFixHeightTrim || 0;
      var resizeMe = function(window, iframe) {
        console.log("iOSScrollFix: iframe resize");
        var scale = window.document.body.clientWidth / window.innerWidth;
        var style = {
          position: "fixed !important",
          top:0,
          left:0,
          right: (window.innerWidth * scale) + "px",
          width: (window.innerWidth * scale) + "px",
          height: ((window.innerHeight+heightTrim) * scale) + "px",
          bottom: ((window.innerHeight+heightTrim) * scale) + "px",
          '-webkit-overflow-scrolling': 'auto',
          border: 0,
          margin: 0,
          padding: 0
        };
        var styles = [];
        for (var k in style) {
          styles.push(k+":"+style[k]+";");
        }
        $(iframe).attr({
          "style": styles.join(" "),
          "scrolling": "no",
          "referrerpolicy": "no-referrer",
          "allowfullscreen": "yes",
          "sandbox": [
            "allow-forms",
            "allow-modals",
            "allow-orientation-lock",
            "allow-pointer-lock",
            "allow-popups",
            "allow-popups-to-escape-sandbox",
            "allow-presentation",
            "allow-same-origin",
            "allow-scripts",
            "allow-top-navigation",
            "allow-top-navigation-by-user-activation"
          ].join(" ")
        });
        window.document.body.scrollTop = 0;
        iframe.contentDocument.activeElement.focus();
      }.bind(this);
      Adapt.on("iframe:change", resizeMe);
      Adapt.on("iframe:change", _.debounce(resizeMe, 100));
      Adapt.on("iframe:change", _.debounce(resizeMe, 500));
    }

  });

  return new Extension();

});