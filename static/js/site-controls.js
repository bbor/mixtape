define(['jquery', 'hoverDelay'], function($) {

  var showControlPanel = function() {
    if ($(window).width() < 600) return;
    $('#control-panel').animate({width:'380px'});
    if ($(window).width() < 1224)
      $('#control-panel').addClass('controls-open');
  }
  var hideControlPanel = function () {
    if ($(window).width() < 600) return;
    var screenwidth = $(window).width();
    var targetwidth = (screenwidth > 1224) ? 380 : (screenwidth > 900) ? 300 : 140;
    hideTocControl();
    hideFindControl();
    $('#control-panel').animate({width:targetwidth + 'px'}, function() { $('#control-panel').removeClass('controls-open').removeAttr('style') });
  }
  var hideFindControl = function() {
    if ($(window).width() < 600) return;
    $('#control-find-zen').fadeIn();
    $('#control-find-content').fadeOut();
  }
  var showFindControl = function () {
    if ($(window).width() < 600) return;
    $('#control-find-zen').fadeOut();
    $('#control-find-content').show();
    $('input#find').focus();
    showControlPanel();
  }
  var hideTocControl = function() {
    if ($(window).width() < 600) return;
    $('#control-toc-zen').fadeIn();
    $('#control-toc-content').fadeOut();
  }
  var showTocControl = function () {
    if ($(window).width() < 600) return;
    $('#control-toc-zen').fadeOut();
    $('#control-toc-content').show();
    showControlPanel();
  }

  $(document).ready( function() {
    $('#top-controls').on('click', function() {
      if ($('#control-panel').height() < 100)
      {
        $('#control-panel').animate({'height':'100%'});
        $('#top-controls-slider').removeClass('fa-angle-down').addClass('fa-angle-up');
      } else {
        $('#control-panel').animate({'height':'40px'}, function() { $('#control-panel').removeClass('controls-open').removeAttr('style') });
        $('#top-controls-slider').removeClass('fa-angle-up').addClass('fa-angle-down');
      }
    });

    $('#control-find-zen').hoverDelay({
      delayIn:300,
      handlerIn:showFindControl
    }).on('click', showFindControl);

    $('#control-toc-zen').hoverDelay({
      delayIn:300,
      handlerIn:showTocControl
    }).on('click', showTocControl);

    $('#control-panel').hoverDelay({
      delayOut:200,
      handlerOut:hideControlPanel
    });
    $('#control-find-content').hoverDelay({
      delayOut:200,
      handlerOut:hideFindControl
    });
    $('#control-toc-content').hoverDelay({
      delayOut:200,
      handlerOut:hideTocControl
    });

    $('#content').on('click touchstart', function(e) {
      hideFindControl();
      hideTocControl();
      hideControlPanel();
    });

    var anchor = location.hash;
    if (anchor && anchor != '#')
    {
      anchor = anchor.replace('#', '');
      $('a[name=' + anchor + ']').closest('h1,h2,h3,h4,h5,h6,h7').addClass('glow').delay(1250).queue(function(next){
        $(this).removeClass('glow');next();
      });
    }

  });

  return {};
});