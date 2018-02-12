
define(['jquery','highlight/prettify'], function($) {

  var lang_files = {};
  $('code[class^=language-]').each(function() {
    var lang = 'highlight/' + $(this).attr('class').replace('language','lang');
    lang_files[lang] = true;
  });
  $(document).ready( function() {
    require(Object.keys(lang_files), function() {
      prettyPrint();
    });
  });

});