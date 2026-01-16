(function ($) {

  $.fn.verticalToolbar = function (options) {

    const defaults = {
      tools: [],                 // tools configuration
      activeClass: "active",
      buttonClass: "mode-button",
      onSelect: null
    };

    const settings = $.extend(true, {}, defaults, options);

    return this.each(function () {

      const $container = $(this).addClass("vertical-toolbar");

      function createButton(tool) {
        const $btn = $("<button>", {
          id: tool.id,
          class: settings.buttonClass,
          title: tool.title
        });

        if (tool.icon) {
          $btn.append(`<img src="${tool.icon}" draggable="false">`);
        }

        if (tool.html) {
          $btn.append(tool.html);
        }

        if (tool.disabled) {
          $btn.prop("disabled", true);
        }

        return $btn;
      }

      settings.tools.forEach(tool => {
        $container.append(createButton(tool));
      });

      $container.on("click", "." + settings.buttonClass, function () {
        const $btn = $(this);

        $container
          .find("." + settings.buttonClass)
          .removeClass(settings.activeClass);

        $btn.addClass(settings.activeClass);

        if (typeof settings.onSelect === "function") {
          settings.onSelect({
            id: $btn.attr("id"),
            tool: settings.tools.find(t => t.id === $btn.attr("id")),
            element: $btn
          });
        }
      });
    });
  };

})(jQuery);


(function ($) {

  $.fn.rightSlidePanel = function (options) {

    const settings = $.extend({
      topOffset: 48,
      width: 320
    }, options);

    return this.each(function () {

      const $panel = $(this)
        .addClass("right-panel")
        .css({
          top: settings.topOffset,
          width: settings.width,
          right: -settings.width
        });

      // Create hamburger
      const $toggle = $(`
        <div class="rp-toggle">
          <span></span><span></span><span></span>
        </div>
      `).appendTo("body");

      function open() {
        $panel.addClass("open").css("right", 0);
      }

      function close() {
        $panel.removeClass("open").css("right", -settings.width);
      }

      $toggle.on("click", function () {
        $panel.hasClass("open") ? close() : open();
      });

      // Expose API
      $panel.data("rightSlidePanel", { open, close });
    });
  };

})(jQuery);