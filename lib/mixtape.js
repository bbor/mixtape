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
                - templates.page = the template used for most content pages.
              - highlight
                - default_language
              - types:  An object that defines the types of data your database contains, what kind of relationships exist
                        between the types, and per-type configuration options.

  Options that you can specify in overall config, or per-record, or per-type:
              - page: true/false/'parent' : 'parent' means it only gets its own page if it is not a child of anything else

  - db:       An object that contains the data objects that mixtape will work on. Each object should have these fields:
              - type: identifies what type of record this is. Typically one of the types listed in the `types` object.
              - name: a display name for the record.
              - content: the content that you want people to read for this record, in Markdown.
              - summary: optional brief description of the record.
*/

mixtape.run = function(options, db, cb)
{
  var plugin_defaults = {
    output: './mixtape-output',
    templates: {
      'page':path.join(__dirname, '..', 'templates', 'page.html')
    },
    static: [],
    toc: {}, // .add_to_root, .autoexpand
    highlight: {},
    types: []
  };
  var config = {};

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
    config = Object.assign({}, plugin_defaults, options);

    // TODO: we need a way to avoid this override
    config.static.push({ 'from': path.join(__dirname, '..', 'static') });

    config.templates_compiled = {}
    Object.keys(config.templates).forEach(function(key,index) {
      var fname = config.templates[key];
      assert(fse.existsSync(fname), 'Template file ' + fname + ' does not exist.');
      var template_html = fse.readFileSync(fname, 'utf8');
      config.templates_compiled[key] = handlebars.compile(template_html);
    });
  };

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
        var record_config = Object.assign({}, config, config.types[test_type], record);
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
        return record; // it has no page of its own, but no parent either. Bad news, it will be unfindable.
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
        if (lang == 'javascript') lang = 'js'; // common mistake, so let's be nice.
        if (lang == 'python') lang = 'py'; // common mistake, so let's be nice.
        var filename = path.join(__dirname, '..', 'static', 'highlight', 'lang-' + lang + '.js');
        if (!fse.existsSync(filename)) { lang = null; }
      }

      if (lang == 'nohighlight' || lang == 'no-highlight') {
        return '<pre><code>'
          + (escaped ? code : escape(code, true))
          + '\n</code></pre>';
      }

      if (!lang || lang == '') {
        var langtext = '';
        // TODO: is there a way to grab these settings per record/ per type?
        if (!!config.highlight.default_language) {
          langtext = ' class="language-' + config.highlight.default_language + '"';
        }
        return '<pre class="prettyprint"><code' + langtext + '>'
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
      if (record['mixtape-target'] == record['mixtape-page'])
        build_html_file(record);
    });

    function build_html_file(record) {
      var output_filename = path.join(config.output, record['mixtape-target']);
      var record_context = clone(mixtape.context);

      // figure out the page and content title
      record_context['mixtape-page-title'] = "mixtape page for " + record.name;

      // todo: get this function from record/typeconfig/options
      // but it will need access to the config, the types, and the db too...
      record_context['mixtape-content'] = print_record(record, 1);

      // handlebars the template
      var output_content = config.templates_compiled['page'](record_context);

      // write the file to disk
      fse.writeFileSync(output_filename, output_content, 'utf8');

      function print_record(record, top_heading_level)
      {
        var html = "";

        // content title and anchor
        if (!!record.content_title)
        {
          html += heading( marked(record.content_title), record.uid, top_heading_level);
        }

        // start sub-section
        if (top_heading_level > 1)
        {
          html += `<section>`;
        }

        // summary if it exists
        if (!!record.content_summary)
        {
          html += summary( marked(record.content_summary) );
        }

        // element content
        if (!!record.content)
        {
          html += marked(record.content);
        }

        // child records
        html += print_children(record, top_heading_level);

        // end sub-section, if we added it
        if (top_heading_level > 1)
        {
          html += `</section>`;
        }

        return html;
      }

      // todo:make sure we expose these to be called by customer implementations of print_record
      function print_children(record, current_heading_level) {
        var html = "";
        var children = record.children;
        children.forEach( function(child_uid) {
          var child = db[child_uid];
          assert(child, "Somehow this record's UID is not found in the database: " + child_uid);

          // TODO: only print full record if this child should be inline
          // otherwise, print only the summary/stub
          // also, get function from the record/typeconfig/options
          html += print_record(child, current_heading_level + 1);
        });
        return html;
      }

      function heading(title, anchor, heading_level)
      {
        return `
       <div class="heading">
          <h${heading_level}>
            <a name="${anchor}" id="${anchor}"></a>
            <div class="permalink"><a href="#${anchor}" class="permalink fas fa-link"></a></div>
            ${title}
          </h1>
        </div>`;
      }

      function summary(summary)
      {
        return `
        <div class="summary">
          <p>${summary}</p>
        </div>`;
      }
    }

  }

  function build_typeahead() {
    var datapath = path.join(config.output, 'livesearch');
    fse.ensureDirSync(datapath);
    var typeahead_data = {};
    Object.keys(config.types).forEach( function(typename) {
      var new_record = {};
      new_record.title = config.types[typename].subgroup_title || typename;
      new_record.data = [];
      var all_records_of_thistype = fast_filter(Object.values(db), function(record) { return record.type == typename; });
      all_records_of_thistype.forEach( function(record) {
        var d = {};
        d.u = record['mixtape-target'];
        d.v = record.content_title || record.name;
        // todo: this separator doesn't make sense to be hardcoded here...
        // should we do some kind of "name within scope" field?
        d.name = record.name.substr(record.name.lastIndexOf('.') + 1);
        new_record.data.push(d);
      });
      typeahead_data[typename] = new_record;
    });
    var data_content = 'define(' + JSON.stringify(typeahead_data) + ');';
    var data_filename = path.join(datapath, 'data.js');
    fse.writeFileSync(data_filename, data_content, 'utf8');
  };

  function build_toc() {
    // TODO:sorting
    var datapath = path.join(config.output, 'toc', 'data');
    fse.ensureDirSync(datapath);
    var rootdata = [];
    Object.values(db).forEach( function(record) {
      var record_config = Object.assign({}, config, config.types[record.type], record);
      if (!record.parent && record_config.toc.add_to_root !== false) {
        rootdata.push(record.uid);
      }
      print_toc_data_file(record);
    });
    print_toc_data_file({}, rootdata);

    function print_toc_data_file(record, children)
    {
      var uid = record.uid || 'root';
      var data = {};
      data.children = [];
      var child_uids = record.children || children || [];
      child_uids.forEach(function(child_uid) {
        var child = db[child_uid];
        if (!child) { return; }
        var child_config = Object.assign({}, config, config.types[child.type], child);
        var child_data = {};
        child_data.id = 'toc_' + child.uid;
        child_data.target = child['mixtape-target'];
        child_data.text = child.content_title || child.name;
        child_data.icon = (child_config.icon) ? child_config.icon : false;
        if (child_config.toc && child_config.toc.autoexpand)
        {
          child_data.autoexpand = true;
        }
        if (child.children.length > 0) {
          child_data.children = true;
        }
        data.children.push(child_data);
      });
      function get_parent_chain(record, ancestry) {
        if (!record.parent) return;
        var parent = db[record.parent];
        if (parent)
        {
          ancestry.splice(0, 0, 'toc_' + record.parent);
          get_parent_chain(parent, ancestry);
        }
      }
      data.ancestry = ['toc_' + uid];
      get_parent_chain(record, data.ancestry);
      var data_content = 'define([], function() { return ' + JSON.stringify(data) + '; });';
      var data_filename = path.join(datapath, 'toc_' + uid + '.js');
      fse.writeFileSync(data_filename, data_content, 'utf8');
    }
  }

};


module.exports = mixtape;

