## find-words

Run this to search files in a directory (and sub-directories) with a list of words. It will respond with a which of those words were found in use and which were not in use. You can use this information for whatever you want.

I think of this as something to use with my <a href="https://github.com/internetErik/atomic-scss" target="_blank">atomic-scss</a> so I can find unused classes, however I wrote a different version of this to help someone answer the question, "is this static asset being used anywhere?"

## Use

Clone this repository to a convenient location. This is recommended since you may want to manually edit the default values. Setup any default values you may need 

Finally, run it using `node`:

```
node ./find-words <arguments>
```

After cloning you may want to rename the folder to something convenient like `fw`, then you can run it like so:

```
node ./fw <arguments>
```

So, say you have these folders:

```
projects
|
|- find-words
|- some-project
```

If you want to search `some-project`, then `cd` into `some-project` and run:

```
node ../find-words <arguments>
```

### Arguments

It can be a hastle to use the arguments, so you may just want to modify the default values in `find-words/index.js`. Look for the comments:

```JavaScript
// default values
//...
// end default values
```

```
-d directory-name
--directory directory-name

  If no directory is specified it defaults to './'

-w <list of words>
-words <list of words>

-e <list of extensions>
--extensions <list of extensions>

-i <list of ignored folders>
--ignores <list of ignored folders>

If you want to check all directories recursively:
-r
--recursive

If you want the check to be case sensitive:
-c
--case-sensitive

```


### Examples

```
node ./find-words -d ./files/ -w TEST WORDS -e .js .html -i node_modules .git -r -c

  Searching: ./files/ (Recursively)
  Only checking files with extensions: .js, .html
  Looking for words: test,words (Case-Sensitive)
  Ignoring directories: node_modules, .git

```

## ToDo

* Support for regex instead of words
  * Output will just be what was found, since we cannot list all that is not found
* Support glob paths
  * Write yourself? Use <a href="https://github.com/isaacs/node-glob" target="_blank">node-glob</a>?
