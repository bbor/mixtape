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
      var uid;
      if (!!location.hash) { uid = 'toc_' + location.hash.substr(1); }
      else { uid = 'toc_' + basename(location.pathname); }
      require(['toc/data/' + uid], function(tocdata) {
        function unfold(ancestry, index) {
          if (index < ancestry.length)
          {
            data.instance.open_node(ancestry[index], function() { unfold(ancestry, index + 1); }, false);
          } else {
            // select the last ancestry node
            var node = data.instance.get_node(ancestry[ancestry.length - 1], true);
            if (node) {
              data.instance.select_node(node, true);
              $('#toc').trigger('scroll_to_selected', [node]);
            }
          }
        }
        unfold(tocdata.ancestry, 0);
      })
    })
    .on('changed.jstree', function(e, data) {
      if (data.node.original && data.node.original.target)
      {
        window.location = data.node.original.target;
      }
    })
    .on('open_node.jstree', function(e, data) {
      if (data.node.children)
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
  })
  .on('scroll_to_selected', function(e, node) {
    var d = $('#control-toc').css('display');
    $('#control-panel').css('display','block');
    $('#control-toc').css('display','block');
    $('#control-toc').scrollTo( node, {'axis':'y','offset':{'top':-100},onAfter:function() { $(this).removeAttr('style'); } } );
  });
  $(window).on('hashchange', function() {
    if (!!location.hash) {
      var uid = 'toc_' + location.hash.substr(1);
      var node = $.jstree.reference('#toc').get_node(uid, true);
      $.jstree.reference('#toc').select_node(node, true);
      $('#toc').trigger('scroll_to_selected', [node]);
    }
  })
});