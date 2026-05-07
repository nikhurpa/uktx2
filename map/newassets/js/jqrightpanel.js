// (function ($) {

//   $.fn.rightPullPanel = function (options) {

//     const settings = $.extend({
//       width: 320,
//       topOffset: 50
//     }, options);

//     return this.each(function () {

//       const $panel = $(this)
//         .addClass("rsp-panel")
//         .css({
//           width: settings.width,
//           top: settings.topOffset,
//           right: -settings.width
//         });

//       // Add pull handle
//       const $handle = $('<div class="rsp-handle"></div>');
//       $panel.append($handle);

//       function open() {
//         $panel.addClass("open").css("right", 0);
//       }

//       function close() {
//         $panel.removeClass("open").css("right", -settings.width);
//       }

//       $handle.on("click", function () {
//         $panel.hasClass("open") ? close() : open();
//       });

//       // Expose API
//       $panel.data("rightPullPanel", { open, close });
//     });
//   };

// })(jQuery);

(function ($) {

  $.fn.rightPullPanel = function (options) {

    const settings = $.extend({
      width: 320,
      topOffset: 50,
      contentSelector: null
    }, options);

    return this.each(function () {

      const $panel = $(this)
        .addClass("rsp-panel")
        .css({
          width: settings.width,
          top: settings.topOffset,
          right: -settings.width
        });

      // Main content
      const $content = $(settings.contentSelector);

      // Add pull handle
      const $handle = $('<div class="rsp-handle"></div>');
      $panel.append($handle);

      function open() {

        $panel.addClass("open").css("right", 0);

        // Reduce main div width
        if ($content.length) {
          $content.css({
            marginRight: settings.width + "px",
            transition: "margin-right 0.3s"
          });
        }
      }

      function close() {

        $panel.removeClass("open").css("right", -settings.width);

        // Restore main div
        if ($content.length) {
          $content.css({
            marginRight: "0px",
            transition: "margin-right 0.3s"
          });
        }
      }

      $handle.on("click", function () {
        $panel.hasClass("open") ? close() : open();
      });

      // Expose API
      $panel.data("rightPullPanel", { open, close });
    });
  };

})(jQuery);