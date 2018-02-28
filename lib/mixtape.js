
var assert = require('assert');
var path = require('path');
var fse = require('fs-extra');
var markdownItFactory = require('markdown-it');
var markdownItAnchor = require('markdown-it-anchor');
var handlebars = require('handlebars');
var clone = require('clone');
var fast_filter = require('fast-filter');
var merge_options = require('merge-options');
var is_absolute_url = require('is-absolute-url');

var mixtape = {};

/*
  TODO: move to readme and document all types and options params, and document the db expectations
  Generates a static site for browsing the content recorded in a database.
  Requires the following arguments:
  - options:  An object that contains configuration parameters for mixtape's operation.
    - output: the name of the output folder where the HTML reference will be written. Default is `./mixtape-html-output`.
    - static: defines static files that should be copied as-is to the output folder. This is an array of
              objects, where each is {'from':'file_or_glob','to':'folder'} The `to` field is optional; if omitted,
              the `from` files will be copied to the top-level output folder, retaining their relative paths.
              If you need extra files for your content (like images) you can add your own objects to this array.
              TBD: how to remove the default static files if using a custom template?
    - templates: defines the partial HTML pages that will be the basis for each generated file.
      - templates.page: the template used for most content pages.
      - templates.default: the default layout for a record's content.
      - templates.collapse: an expandable section.
    - helpers{} : each item is registered with Handlebars as a helper.
    - partials{}: each item is registered with Handlebars as a partial.
    - highlight
      - default_language
    - types:  An object that defines the types of data your database contains, and per-type configuration options.

  Options that you can specify in the overall config, or per-record, or per-type:
    - page: true/false/'parent' : 'parent' means it only gets its own page if it is not a child of anything else
    - layout: the name of a template, a template string, or a function that returns a template string. 'default' or 'collapse'
    - toc
      - add_to_root
      - autoexpand
    - typeahead
      - include
      - group

  - db: An object that contains the data objects that mixtape will work on. Each object should have these fields:
    - type: identifies what type of record this is. Typically one of the types listed in the `config.types` object.
    - name: a display name for the record.
    - content: the content that you want people to read for this record, in Markdown or HTML.
    - content_title: the heading text for the record's content, if any. In Markdown or HTML.
    - content_summary: optional brief description of the record. In Markdown or HTML.
*/

