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