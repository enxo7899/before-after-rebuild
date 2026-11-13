/* jquery.hoverfx.js - fades menu items on hover, 2011 */
(function ($) {
  $.fn.hoverfx = function () {
    return this.each(function () {
      $(this).hover(
        function () { $(this).stop(true, true).animate({ opacity: 0.6 }, 150); },
        function () { $(this).stop(true, true).animate({ opacity: 1 }, 150); }
      );
    });
  };
})(jQuery);
