# find-words

Search files in directories or files (and sub-directories) with a list of words. It will respond with which what files contained these words (also if they weren't found).

Why? Maybe you don't know `grep` or just want something that can specifically do this with some convenient formatting without writing a script.

I use this when I'm using <a href="https://github.com/internetErik/atomic-scss" target="_blank">atomic-scss</a> so I can find unused classes that I can then delete from my config files.

If you have any suggestions open an issue or make a pull request with the change.

## ToDo

* Show line numbers where words show up in each file
  * format: `<filename> [<line>, <line>]`
  * split files on `\n` and search each line one at a time
* Generate more examples (these should also be seen as tests)
* Modify so there is a core that can be used for a `gulp`/`webpack` plugin
* Refactor to use more `async`/`await`

## Use

`git clone` this repository to a convenient location, then run it using `node` (or as a shell script if you trust me and run `chmod +x index.mjs`). Here is the general format of the command:

```
$ node ./find-words <directories/files> <arguments>
```

So, say you have these folders:

```
projects
|
|- find-words
|- some-project
   |- sub-dir
   |- another-sub-dir
   |- yet-another-sub-dir
```

If you want to search all files in the root of `some-project`, then `cd` into `some-project` and run:

```
$ node ../find-words ./ <arguments>
```

If your shell supports globs (e.g., `zsh`), then you can use them. Say you want to search all .txt files in `some-project` along with all sub-directories. `cd` into `some-project` and run:

```
$ node ../find-words ./**/*.txt <arguments>
```

Another tip: Sometimes the output can get long. In that case, you may want to output it to a file.

```
$ node ../find-words <directories/files> <arguments> > results
$ cat results
```

### Arguments

It can be a hastle to use the arguments, so you may just want to modify the default values in `find-words/index.mjs`. Look for the comments:

```JavaScript
// default values
//...
// end default values
```

```
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

If you want words to be interpreted as Regular Expressions
-x
--reg-exp
  * Note: do not include your own opening and closing slashed ('/') *
  * Note: you may need to single quote your regex so your terminal doesn't execute it *
  * Note: the global flag will always be included *

```

### Examples

The examples below are generated.

Do this by running `./gen-examples` (requires `zsh` is in `$PATH`)

****** Generated Below Here *******
These are all run from the root of the `find-words` project directory
```
$ node ./index.mjs ./test-dir/ -w sdfs hello world blah -e .txt .dat -i node_modules .git -r -c

  Searching: ./test-dir (Recursively)
  Only checking files with extensions: .txt, .dat
  Looking for words: sdfs, hello, world, blah (Case-Sensitive)
  Ignoring directories: node_modules, .git


Results: 
  'hello' found in files:
    ./test-dir/hello.txt
  
  'world' found in files:
    ./test-dir/hello.txt
  
  'sdfs' not found
    
  
  'blah' not found
    

```
```
$ node ./index.mjs ./test/**/*.dat -w 1 3

  Searching: ./test-dir/data.dat (Not Recursively)
  Only checking files with extensions: all
  Looking for words: 1, 3 (Case-Insensitive)
  Ignoring directories: node_modules, .git


Results: 
  '1' found in files:
    ./test-dir/data.dat
  
  '3' found in files:
    ./test-dir/data.dat

```
```
$ node ./index.mjs ./test-dir/** -w '[0-9]' -x

  Searching: ./test-dir/data.dat,./test-dir/empty-folder,./test-dir/hello.txt,./test-dir/hello2.txt,./test-dir/html,./test-dir/node_modules,./test-dir/test2 (Not Recursively)
  Only checking files with extensions: all
  Looking for patterns: /[0-9]/gi (Case-Insensitive)
  Ignoring directories: node_modules, .git


Results: 
  /[0-9]/gi found in files:
    ./test-dir/data.dat
    ./test-dir/test2/test.txt
    ./test-dir/html/other.html
    ./test-dir/html/index.html

```
Find only w20 and not w200, etc
```
$ node ./index.mjs ./test-dir/**/*.html -w 'w20( |")' -x

  Searching: ./test-dir/html/index.html,./test-dir/html/other.html (Not Recursively)
  Only checking files with extensions: all
  Looking for patterns: /w20( |\")/gi (Case-Insensitive)
  Ignoring directories: node_modules, .git


Results: 
  /w20( |\")/gi found in files:
    ./test-dir/html/index.html

```
