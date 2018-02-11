requirejs.config({
  baseUrl: 'js',
  paths: {
    typesearch: '../typesearch',
    prettify: '../prettify',
    search: '../search',
    toc: '../toc',
    jquery: 'jquery-3.3.1.min',
    hoverDelay: 'jquery.hoverDelay.min',
    typeahead: '../typesearch/typeahead.jquery.min',
    bloodhound: '../typesearch/bloodhound.min',
    jstree: '../toc/jstree.min'
  },
  shim: {
    'hoverDelay': {deps:['jquery']},
    'jstree': {deps:['jquery']}
  }
});

requirejs(['jquery', 'site-controls', 'prettify/setup', 'typesearch/setup', 'toc/setup'], function($) {
  console.log('all initialized.');
})