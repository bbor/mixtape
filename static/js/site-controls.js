define(['jquery', 'hoverDelay'], function($) {

  var toggle_control_panel_v = function () {
    if ($('#control-panel').height() < 100)
    {
      $('#control-panel').animate({'height':'100%'});
    } else {
      var screenwidth = $(window).width();
      var targetheight = (screenwidth > 600) ? '60px' : '40px';
      $('#control-panel').animate({'height':targetheight}, function() { $(this).removeAttr('style'); } );
      $('#control-strip-h-find').css({'background-color':'#bbbbbb'},200);
      $('#control-strip-h-toc').css({'background-color':'#bbbbbb'},200);
    }
  }

  var show_find_control = function() {
    $('#control-find').show();
    $('#control-toc').hide();
    $('#control-strip-h-toc').css({'background-color':'#bbbbbb'},200);
    $('#control-strip-h-find').css({'background-color':'orange'},200);
  }
  var show_find_control_h = function() {
    show_control_panel_h();
    $('#control-toc').hide();
    $('#control-find').show();
    $('#control-strip-v').addClass('control-strip-v-open');
    $('#control-strip-v').animate({'margin-left':'500px'});
    $('#control-strip-v-find').css({'background-color':'orange'},200);
    $('#control-strip-v-toc').css({'background-color':'#bbbbbb'},200);
  }

  var show_toc_control = function() {
    $('#control-toc').show();
    $('#control-find').hide();
    $('#control-strip-h-find').css({'background-color':'#bbbbbb'},200);
    $('#control-strip-h-toc').css({'background-color':'orange'},200);
  }
  var show_toc_control_h = function() {
    show_control_panel_h();
    $('#control-toc').show();
    $('#control-find').hide();
    $('#control-strip-v').addClass('control-strip-v-open');
    $('#control-strip-v').animate({'margin-left':'500px'});
    $('#control-strip-v-find').css({'background-color':'#bbbbbb'},200);
    $('#control-strip-v-toc').css({'background-color':'orange'},200);
  }

  var show_control_panel_h = function() {
    $('#control-panel').show();
    $('#control-panel').animate({'width':'500px'});
  }
  var close_control_panel_h = function() {
    $('#control-panel').animate({'width':'160px'}, function() { $(this).css({'display':'none'}); });
    var contentleft = $('#content').css('margin-left').replace('px', '');
    var targetleft = (contentleft > 450) ? '150px' : (contentleft > 350) ? '100px' : (contentleft > 250) ? '50px' : '0px';
    $('#control-strip-v').animate({'margin-left':targetleft}, function() {
        $(this).removeAttr('style');
        $(this).removeClass('control-strip-v-open');
        $('#control-panel').removeAttr('style');
        $('#control-strip-v-find').css({'background-color':'#bbbbbb'});
        $('#control-strip-v-toc').css({'background-color':'#bbbbbb'});
      });
  }

  $(document).ready( function() {

    $('#control-strip-h-find').on('click touchstart', function() {
      if ($('#control-panel').height() < 100)
      {
        toggle_control_panel_v();
        show_find_control();
      } else {
        if ($('#control-find').is(':visible'))
        {
          toggle_control_panel_v();
        } else {
          show_find_control();
        }
      }
    });

    $('#control-strip-h-toc').on('click touchstart', function() {
      if ($('#control-panel').height() < 100)
      {
        toggle_control_panel_v();
        show_toc_control();
      } else {
        if ($('#control-toc').is(':visible'))
        {
          toggle_control_panel_v();
        } else {
          show_toc_control();
        }
      }
    });

    $('#control-strip-v-find').hoverDelay({
      delayIn:300,
      handlerIn:show_find_control_h
    }).on('click', show_find_control_h);

    $('#control-strip-v-toc').hoverDelay({
      delayIn:300,
      handlerIn:show_toc_control_h
    }).on('click', show_toc_control_h);

    $('#content').on('click touchstart', function(e) {
      close_control_panel_h();
    });
    $(window).on('hashchange', function(e) {
      close_control_panel_h();
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