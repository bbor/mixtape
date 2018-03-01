define(['jquery','jstree','scrollTo'], function($) {

  var jstree_config = {
    "core" : {
      "multiple":false,
      "restore_focus":false,
      "themes" : {
        "dots": false
      },
      "data":function(obj, cb)
      {
        var id = (obj.id == '#') ? 'toc_root' : obj.id;
        require(['toc/data/' + id], function(data) {
          cb(data.children);
        })
      }
    }
  };

  function basename(url) {
    return url.substr(location.pathname.lastIndexOf('/')+1).replace(/\.htm.*/i,'');
  };

  $(document).ready(function () {
    $('#toc').jstree(jstree_config)
    .on('loaded.jstree', function(e, data) {
      var uid = 'toc_' + basename(location.pathname);
      require(['toc/data/' + uid], function(tocdata) {
        function unfold(ancestry, index) {
          if (index < ancestry.length)
          {
            data.instance.open_node(ancestry[index], function() { unfold(ancestry, index + 1); }, false);
          } else {
            // select the last ancestry node
            var nodename = ancestry[ancestry.length - 1];
            if (location.hash) {
              var hashname = 'toc_' + location.hash.replace('#','');
              var node = $.jstree.reference('#toc').get_node(hashname, true);
              if (node.length) nodename = hashname;
            }
            data.instance.is_unfolding = false;
            $('#toc').trigger('unfold_complete', [nodename]);
          }
        }
        data.instance.is_unfolding = true;
        unfold(tocdata.ancestry, 0);
      })
    })
    .on('unfold_complete', function(e, nodename) {
      var node = $.jstree.reference('#toc').get_node(nodename);
      if (node)
      {
        $.jstree.reference('#toc').select_node(node, true);
        $('#toc').trigger('scroll_to_selected', [nodename]);
      }
    })
    .on('changed.jstree', function(e, data) {
      if (data.node.original && data.node.original.target)
      {
        window.location = data.node.original.target;
      }
    })
    .on('open_node.jstree', function(e, data) {
      if (data.node.children && !data.instance.is_unfolding)
      {
        for (var i_c = 0; i_c < data.node.children.length; i_c++)
        {
          var id = data.node.children[i_c];
          var node = data.instance.get_node(id);
          if (node && node.original && node.original.autoexpand)
          {
            data.instance.open_node(node);
          }
        }
      }
    })
    .on('scroll_to_selected', function(e, nodename) {
      if (!nodename) return;
      // we have to temporarily make parents visible before syncing
      var p = $('#control-panel').css('display');
      var d = $('#control-toc').css('display');
      $('#control-panel').css('display','block');
      $('#control-toc').css('display','block');
      $('#control-toc').scrollTo( '#' + nodename, {
        'duration':0,
        'axis':'y',
        'offset':{'top':-150},
        onAfter:function() {
          // return parents back to their previous state
          $('#control-panel').css('display',p);
          $('#control-toc').css('display',d);
        }
      });
    });
    $(window).on('hashchange', function(e) {
      if (location.hash) {
        $.jstree.reference('#toc').deselect_all(true);
        var uid = 'toc_' + location.hash.substr(1);
        var node = $.jstree.reference('#toc').get_node(uid, true);
        if (node.length)
        {
          $.jstree.reference('#toc').select_node(node, true);
          $('#toc').trigger('scroll_to_selected', [uid]);
        }
      }
    });
  });
});