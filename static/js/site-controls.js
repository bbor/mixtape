define(['jquery', 'hoverDelay'], function($) {

  var site_controls = {}

  // true if we're in "mobile" mode, with a horizontal control strip.
  site_controls.is_mobile = function() {
    return $('#content').css('margin-left').replace('px', '') < 50;
  }
  // 0-5 magnification level
  site_controls.breakpoint_level = function() {
    if (site_controls.is_mobile()) {
      if ($('#control-strip-h').innerHeight() < 50) { return 0 }
      return 1;
    } else
    {
      var textleft = $('#content').css('margin-left').replace('px', '');
      if (textleft > 450) { return 5; };
      if (textleft > 350) { return 4; };
      if (textleft > 250) { return 3; };
      return 2;
    };
  }

  site_controls.hide_control_panel_v = function () {
    var targetheight = (site_controls.breakpoint_level() == 1) ? '60px' : '40px';
    $('#control-panel').animate({'height':targetheight}, function() { $(this).removeAttr('style'); } );
    $('#control-strip-h-find').removeAttr('style');
    $('#control-strip-h-toc').removeAttr('style');
  }
  site_controls.show_control_panel_v = function () {
    $('#control-panel').animate({'height':'100%'}, function() { $('input#find').focus(); });
  }
  site_controls.show_find_control_v = function() {
    $('#control-find').show();
    $('#control-toc').hide();
    $('#control-strip-h-toc').removeAttr('style');
    $('#control-strip-h-find').css({'background-color':'orange'});
    var mw = $('#controls').innerWidth() - 20;
    $('input#find').css({'width':mw});
  }
  site_controls.show_toc_control_v = function() {
    $('#control-toc').show();
    $('#control-find').hide();
    $('#control-strip-h-find').removeAttr('style');
    $('#control-strip-h-toc').css({'background-color':'orange'});
  }

  site_controls.show_control_panel_h = function() {
    $('#control-panel').show();
    $('#control-panel').animate({'width':'600px'});
  }
  site_controls.close_control_panel_h = function() {
    $('#control-panel').animate({'width':'160px'}, function() { $(this).css({'display':'none'}); });
    var breakpoint = site_controls.breakpoint_level();
    var targetleft = (breakpoint == 5) ? '150px' : (breakpoint == 4) ? '100px' : (breakpoint == 3) ? '50px' : '0px';
    $('#control-strip-v').animate({'margin-left':targetleft}, function() {
        $(this).removeAttr('style');
        $(this).removeClass('control-strip-v-open');
        $('#control-panel').removeAttr('style');
        $('#control-strip-v-find').removeAttr('style');
        $('#control-strip-v-toc').removeAttr('style');
      });
  }
  site_controls.show_find_control_h = function() {
    site_controls.show_control_panel_h();
    $('#control-toc').hide();
    $('#control-find').show();
    $('#control-strip-v').addClass('control-strip-v-open');
    $('#control-strip-v').animate({'margin-left':'600px'});
    $('#control-strip-v-find').css({'background-color':'orange'});
    $('#control-strip-v-toc').removeAttr('style');
    $('input#find').css({'width':'520px'}).focus();
  }
  site_controls.show_toc_control_h = function() {
    site_controls.show_control_panel_h();
    $('#control-toc').show();
    $('#control-find').hide();
    $('#control-strip-v').addClass('control-strip-v-open');
    $('#control-strip-v').animate({'margin-left':'600px'});
    $('#control-strip-v-find').removeAttr('style');
    $('#control-strip-v-toc').css({'background-color':'orange'});
  }


  site_controls.glow_heading = function() {
    var anchor = location.hash;
    if (anchor && anchor != '#')
    {
      anchor = anchor.replace('#', '');
      $('a[name=' + anchor + ']').closest('h1,h2,h3,h4,h5,h6,h7').addClass('glow').delay(2000).queue(function(next){
        $(this).removeClass('glow');next();
      });
    }
  }

  $(document).ready( function() {

    $('#control-strip-h-find').on('click', function() {
      if ($('#control-panel').height() < 100)
      {
        site_controls.show_control_panel_v();
        site_controls.show_find_control_v();
      } else {
        if ($('#control-find').is(':visible'))
        {
          site_controls.hide_control_panel_v();
        } else {
          site_controls.show_find_control_v();
        }
      }
    });

    $('#control-strip-h-toc').on('click', function() {
      if ($('#control-panel').height() < 100)
      {
        site_controls.show_control_panel_v();
        site_controls.show_toc_control_v();
      } else {
        if ($('#control-toc').is(':visible'))
        {
          site_controls.hide_control_panel_v();
        } else {
          site_controls.show_toc_control_v();
        }
      }
    });

    $('#control-strip-v-find').hoverDelay({
      delayIn:300,
      handlerIn:site_controls.show_find_control_h
    }).on('click', site_controls.show_find_control_h);

    $('#control-strip-v-toc').hoverDelay({
      delayIn:300,
      handlerIn:site_controls.show_toc_control_h
    }).on('click', site_controls.show_toc_control_h);

    $(document).on('click', function(e) {
      if($(e.target).closest('#control-panel, #control-strip-v').length)
          return;
      if (!site_controls.is_mobile())
      {
        site_controls.close_control_panel_h();
      }
    });
    $(window).on('hashchange', function(e) {
      site_controls.glow_heading();
      site_controls.close_control_panel_h();
    });

    site_controls.glow_heading();
  });

  return site_controls;
});