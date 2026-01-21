(function ($) {

  function TabManager($el, options) {
    this.$el = $el;
    this.settings = $.extend({
      data: [],
      activeIndex: 0,
      animation: true,
      onChange: null
    }, options);

    this.init();
  }

  TabManager.prototype.init = function () {
    this.$el.empty().addClass("adv-tabs");
    this.$nav = $("<ul class='adv-nav'></ul>");
    this.$panels = $("<div class='adv-panels'></div>");

    this.$el.append(this.$nav, this.$panels);
    this.render();
    this.activate(this.settings.activeIndex);
  };

  TabManager.prototype.render = function () {
    const self = this;
    this.$nav.empty();
    this.$panels.empty();

    this.settings.data.forEach(function (tab, i) {

      const $li = $("<li>")
        .text(tab.title)
        .attr("data-id", tab.id)
        .toggleClass("disabled", tab.disabled)
        .on("click", function () {
          if (!tab.disabled) self.activate(i);
        });

      const $panel = $("<div>")
        .attr("id", tab.id)
        .addClass("adv-panel")
        .hide();

      self.$nav.append($li);
      self.$panels.append($panel);
    });
  };

  TabManager.prototype.activate = function (index) {
    const tab = this.settings.data[index];
    if (!tab || tab.disabled) return;

    this.$nav.find("li").removeClass("active").eq(index).addClass("active");

    const $panel = this.$panels.find(".adv-panel").hide().eq(index);

    if (tab.url && !$panel.data("loaded")) {
      $panel.load(tab.url, () => $panel.data("loaded", true));
    }

    this.settings.animation
      ? $panel.fadeIn(200)
      : $panel.show();

    if (typeof this.settings.onChange === "function") {
      this.settings.onChange(index, tab);
    }
  };

  TabManager.prototype.addTab = function (tab) {
    this.settings.data.push(tab);
    this.render();
  };

  TabManager.prototype.removeTab = function (id) {
    this.settings.data = this.settings.data.filter(t => t.id !== id);
    this.render();
  };

  TabManager.prototype.disableTab = function (index) {
    this.settings.data[index].disabled = true;
    this.render();
  };

  $.fn.advancedTabs = function (options) {
    const manager = new TabManager(this, options);
    this.data("tabManager", manager);
    return manager;
  };

})(jQuery);