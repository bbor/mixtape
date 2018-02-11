var assert = require('assert');
var path = require('path');
var fse = require('fs-extra');
var marked = require('marked');
var handlebars = require('handlebars');
var clone = require('clone');
var fast_filter = require('fast-filter');

var mixtape = {};

mixtape.context = {};

/*
  Generates a static site for browsing the content recorded in a database.
  Requires the following arguments:
  - types:    An object that defines the types of data your database contains, what kind of relationships exist
              between the types, and per-type configuration options.
  - options:  An object that contains configuration parameters for mixtape's operation.
              - output: the name of the output folder where the HTML reference will be written. Default is `./mixtape-html-output`.
              - static: defines static files that should be copied as-is to the output folder. This is an array of
                        objects, where each is {'from':'file_or_glob','to':'folder'} The `to` field is optional; if omitted,
                        the `from` files will be copied to the top-level output folder, retaining their relative paths.
                        If you need extra files for your content (like images) you can add your own objects to this array.
                        TBD: how to remove the default static files if using a custom template?
              - templates: defines the partial HTML pages that will be the basis for each generated file.
                - templates.page = the template used for most content pages.
  - db:       An object that contains the data objects that mixtape will work on. Each object should have these fields:
              - type: identifies what type of record this is. Typically one of the types listed in the `types` object.
              - name: a display name for the record.
              - content: the content that you want people to read for this record, in Markdown.
              - summary: optional brief description of the record.
*/

