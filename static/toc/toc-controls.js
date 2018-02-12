define(['jquery','jstree'], function($) {

  var jstree_config = {
    "core" : {
      "multiple":false,
      "themes" : {
        "variant" : "large",
        "dots": false
      },
      "data":function(obj, cb)
      {
        var id = (obj.id == '#') ? 'root' : obj.id;
        require(['toc/data/' + id], function(data) {
          cb(data);
        })
      }
    }
  };

  $(document).ready(function () {
    $('#toc-form').jstree(jstree_config).on('changed.jstree', function(e, data) {
      if (data.node.original && data.node.original.target)
      {
        window.location = data.node.original.target;
      }
    }).on('open_node.jstree', function(e, data) {
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
    });
  });

});