mixtape.run = function(options, db, cb)
{
  var plugin_defaults = {
    output: './mixtape-output',
    templates: {
      'page':path.join(__dirname, '..', 'templates', 'page.html'),
      'default':path.join(__dirname, '..', 'templates', 'default.html'),
      'collapse':path.join(__dirname, '..', 'templates', 'collapse.html')
    },
    static: [{ 'from': path.join(__dirname, '..', 'static') }],
    helpers: {},
    partials: {},
    toc: {
      add_to_root: true,
      autoexpand: false
    }, // .add_to_root, .autoexpand
    typeahead: {
      include: true
    }, // .include, .title
    highlight: {},
    types: {},
    layout: 'default',
    page:true
  };
  var config = {};
  var markdownIt;

  set_up_config();
  set_up_environment();
  set_up_destination();
  set_up_targets();
  copy_static_files();
  build_html_files();
  build_typeahead();
  build_toc();

  if (cb && typeof(cb) === 'function') cb();


  function set_up_config() {
    config = merge_options.call({concatArrays: true}, {}, plugin_defaults, options);
  };

  function heading_open (anchor, level) {
    var html = `
<div class="heading">
<h` + level + `>
  <a name="` + anchor + `" id="` + anchor + `"></a>
  <div class="permalink"><a href="#` + anchor + `" class="permalink fas fa-link"></a></div>`;
    return new handlebars.SafeString(html);
  }

  function heading_close (anchor, level) {
    var html = `
</h` + level + `>
</div>`;
    return new handlebars.SafeString(html);
  }

  function summary_open(level) {
    var html = `
<div class="summary level` + level + `">`
    return new handlebars.SafeString(html);
  }
  function summary_close(level) {
    var html = `
</div>`
    return new handlebars.SafeString(html);
  }

  function md(str) {
    var html = markdownIt.render(str);
    return new handlebars.SafeString(html);
  }

  function print_record(record, heading_level)
  {
    var html = '';
    var record_context = merge_options.call({concatArrays: true}, {}, config, config.types[record.type], record)

    record_context.heading_level = heading_level;

    // get the layout value for the record.
    var layout = record_context.layout;

    // if it's a function, call the function to get a string
    if (typeof(layout) == 'function')
    {
      layout = layout.call(this, record, heading_level, config, db);
    }

    if (typeof(layout) == 'string')
    {
      // if it identifies an existing template, use that template.
      var template = record_context.templates_compiled[layout];
      // otherwise compile the layout string and use it.
      if (!template)
      {
        template = handlebars.compile(layout);
      }
      html = template(record_context);
    }

    return new handlebars.SafeString(html);
  }

  function print_children(heading_level) {
    var html = "";
    var children = this.children;
    children.forEach( function(child_uid) {
      var child = db[child_uid];
      assert(child, "Somehow this record's UID is not found in the database: " + child_uid);

      // TODO: otherwise, print only the summary/stub
      var child_config = merge_options.call({concatArrays: true}, {}, config, config.types[child.type], child)
      if (child_config.page !== true)
      {
        html += print_record(child, heading_level + 1);
      }
    });
    return new handlebars.SafeString(html);
  }

  function set_up_environment() {

    function highlight(code, lang) {
      if (lang)
      {
        lang = lang.match(/[\-\w]+/i)[0]; // take only plain text characters and -, skip any curly brackets and dots like {.css}
        if (lang == 'javascript') lang = 'js'; // common mistake, so let's be nice.
        if (lang == 'python') lang = 'py'; // common mistake, so let's be nice.
        var filename = path.join(__dirname, '..', 'static', 'highlight', 'lang-' + lang + '.js');
        if (!fse.existsSync(filename)) { lang = null; }
      }
      if (lang == 'nohighlight' || lang == 'no-highlight') {
        return '<pre><code>'
          + escapeHtml(code, true)
          + '\n</code></pre>';
      }
      if (!lang || lang == '') {
        var langtext = '';
        // TODO: is there a way to grab these settings per record/ per type?
        if (!!config.highlight.default_language) {
          langtext = ' class="language-' + config.highlight.default_language + '"';
        }
        return '<pre class="prettyprint"><code' + langtext + '>'
          + escapeHtml(code, true)
          + '\n</code></pre>';
      }
      return '<pre class="prettyprint"><code class="language-'
        + escapeHtml(lang, true)
        + '">'
        + escapeHtml(code, true)
        + '\n</code></pre>\n';
    }

    markdownIt = markdownItFactory({
      html:true,
      linkify:true,
      highlight:highlight
    })
    .use(markdownItAnchor, {});

    var defaultLinker = markdownIt.renderer.rules.link_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };
    
    markdownIt.renderer.rules.link_open = function (tokens, idx, options, env, self) {
      var hIndex = tokens[idx].attrIndex('href');
      var href = tokens[idx].attrs[hIndex][1];
      if (is_absolute_url(href))
      {
        var aIndex = tokens[idx].attrIndex('target');    
        if (aIndex < 0) {
          tokens[idx].attrPush(['target', '_blank']); // add new attribute
        } else {
          tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
        }
      }
      // pass token to default renderer.
      return defaultLinker(tokens, idx, options, env, self);
    };

    // Set up Handlebars
    handlebars.registerHelper('heading_open', heading_open);
    handlebars.registerHelper('heading_close', heading_close);

    handlebars.registerHelper('summary_open', summary_open);
    handlebars.registerHelper('summary_close', summary_close);

    handlebars.registerHelper('print_children', print_children);

    handlebars.registerHelper('md', md);

    Object.keys(config.helpers).forEach( function(key) {
      var func = config.helpers[key];
      if (typeof(func) === 'function')
      {
        handlebars.registerHelper(key, func);
      }
    });

    Object.keys(config.partials).forEach( function(key) {
      var part = config.partials[key];
      if (typeof(part) === 'string')
      {
        handlebars.registerPartial(key, part);
      }
    });

    config.templates_compiled = {}
    Object.keys(config.templates).forEach(function(key,index) {
      var fname = config.templates[key];
      var template_html = fname;
      if (fse.existsSync(fname))
      {
        template_html = fse.readFileSync(fname, 'utf8');
      }
      config.templates_compiled[key] = handlebars.compile(template_html);
    });
  }

  function set_up_destination() {
    fse.emptyDirSync(config.output);
  }

  function copy_static_files() {
    config.static.forEach(function (fromto) {
      var ffrom = fromto['from'];
      var to = (fromto['to']) ? path.join(config.output, fromto['to']) : config.output;
      fse.copySync(ffrom, to);
    });
  };

  function set_up_targets() {
    // each db element needs a unique target: a page and anchor combination where its content will be found.
    // we'll use that target as the href any time we need to link to that symbol.
    var collection = Object.values(db);
    for (var i_record = 0; i_record < collection.length; i_record++)
    {
      var record = collection[i_record];
      function get_page_element(record) {
        var test_type = record.type;
        var record_config = merge_options.call({concatArrays: true}, {}, config, config.types[test_type], record);
        if (record_config.page === false || record_config.page === 'parent')
        {
          if (record.parent && db[record.parent])
          {
            return get_page_element(db[record.parent]);
          }
        }
        if (typeof(record_config.page) === 'undefined' || record_config.page === true || record_config.page === 'parent')
        {
          return record;
        }
        return null; // it has no page of its own, but no parent either. Bad news, it will be unfindable...
      }
      var page_element = get_page_element(record);
      if (page_element)
      {
        record['mixtape-page'] = page_element.uid + '.html';
        record['mixtape-target'] = page_element.uid + '.html';
        if (page_element.uid != record.uid)
        {
          record['mixtape-target'] += '#' + record.uid;
        }
      }
    }
  }

  function build_html_files() {

    Object.values(db).forEach( function(record) {
      var record_config = merge_options.call({concatArrays: true}, {}, config, config.types[record.type], record);
      if (record['mixtape-page'] && record['mixtape-target'] && record['mixtape-page'] == record['mixtape-target'] && record_config.page !== false)
        build_html_file(record);
    });

    function build_html_file(record) {
      var output_filename = path.join(config.output, record['mixtape-target']);
      var record_context = {};

      // figure out the page and content title
      record_context['mixtape-page-title'] = record.page_title || record.content_title || 'mixtape page for ' + record.name;

      record_context['mixtape-content'] = print_record(record, 1);

      // handlebars the template
      var output_content = config.templates_compiled['page'](record_context);

      // write the file to disk
      fse.writeFileSync(output_filename, output_content, 'utf8');
    }
  }

  function build_typeahead() {
    var datapath = path.join(config.output, 'livesearch');
    fse.ensureDirSync(datapath);
    var typeahead_data = {};
    Object.values(db).forEach( function(record) {
      if (!record['mixtape-page'] || !record['mixtape-target']) return;
      var record_config = merge_options.call({concatArrays: true}, {}, config, config.types[record.type], record);
      if (record_config.typeahead.include === false) return;
      var typeahead_group_title = record_config.typeahead.group || '__untyped__';
      var typeahead_group_id = typeahead_group_title.replace(/\W/g,'_');
      typeahead_data[typeahead_group_id] = typeahead_data[typeahead_group_id] || {
        data: [],
        title: typeahead_group_title
      };
      var new_typeahead_record = {};
      new_typeahead_record.u = record['mixtape-target'];
      new_typeahead_record.v = record.content_title || record.name;
      new_typeahead_record.name = record.name.substr(record.name.lastIndexOf('.') + 1);
      typeahead_data[typeahead_group_id].data.push(new_typeahead_record);
    });
    var data_content = 'define(' + JSON.stringify(typeahead_data) + ');';
    var data_filename = path.join(datapath, 'data.js');
    fse.writeFileSync(data_filename, data_content, 'utf8');
  };

  function build_toc() {

    var rootdata = [];
    Object.values(db).forEach( function(record) {
      var record_config = merge_options.call({concatArrays: true}, {}, config, config.types[record.type], record);
      if (record['mixtape-page'] && record['mixtape-target'] && record['mixtape-page'] == record['mixtape-target'] && record_config.page !== false)
        print_toc_data_file(record);
      if (!record.parent && record_config.toc.add_to_root !== false) {
        rootdata.push(record.uid);
      }
    });
    print_toc_data_file({children:rootdata});

    function print_toc_data_file(record)
    {
      function get_toc_data_for_children(record) {
        var data_children = [];
        var child_uids = record.children || [];
        child_uids.forEach(function(child_uid) {
          var child = db[child_uid];
          if (!child || !child['mixtape-page'] || !child['mixtape-target']) { return; }
          var child_config = merge_options.call({concatArrays: true}, {}, config, config.types[child.type], child);
          var child_data = {};
          child_data.id = 'toc_' + child.uid;
          child_data.target = child['mixtape-target'];
          child_data.text = child.content_title || child.name;
          child_data.icon = (child_config.icon) ? child_config.icon : false;
          if (child_config.toc.autoexpand)
          {
            child_data.autoexpand = true;
          }
          if (child.children.length > 0 && child['mixtape-page'] != record['mixtape-page']) {
            child_data.children = true;
          } else if (child['mixtape-page'] == record['mixtape-page'])
          {
            child_data.children = get_toc_data_for_children(child);
          }
          data_children.push(child_data);
        });
        return data_children;
      }
      function get_parent_chain(record, ancestry) {
        if (!record.parent) return;
        var parent = db[record.parent];
        if (parent)
        {
          ancestry.splice(0, 0, 'toc_' + record.parent);
          get_parent_chain(parent, ancestry);
        }
      }
      
      var uid = record.uid || 'root';
      var data = {};
      data.children = get_toc_data_for_children(record);
      data.ancestry = ['toc_' + uid];
      get_parent_chain(record, data.ancestry);
      var data_content = 'define([], function() { return ' + JSON.stringify(data) + '; });';
      var datapath = path.join(config.output, 'toc', 'data');
      fse.ensureDirSync(datapath);
      var data_filename = path.join(datapath, 'toc_' + uid + '.js');
      fse.writeFileSync(data_filename, data_content, 'utf8');
    }
  
  }

};


var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
}

module.exports = mixtape;