mixtape.run = function(types, options, db, cb)
{
  set_up_environment();
  set_up_config();
  set_up_destination();
  set_up_targets();
  copy_static_files();
  build_html_files();
  build_typeahead();
  build_toc();

  if (cb && typeof(cb) === 'function') cb();


  function set_up_config() {
    options = options || {};
    options.output = options.output || './mixtape-output';

    options.static = options.static || [];
    options.static.push(
      { 'from':path.join(__dirname, '..', 'static') }
    );

    options.templates = options.templates || {
      'page':path.join(__dirname, '..', 'templates', 'page.html')
    }
    options.templates_compiled = {}
    Object.keys(options.templates).forEach(function(key,index) {
      var fname = options.templates[key];
      assert(fse.existsSync(fname), 'Template file ' + fname + ' does not exist.');
      var template_html = fse.readFileSync(fname, 'utf8');
      options.templates_compiled[key] = handlebars.compile(template_html);
    });
  };

  function set_up_destination() {
    fse.emptyDirSync(options.output);
  }

  function copy_static_files() {
    options.static.forEach(function (fromto) {
      var ffrom = fromto['from'];
      var to = (fromto['to']) ? path.join(options.output, fromto['to']) : options.output;
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
        if (types[test_type] && types[test_type].page !== false)
        {
          return record;
        }
        if (record.parent && db[record.parent])
        {
          return get_page_element(db[record.parent]);
        }
        return null;
      }
      var page_element = get_page_element(record);
      if (page_element)
      {
        record.page = page_element.uid + '.html';
        record.target = page_element.uid + '.html';
        if (page_element.uid != record.uid)
        {
          record.target += '#' + record.uid;
        }
      }
    }
  }

  function set_up_environment() {
    var mrenderer = new marked.Renderer();
    function escape(html, encode) {
      return html
        .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // configures marked to generate codeblocks compatible with prettyprint.
    // TODO: only accept ones that have a .js file in the prettyprint folder?
    mrenderer.code = function(code, lang, escaped) {
      if (lang)
      {
        lang = lang.match(/[\-\w]+/i)[0]; // take only plain text characters and -, skip any curly brackets and dots like {.css}
      }

      if (lang == 'javascript') lang = 'js'; // common mistake, so let's be nice.

      if (!lang || lang == '' || lang == 'nohighlight' || lang == 'no-highlight' || lang == 'c' || lang == 'cpp') {
        return '<pre><code>'
          + (escaped ? code : escape(code, true))
          + '\n</code></pre>';
      }

      return '<pre class="prettyprint"><code class="language-'
        + escape(lang, true)
        + '">'
        + (escaped ? code : escape(code, true))
        + '\n</code></pre>\n';
    };
    mrenderer.link_old = mrenderer.link;
    mrenderer.link = function(href, title, linktext) {
      // TODO: if the href matches an item in the db, replace the link with its target instead
      // TBD: but we have to support resolving within the current scope, which means somehow binding
      // the current record to this function.
      return mrenderer.link_old(href, title, linktext);
    }

    marked.setOptions({
      renderer: mrenderer
    })
  }

  function build_html_files() {

    Object.values(db).forEach( function(record) {
      var record_type = record.type;
      if (types[record_type] && types[record_type].page !== false)
        build_html_file(record);
    });

    function build_html_file(record) {
      // TODO: generate a summary from the description if needed

      var output_filename = path.join(options.output, record.target);

      var record_context = clone(mixtape.context);

      // figure out the page and content title
      record_context['page-title'] = "mixtape page for " + record.name;

      // todo: how to handle this?
      if (record.type != 'page')
      {
        record_context['content-title'] = record.name;
      }

      // markdown generate the summary and details
      if (record.summary && !record.summary == "")
      {
        record_context['content-summary'] = marked(record.summary);
      }

      record_context['content'] = "";
      if (record.content && !record.content == "")
      {
        record_context['content'] += marked(record.content);
      }
      print_data_children(record, record_context, 1);

      // handlebars the template
      var output_content = options.templates_compiled['page'](record_context);

      // write the file to disk
      fse.writeFileSync(output_filename, output_content, 'utf8');
    }

    // TODO: rationalize this using helpers.
    function print_data_children(record, record_context, demote_headings_level) {
      var max_h_level = demote_headings_level + 1;
      var children = record.children;
      if (children.length > 0)
      {
        children.forEach( function(child_uid) {
          var child = db[child_uid];
          assert(child, "Somehow this record's UID is not found in the database: " + child_uid);
          var child_type = child.type;
          if (child.display_name || child.name)
            record_context['content'] += '<h' + max_h_level + '><a name=' + child.uid + '></a>' + (child.display_name || child.name) + '</h' + max_h_level + '>';
          record_context['content'] += '<p>content for ' + child.target + '</p>';
          if (types[child_type] && types[child_type].page === false) { return; }
          if (child.content || child.summary)
            record_context['content'] += marked((child.content || child.summary + '\n\n' + child.details));
          print_data_children(child, record_context, demote_headings_level + 1);
        })
      }
    }
  };

  function build_typeahead() {
    var typeahead_data = {};
    Object.keys(types).forEach( function(typename) {
      var new_record = {};
      new_record.title = types[typename].subgroup_title || typename;
      new_record.data = [];
      var all_records_of_thistype = fast_filter(Object.values(db), function(record) { return record.type == typename; });
      all_records_of_thistype.forEach( function(record) {
        var d = {};
        d.u = record.target;
        d.v = record.name;
        d.name = record.name.substr(record.name.lastIndexOf('.') + 1);
        new_record.data.push(d);
      });
      typeahead_data[typename] = new_record;
    });
    var data_content = 'define(' + JSON.stringify(typeahead_data) + ');';
    var data_filename = path.join(options.output, 'typesearch', 'data.js');
    fse.writeFileSync(data_filename, data_content, 'utf8');
  };

  function build_toc() {
    // TODO:sorting, icons
    var datapath = path.join(options.output, 'toc', 'data');
    fse.ensureDirSync(datapath);
    var rootdata = [];
    Object.values(db).forEach( function(record) {
      if (!record.parent) {
        rootdata.push(record.uid);
      }
      if (record.children.length > 0) {
        print_toc_data_file(record.uid, record.children)
      }
    });
    print_toc_data_file('root', rootdata);

    function print_toc_data_file(uid, child_uids)
    {
      var arr = [];
      child_uids.forEach(function(child_uid) {
        var record = db[child_uid];
        if (!record) { return; }
        var data = {};
        data.id = record.uid;
        data.target = record.target;
        data.text = record.display_name || record.name;
        if (record.children.length > 0) {
          data.children = true;
        }
        arr.push(data);
      });
      var data_content = 'define([], function() { return ' + JSON.stringify(arr) + '; });';
      var data_filename = path.join(datapath, uid + '.js');
      fse.writeFileSync(data_filename, data_content, 'utf8');
    }
  }

};


module.exports = mixtape;

