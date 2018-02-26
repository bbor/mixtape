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

  site_controls.panel_m_height = [40, 60];
  site_controls.panel_w_start_width = [0,0,160,210,260,310];
  site_controls.strip_w_margin_left = [0,0,0,50,100,150];

  site_controls.enable_wave_open = true;

  // vertical sliding panel, for mobile
  site_controls.control_panel_is_open_m = function() {
    return $('#control-panel').height() > 100;
  }
  site_controls.find_is_open_m = function() {
    return site_controls.control_panel_is_open_m() && $('#control-find').is(':visible'); 
  }
  site_controls.toc_is_open_m = function() {
    return site_controls.control_panel_is_open_m() && $('#control-toc').is(':visible'); 
  }
  site_controls.close_control_panel_m = function () {
    var breakpoint = site_controls.breakpoint_level();
    var targetheight = site_controls.panel_m_height[breakpoint] + 'px';
    $('#control-panel').animate({'height':targetheight}, function() { $(this).removeAttr('style'); } );
    $('#m-find').removeAttr('style');
    $('#m-toc').removeAttr('style');
  }
  site_controls.open_control_panel_m = function () {
    $('#control-panel').animate({'height':'100%'}, function() { $('input#find').focus(); });
  }
  site_controls.open_find_control_m = function() {
    $('#control-find').show();
    $('#control-toc').hide();
    $('#m-toc').removeAttr('style');
    $('#m-find').css({'background-color':'orange'});
    var mw = $('#controls').innerWidth() - 20;
    $('input#find').css({'width':mw});
  }
  site_controls.open_toc_control_m = function() {
    $('#control-toc').show();
    $('#control-find').hide();
    $('#m-find').removeAttr('style');
    $('#m-toc').css({'background-color':'orange'});
  }
  site_controls.toggle_find_control_m = function() {
    if (site_controls.find_is_open_m()) {
      site_controls.close_control_panel_m();
    } else {
      if (!site_controls.control_panel_is_open_m())
      {
        site_controls.open_control_panel_m();
      }
      site_controls.open_find_control_m();
    }
  }
  site_controls.toggle_toc_control_m = function() {
    if (site_controls.toc_is_open_m()) {
      site_controls.close_control_panel_m();
    } else {
      if (!site_controls.control_panel_is_open_m())
      {
        site_controls.open_control_panel_m();
      }
      site_controls.open_toc_control_m();
    }
  }

  // horizontal sliding panel, for tablet and desktop
  site_controls.control_panel_is_open_w = function() {
    return $('#control-panel').is(':visible') && $('#control-strip-w').css('margin-left') == '600px';
  }
  site_controls.find_is_open_w = function() {
    return site_controls.control_panel_is_open_w() && $('#control-find').is(':visible'); 
  }
  site_controls.toc_is_open_w = function() {
    return site_controls.control_panel_is_open_w() && $('#control-toc').is(':visible'); 
  }
  site_controls.open_control_panel_w = function() {
    if (!site_controls.control_panel_is_open_w())
    {
      var breakpoint = site_controls.breakpoint_level();
      var w = site_controls.panel_w_start_width[breakpoint] + 'px';
      $('#control-panel').css({'width': w});
      $('#control-panel').show();
      $('#control-panel').animate({'width':'600px'});
    }
  }
  site_controls.close_control_panel_w = function() {
    if ($('#control-panel').is(':hover') || $('#control-strip-w').is(':hover'))
    {
      site_controls.enable_wave_open = false;
      $('#control-strip-w').one('mousemove', function() { site_controls.enable_wave_open = true; });
    }
    var breakpoint = site_controls.breakpoint_level();
    var targetleft = site_controls.strip_w_margin_left[breakpoint] + 'px';
    var w = site_controls.panel_w_start_width[breakpoint] + 'px';
    $('#control-panel').animate({'width': w}, function() { $('#control-panel').removeAttr('style'); });
    $('#control-strip-w').animate({'margin-left': targetleft}, function() {
        $(this).removeAttr('style');
        $(this).removeClass('control-strip-w-open');
        $('#control-strip-w-find').removeAttr('style');
        $('#control-strip-w-toc').removeAttr('style');
      });
  }
  site_controls.open_find_control_w = function() {
    site_controls.open_control_panel_w();
    $('#control-toc').hide();
    $('#control-find').show();
    if (!site_controls.control_panel_is_open_w())
    {
      $('#control-strip-w').animate({'margin-left':'600px'});
      $('#control-strip-w').addClass('control-strip-w-open');
    }
    $('#control-strip-w-find').css({'background-color':'orange'});
    $('#control-strip-w-toc').removeAttr('style');
    $('input#find').css({'width':'520px'}).focus();
  }
  site_controls.toggle_find_control_w = function() {
    if (site_controls.find_is_open_w())
    {
      site_controls.close_control_panel_w();
    } else {
      site_controls.open_find_control_w();
    }
  }
  site_controls.open_toc_control_w = function() {
    site_controls.open_control_panel_w();
    $('#control-toc').show();
    $('#control-find').hide();
    if (!site_controls.control_panel_is_open_w())
    {
      $('#control-strip-w').animate({'margin-left':'600px'});
      $('#control-strip-w').addClass('control-strip-w-open');
    }
    $('#control-strip-w-find').removeAttr('style');
    $('#control-strip-w-toc').css({'background-color':'orange'});
  }
  site_controls.toggle_toc_control_w = function() {
    if (site_controls.toc_is_open_w())
    {
      site_controls.close_control_panel_w();
    } else {
      site_controls.open_toc_control_w();
    }
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

  site_controls.expand_heading = function() {
    var anchor = location.hash.replace(/#/, '') || location.pathname.replace(/^.*\//,'').replace(/\.html?/,'');
    if (!!anchor)
    {
      $('#' + anchor).parents('.expandable-content').get().reverse().forEach(function(item) {
        $(item).show();
        $('#' + item.id.replace('-content','-icon')).addClass('icon-rotated');
      });
      $('#' + anchor + '-expand-content').show();
      $('#' + anchor + '-expand-icon').addClass('icon-rotated');
      $(window).scrollTo($('#' + anchor));
    }
  }

  site_controls.toggle_expander = function (e) {
    var id = $(this).attr('id');
    var id_content = '#' + id + '-content';
    var id_icon = '#' + id + '-icon';
    $(id_content).slideToggle();
    $(id_icon).toggleClass('icon-rotated');
  }

  $(document).ready( function() {

    $('#control-strip-m-find').on('click', site_controls.toggle_find_control_m);

    $('#control-strip-m-toc').on('click', site_controls.toggle_toc_control_m);

    $('#control-strip-w-find').hoverDelay({
      delayIn:300,
      handlerIn:function() { if (site_controls.enable_wave_open) site_controls.open_find_control_w(); }
    }).on('click', site_controls.toggle_find_control_w);

    $('#control-strip-w-toc').hoverDelay({
      delayIn:300,
      handlerIn:function() { if (site_controls.enable_wave_open) site_controls.open_toc_control_w(); }
    }).on('click', site_controls.toggle_toc_control_w);

    $(document).on('click touchstart', function(e) {
      if($(e.target).closest('#control-panel, #control-strip-w').length)
          return;
      if (!site_controls.is_mobile())
      {
        site_controls.close_control_panel_w();
      }
    });
    $(window).on('hashchange', function(e) {
      site_controls.glow_heading();
      site_controls.close_control_panel_w();
      site_controls.expand_heading();
    });

    site_controls.glow_heading();
    site_controls.expand_heading();

    $(document).on('click', '.expandable-header', site_controls.toggle_expander)
  });

  return site_controls;
});