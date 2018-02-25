define(['jquery', 'hoverDelay'], function($) {

  var site_controls = {}

  // true if we're in "mobile" mode, with a horizontal control strip.
  site_controls.is_mobile = function() {
    return $('#content').css('margin-left').replace('px', '') < 50;
  }
  // 0-5 magnification level
  site_controls.breakpoint_level = function() {
    if (site_controls.is_mobile()) {
      if ($('#control-strip-m').innerHeight() < 50) { return 0 }
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

  site_controls.panel_h_height = [40, 60];
  site_controls.panel_v_start_width = [0,0,160,210,260,310];
  site_controls.strip_v_margin_left = [0,0,0,50,100,150];

  site_controls.enable_wave_open = true;

  // vertical sliding panel, for mobile
  site_controls.hide_control_panel_v = function () {
    var breakpoint = site_controls.breakpoint_level();
    var targetheight = site_controls.panel_h_height[breakpoint] + 'px';
    $('#control-panel').animate({'height':targetheight}, function() { $(this).removeAttr('style'); } );
    $('#m-find').removeAttr('style');
    $('#m-toc').removeAttr('style');
  }
  site_controls.show_control_panel_v = function () {
    $('#control-panel').animate({'height':'100%'}, function() { $('input#find').focus(); });
  }
  site_controls.show_find_control_v = function() {
    $('#control-find').show();
    $('#control-toc').hide();
    $('#m-toc').removeAttr('style');
    $('#m-find').css({'background-color':'orange'});
    var mw = $('#controls').innerWidth() - 20;
    $('input#find').css({'width':mw});
  }
  site_controls.show_toc_control_v = function() {
    $('#control-toc').show();
    $('#control-find').hide();
    $('#m-find').removeAttr('style');
    $('#m-toc').css({'background-color':'orange'});
  }

  // horizontal sliding panel, for tablet and desktop
  site_controls.show_control_panel_h = function() {
    if (!$('#control-panel').is(':visible'))
    {
      var breakpoint = site_controls.breakpoint_level();
      var w = site_controls.panel_v_start_width[breakpoint] + 'px';
      $('#control-panel').css({'width': w});
      $('#control-panel').show();
      $('#control-panel').animate({'width':'600px'});
    }
  }
  site_controls.close_control_panel_h = function() {
    if ($('#control-panel').is(':hover') || $('#control-strip-w').is(':hover'))
    {
      site_controls.enable_wave_open = false;
      $('#control-strip-w').one('mousemove', function() { site_controls.enable_wave_open = true; });
    }
    var breakpoint = site_controls.breakpoint_level();
    var targetleft = site_controls.strip_v_margin_left[breakpoint] + 'px';
    var w = site_controls.panel_v_start_width[breakpoint] + 'px';
    console.log(w);
    $('#control-panel').animate({'width': w}, function() { $('#control-panel').removeAttr('style'); });
    $('#control-strip-w').animate({'margin-left': targetleft}, function() {
        $(this).removeAttr('style');
        $(this).removeClass('control-strip-w-open');
        $('#control-strip-w-find').removeAttr('style');
        $('#control-strip-w-toc').removeAttr('style');
      });
  }
  site_controls.show_find_control_h = function() {
    site_controls.show_control_panel_h();
    $('#control-toc').hide();
    $('#control-find').show();
    if ($('#control-strip-w').css('margin-left') != '600px')
    {
      $('#control-strip-w').animate({'margin-left':'600px'});
      $('#control-strip-w').addClass('control-strip-w-open');
    }
    $('#control-strip-w-find').css({'background-color':'orange'});
    $('#control-strip-w-toc').removeAttr('style');
    $('input#find').css({'width':'520px'}).focus();
  }
  site_controls.show_toc_control_h = function() {
    site_controls.show_control_panel_h();
    $('#control-toc').show();
    $('#control-find').hide();
    if ($('#control-strip-w').css('margin-left') != '600px')
    {
      $('#control-strip-w').animate({'margin-left':'600px'});
      $('#control-strip-w').addClass('control-strip-w-open');
    }
    $('#control-strip-w-find').removeAttr('style');
    $('#control-strip-w-toc').css({'background-color':'orange'});
  }


  site_controls.glow_heading = function() {
    var anchor = location.hash.replace(/#/, '') || location.pathname.replace(/^.*\//,'').replace(/\.html?/,'');
    if (!!anchor)
    {
      $('a[name=' + anchor + ']').closest('h1,h2,h3,h4,h5,h6,h7').addClass('glow').delay(2000).queue(function(next){
        $(this).removeClass('glow');next();
      });
    }
  }

  $(document).ready( function() {

    $('#control-strip-m-find').on('click', function() {
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

    $('#control-strip-m-toc').on('click', function() {
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

    $('#control-strip-w-find').hoverDelay({
      delayIn:300,
      handlerIn:function() { if (site_controls.enable_wave_open) site_controls.show_find_control_h(); }
    }).on('click', site_controls.show_find_control_h);

    $('#control-strip-w-toc').hoverDelay({
      delayIn:300,
      handlerIn:function() { if (site_controls.enable_wave_open) site_controls.show_toc_control_h(); }
    }).on('click', site_controls.show_toc_control_h);

    $(document).on('click touchstart', function(e) {
      if($(e.target).closest('#control-panel, #control-strip-w').length)
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