requirejs.config({
  baseUrl: 'js',
  paths: {
    livesearch: '../livesearch',
    highlight: '../highlight',
    search: '../search',
    toc: '../toc',
    jquery: 'jquery-3.3.1.min',
    hoverDelay: 'jquery.hoverDelay.min',
    scrollTo: 'jquery.scrollTo.min',
    typeahead: '../livesearch/typeahead.jquery.min',
    bloodhound: '../livesearch/bloodhound.min',
    jstree: '../toc/jstree.min'
  },
  shim: {
    'hoverDelay': {deps:['jquery']},
    'scrollTo': {deps:['jquery']},
    'jstree': {deps:['jquery']}
  }
});

requirejs(['site-controls', 'highlight/highlight-controls', 'livesearch/livesearch-controls', 'toc/toc-controls'], function($) {
  console.log('all initialized.');
})