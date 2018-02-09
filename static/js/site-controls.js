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
      prettyPrint();
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
      });

      $('#control-toc-zen').hoverDelay({
        delayIn:300,
        handlerIn:showTocControl
      });

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

      /*      $('#content').on('click touchstart', function(e) {
        $('#control-find-zen').fadeIn();
        $('#control-toc-zen').fadeIn();
        $('#control-toc-content').fadeOut();
        $('#control-find-content').fadeOut();
        //$('#controls').animate({width:'100px'});
        //$('#controls').removeClass('controls-open');
        $('a.permalink').fadeOut();
        if ($(e.target).is('div.heading'))
        {
          alert('ok');
          $(e.target).find('a.permalink').fadeIn();
        };
      });

      $('#control-find-zen').hoverDelay({
        delayIn:300,
        handlerIn:function($elem) {
          $elem.fadeOut();
          $('control-find-content').show();
          $('input#find').focus();
        }
      });
      $('#control-find-zen').on('touchstart', function(e) {
        $('#control-find-zen').fadeOut();
        $('#control-find-content').fadeIn();
        $('#controls').animate({width:'380px'});
        $('#controls').addClass('controls-open');
        $('input#find').focus();
      });
      $('#control-find').hoverDelay({
        delayOut:100,
        handlerOut:function($elem) {
          if ( $('input#find').val() == "" )
          {
            $('#control-find-zen').fadeIn();
          }
        }
      })

      $('#control-toc-zen').hoverDelay({
        delayIn:300,
        handlerIn:function($elem) {
          $elem.fadeOut();
        }
      });
      $('#control-toc-zen').on('touchstart', function(e) {
        $('#control-toc-zen').fadeOut();
        $('#control-toc-content').fadeIn();
        $('#controls').addClass('controls-open');
        $('#controls').animate({width:'380px'});
      });
      $('#control-toc').hoverDelay({
        delayOut:100,
        handlerOut:function($elem) {
          $('#control-toc-zen').fadeIn();
        }
      })

      $('div.heading').hoverDelay({
        delayIn:400,
        delayOut:200,
        handlerIn:function($elem) {
          $elem.find('a.permalink').fadeIn();
        },
        handlerOut:function($elem) {
          $elem.find('a.permalink').fadeOut();
        }
      });*/
    });
