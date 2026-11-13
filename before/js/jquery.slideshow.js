/* jquery.slideshow.js - simple cross-fade slideshow, 2011 */
(function ($) {
  $.fn.slideshow = function (options) {
    var opts = $.extend({ delay: 4000, speed: 1200 }, options);
    return this.each(function () {
      var $box = $(this), $slides = $box.find("img"), i = 0;
      $slides.hide().eq(0).show();
      function next() {
        var $cur = $slides.eq(i);
        i = (i + 1) % $slides.length;
        $cur.fadeOut(opts.speed);
        $slides.eq(i).fadeIn(opts.speed);
      }
      if ($slides.length > 1) { setInterval(next, opts.delay); }
    });
  };
})(jQuery);
