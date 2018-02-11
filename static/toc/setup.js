define(['jquery','jstree'], function($) {

  var jstree_config = {
    "core" : {
      "multiple":false,
      "themes" : {
        "variant" : "large"
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
      var nodeid = data.selected[0];
      if (nodeid) {
        var node = data.instance.get_node(nodeid);
        if (node) {
          var target = node.original.target;
          if (target) {
            window.location = target;
          }
        }
      }
    })
  });

});