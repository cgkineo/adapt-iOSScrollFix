define([
   'core/js/adapt'
], function(Adapt) {

    RegExpEscape = function(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    };

    Adapt.on("app:dataReady", function() {
        var config = Adapt.config.get("_iosscrollfix");

        //super hacky fix for ios fixed position elements and desktop window scrolling
        var isFixOn =  (config && config._onHTMLClasses && $("html").is(config._onHTMLClasses));
        var isNoConfig = (!config || !config._onHTMLClasses);

        if (isFixOn || isNoConfig) {
            var isVersionMatch = true;

            if (config && config._onIOSVersions) {
                isVersionMatch = false;
                var iosversion = Adapt.device.osVersion || Adapt.device.OS/*v2.0.16 and earlier*/;
                for (var i = 0, l = config._onIOSVersions.length; i < l; i++) {
                    var regex = new RegExp(RegExpEscape(config._onIOSVersions[i]));
                    if (regex.test(iosversion)){
                        isVersionMatch = true;
                        break;
                    }
                }
            }

            if (!isVersionMatch) return;

            //add styling
            $("html").addClass("iosscrollfix");

            //make fake html and body tags
            var $scrollingContainer = $('<div class="scrolling-container"><div class="scrolling-inner body"></div></div>');
            var $scrollingInner = $scrollingContainer.find(".scrolling-inner");
            $("body").append($scrollingContainer);

            //move wrapper inside fake tags
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

            //move navigation outside the scrolling area
            var $navigationContainer = $('<div class="navigation-container"></div>');
            $("body").prepend($navigationContainer);

            Adapt.once("adapt:initialize", function() {
                $(".navigation").prependTo($navigationContainer);
            });
        }
    });
});