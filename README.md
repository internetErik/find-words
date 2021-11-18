## find-words

Run this to search a directory recursively with a list of words. It will respond with a list of words that were found

## Use

```
node ./find-words <arguments>
```

Arguments

```
-d directory-name
--directory directory-name

If no directory is specified it defaults to './'

-w list of words
-words list of words

-e list of extensions
--extensions list of extensions

-i list of ignored folders
-- ignores list of ignored folders
```

If you don't want to provide arguments you can just hardcode values into `index.js`

Examples

```
node ./find-words -d ./files/ -w sfesdf ieifk -e .js .html -i node_modules .git

this will look in the files directory, only at .js and .html pages, ignoring node_modules and .git
it will return a list that filters out if 'sfesdf' or 'ieifk' are present.

```