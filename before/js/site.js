// Furra Gjoni site scripts
function MM_preloadImages() {
  var d = document; if (d.images) { if (!d.MM_p) d.MM_p = new Array();
    var i, j = d.MM_p.length, a = MM_preloadImages.arguments;
    for (i = 0; i < a.length; i++) if (a[i].indexOf("#") != 0) { d.MM_p[j] = new Image; d.MM_p[j++].src = a[i]; } }
}
$(document).ready(function () {
  $("#slides").slideshow({ delay: 4500, speed: 1400 });
  $("td.nav a").hoverfx();
  $("table.menutable tr:odd").css("background-color", "#f3e9d2");
  $("table.menutable tr").hover(
    function () { $(this).css("background-color", "#e8d9b5"); },
    function () { $("table.menutable tr:odd").css("background-color", "#f3e9d2"); $("table.menutable tr:even").css("background-color", "#fbf5e6"); }
  );
  $("a.top").click(function () { $("html, body").animate({ scrollTop: 0 }, 600); return false; });
  $("#year").text(new Date().getFullYear());
});
