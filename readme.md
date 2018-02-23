# Mixtape -- a front-end for content and docs

You feed Mixtape some typed data objects, typically each with some kind of content or documentation that you want to communicate. It generates for you a site that people can use to browse, search, and find those items, and to discover the content they're looking for.

>	**NOTE** Mixtape and its associated `typesmith` projects are still in early stage development. When it's up and running and generating useful output, they'll go on `npm` for easy consumption. Watch or star this repo for later!

![Preview](readme/preview.gif)

## What's it good for?

It's useful any time you need to give people a way to browse and consume documentation for various items of different types, and particularly useful when hierarchical relationships exist between those items.

For example, it's well suited for producing documentation for things like APIs. You might have some content to explain each of its namespaces, classes, functions, data members, type definitions and whatnot -- or, for a REST API, its endpoints, parameters, required headers and return data. So, you all that content to Mixtape, with some meta-information about how the different types of records should be handled -- along the lines of, "I want namespaces and classes to get their own pages, but functions and members and other items to get documented on their parent pages." You can configure exactly how the content for each of the items is written to the page.

But you can use it to generate a snazzy front-end site for any kind of content, even just a folder full of Markdown files.

## What does it offer?

-	Works both online and locally from the filesystem

-	Typeahead and full-text search

-	Hierarchical table of contents

-	Markdown or HTML content

-	Flexible presentation layer that you can freely customize for different data types and page layouts

-	Responsive layout for different screen sizes

-	A unique anchor for each data record, so you can link to them from outside

-	An extensible pipeline (`typesmith`) for importing and processing your data records

## How to use it

In `node.js`:

```
var mixdown = require('mixdown');

var options = {
	output:'./some/folder/somewhere',
	types = {
		'class':{
			'page':true
			...
		},
		'function':{
			..
		},
		... // whatever other data types and config you need
	}
	... // maybe other config parameters
}
var database = {
	'uid_foo': {
		'name':'foo',
		'type':'class',
		'content':'This class is for doing awesome stuff! Here's more...',
		'children':['uid_bar']
	},
	'uid_bar': {
		'name':'bar',
		'type':'function',
		'signature':'foo.bar(parameter) : returnValue',
		'content':'This function does the awesome! ...',
		'parent':'uid_foo'
	},
	... // lots more records go here!
}

mixdown.run(options, database, callback);
```

## Or, use it with Typesmith

I know you and I are on the same wavelength, but chances are you probably don't have a database sitting around in exactly the format that Mixtape is expecting. So, you can use `typesmith` to help you take what you've got and set it up in the way that `mixtape` is expecting it.

Read records from JSON or Markdown, add new records programmatically, make parent-child relations automatically, then invoke `mixtape` all in one processing chain. And it's easily extensible for you to drop your own data processing functions for your own custom data into the pipeline at whatever point you need.

See [the main typesmith repo](http://www.github.com/bbor/typesmith) and the [sample typesmith project](http://www.github.com/bbor/typesmith-testing) for more details.
