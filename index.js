const fs = require('fs');
const path = require('path');
const {
  argProcessorFactory,
  genericSingleArgProcessor,
  genericMultiArgProcessor
} = require('./util');

// setup all our handlers for flags
const processDirectory = argProcessorFactory('-d', '--directory', genericSingleArgProcessor)
const processWords = argProcessorFactory('-w', '--words', genericMultiArgProcessor)
const processExtensions = argProcessorFactory('-e', '--extensions', genericMultiArgProcessor)
const processIgnores = argProcessorFactory('-i', '--ignores', genericMultiArgProcessor)
const processRecursive = argProcessorFactory('-r', '--recursive', () => true)
const processCaseSensitive = argProcessorFactory('-c', '--case-sensitive', () => true)
const processRegExp = argProcessorFactory('-x', '--reg-exp', () => true)

// default values
const defaultDirectory = './'; // relative to where you run the script from
const defaultWords = [];
const defaultExtensions = [];
const defaultIgnores = [
  'node_modules',
  '.git',
];
const defaultRecursive = false;
const defaultCaseSensitive = false;
const defaultRegExp = false;
// end default values

// get the command line args
let args = process.argv.slice(2);

// get directory out of args
let directory = processDirectory(args) || defaultDirectory;
let words = processWords(args) || defaultWords;
const extensions = processExtensions(args) || defaultExtensions;
const ignores = processIgnores(args) || defaultIgnores;
const recursive = processRecursive(args) || defaultRecursive;
const caseSensitive = processCaseSensitive(args) || defaultCaseSensitive;
const regExp = processRegExp(args) || defaultRegExp;

// make sure there is a / at the end of the directory
if (directory && directory[directory.length - 1] !== '/') directory += '/';

if(!caseSensitive)
  words = words.map(word => word.toLowerCase());

if(regExp)
  words = words.map(word => RegExp(word, `g${ caseSensitive ? '' : 'i'}`))

console.log(`
  Searching: ${ directory } (${ recursive ? '' : 'Not '}Recursively)
  Only checking files with extensions: ${extensions.length > 0 ? extensions.join(', ') : 'all'}
  Looking for words: ${ words.join(', ') } (Case-${ caseSensitive ? 'S' : 'Ins' }ensitive)
  Ignoring directories: ${ignores.length > 0 ? ignores.join(', ') : 'none'}
`);

const readFiles = (dirname, onFileContent, onError) => new Promise((resolve, reject) => {
  fs.readdir(dirname, (err, filenames) => {
    if (err) {
      onError(err);
      return;
    }
    // distinguish between files and directories
    let [ files, directories ] = filenames.reduce(([ files, dirs ], name) =>
      (fs.statSync(`${dirname}/${name}`).isDirectory())
      ? [ files, [ ...dirs, name ] ]
      : [ [ ...files, name ], dirs ]
    , [[], []]);

    // filter out files that don't have the right extension
    if(extensions.length > 0) 
      files = files.filter(file => extensions.includes(path.extname(file)));
    
    let promises = files.map(name => new Promise((resolve, reject) => {
      fs.readFile(`${dirname}${name}`, 'utf-8', (err, content) => {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(`${dirname}${name}`, content);
        resolve();
      });
    }));

    if (!recursive) {
      Promise.all(promises).then(resolve).catch(reject);
      return;
    }

    // filter out node_modules - perhaps we'll need to filter out other things
    directories = directories.filter(dir => !ignores.reduce((acc, ignore) => acc ? acc : dir.indexOf(ignore) !== -1, false));
    
    // recursive call to handle directories
    const dpromises = directories.map(dir => readFiles(`${dirname}/${dir}`, onFileContent, onError));
    Promise.all([...promises, ...dpromises]).then(resolve).catch(reject);
  });
})

const data = [];
const moreData = [];
readFiles(
  directory,
  (filepath, content) => (data.push(content), moreData.push({ filepath, content })),
  (err) => { throw err }
)
.then(() => {
  // test for a match differently based on flags set
  const testForWords = (content, word) => (
      regExp        ? !!content.match(word)
    : caseSensitive ? content.includes(word)
    : content.toLowerCase(word)
  )

  // the function used by both our filter methods below
  const filterFn =
    word => data.reduce((acc, content) => acc ? acc : testForWords(content, word), false)
  
  const mapFn =
    word => ({ word, foundIn : moreData.reduce((acc, { filepath, content }) => [...acc, ...(testForWords(content, word) ? [filepath] : [])], []) })

  const foundIn = words
  .map(mapFn)
  .sort((a, b) => b.foundIn.length - a.foundIn.length);
  // print output
  console.log(`
Results: ${ foundIn.map(({ word, foundIn }) => `
  '${ word }' ${ foundIn.length > 0 ? 'found in files:' : 'not found'}
    ${ foundIn }`).join('\n  ')}
`)
});
