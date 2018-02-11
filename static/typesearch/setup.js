
define(['jquery','typeahead','bloodhound'], function($) {
  // used to tokenize the data and the input string, so that matches will begin
  // after any non-alpha-numeric character.
  function nonAlphanum(str) {
    return str ? str.split(/[^A-Za-z0-9]+/) : [];
  }

  // boosts results that have better matches in the "name" field, if any.
  function nameBooster(a, b) {
    var request = $('.tt-input').val();
    // prefer an option that matches the user input identically.
    if (a == request) return -1;
    if (b == request) return 1;
    if (typeof(a.name) != "undefined" && typeof(b.name) != "undefined")
    {
      var a_indexOfReqInName = a.name.indexOf(request);
      var b_indexOfReqInName = b.name.indexOf(request);
      // next best would be something that matches at the start of the name.
      if (a_indexOfReqInName == 0 && b_indexOfReqInName != 0) return -1;
      if (b_indexOfReqInName == 0 && a_indexOfReqInName != 0) return 1;
      // next best would be something where the name contains the user input someplace else.
      if (a_indexOfReqInName > 0 && !a.name.charAt(a_indexOfReqInName-1).match(/[A-Za-z0-9]/) && (b_indexOfReqInName < 0 || b.name.charAt(b_indexOfReqInName-1).match(/[A-Za-z0-9]/))) return -1;
      if (b_indexOfReqInName > 0 && !b.name.charAt(b_indexOfReqInName-1).match(/[A-Za-z0-9]/) && (a_indexOfReqInName < 0 || a.name.charAt(a_indexOfReqInName-1).match(/[A-Za-z0-9]/))) return 1;
    }
    // fall back on alpha comparison by value.
    return a.v > b.v;
  }

  // load the typeahead data and set up the handler on the text field.
  $(document).ready( function() {
    require(['typesearch/data'], function(searchdata) {
      var searchdatatypes = Object.keys(searchdata);
      var bloodhounds = (function() {
        var list = {};
        for(var i = 0; i < searchdatatypes.length; i++)
        {
          var key = searchdatatypes[i];
          list[i] = new Bloodhound({
            datumTokenizer: function(datum) {return nonAlphanum(datum.v)},
            queryTokenizer: nonAlphanum,
            sorter: nameBooster,
            local:searchdata[key].data
          });
        }
        return list;
      })();
      var datasources = (function() {
        var list = [];
        list[0] = {
          highlight:true
        };
        for(var i = 0; i < searchdatatypes.length; i++)
        {
          var key = searchdatatypes[i];
          var title = searchdata[key].title;
          var source = {};
          source.name = key;
          source.display = "v";
          source.source = bloodhounds[i];
          source.limit = 50;
          source.templates = {
            header: '<div class="tt-suggestion-header">' + title + '</div>'
          }
          list[i+1] = source;
        }
        return list;
      })();
      var typeaheadObject = $('#find.typeahead');
      $.fn.typeahead.apply(
        typeaheadObject,
        datasources
      );

      $('.typeahead').bind('typeahead:select', function(ev, suggestion) {
        if (typeof(suggestion.u) != "undefined")
        {
          window.location.href = suggestion.u;
        }
      });
    });
  });

});