const fs = require('fs');
const path = require('path');
const {
  multiArgNoFlag,
  argProcessorFactory,
  genericSingleArgProcessor,
  genericMultiArgProcessor
} = require('./util');

// setup all our handlers for flags
const processWords = argProcessorFactory('-w', '--words', genericMultiArgProcessor)
const processExtensions = argProcessorFactory('-e', '--extensions', genericMultiArgProcessor)
const processIgnores = argProcessorFactory('-i', '--ignores', genericMultiArgProcessor)
const processRecursive = argProcessorFactory('-r', '--recursive', () => true)
const processCaseSensitive = argProcessorFactory('-c', '--case-sensitive', () => true)
const processRegExp = argProcessorFactory('-x', '--reg-exp', () => true)

// default values
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

let filepaths = multiArgNoFlag(args);

if(filepaths.length === 0) {
  console.log('you must provide a directory');
  return;
}

// remove final slash from all directory filepaths
filepaths = filepaths.map(
  filepath => (filepath[filepath.length - 1] === '/') ? filepath.substr(0, filepath.length - 1) : filepath
)
// process all our arguments
let words = processWords(args) || defaultWords;
const extensions = processExtensions(args) || defaultExtensions;
const ignores = processIgnores(args) || defaultIgnores;
const recursive = processRecursive(args) || defaultRecursive;
const caseSensitive = processCaseSensitive(args) || defaultCaseSensitive;
const regExp = processRegExp(args) || defaultRegExp;

if(!caseSensitive)
  words = words.map(word => word.toLowerCase());

if(regExp)
  words = words.map(word => RegExp(word, `g${ caseSensitive ? '' : 'i'}`))

console.log(`
  Searching: ${ filepaths } (${ recursive ? '' : 'Not '}Recursively)
  Only checking files with extensions: ${extensions.length > 0 ? extensions.join(', ') : 'all'}
  Looking for ${regExp ? 'patterns' : 'words' }: ${ words.join(', ') } (Case-${ caseSensitive ? 'S' : 'Ins' }ensitive)
  Ignoring directories: ${ignores.length > 0 ? ignores.join(', ') : 'none'}
`);

const readFiles = (filepaths, onFileContent, onError) => new Promise((resolve, reject) => {
  const promises = filepaths.map(async filepath => new Promise((resolve, reject) => {
    // if this is a directory, then we have a lot more work to do
    if(fs.statSync(filepath).isDirectory()) {
      fs.readdir(filepath, (err, filenames) => {
        if (err) {
          onError(err);
          reject(err);
          return;
        }
        // distinguish between files and directories
        let [ files, directories ] = filenames.reduce(([ files, dirs ], name) =>
          (fs.statSync(`${filepath}/${name}`).isDirectory())
          ? [ files, [ ...dirs, name ] ]
          : [ [ ...files, name ], dirs ]
        , [[], []]);

        // filter out files that don't have the right extension
        if(extensions.length > 0) 
          files = files.filter(file => extensions.includes(path.extname(file)));
        
        let promises = files.map(name => new Promise((resolve, reject) => {
          fs.readFile(`${filepath}/${name}`, 'utf-8', (err, content) => {
            if (err) {
              onError(err);
              return;
            }
            onFileContent(`${filepath}/${name}`, content);
            resolve();
          });
        }));

        if (!recursive) {
          Promise.all(promises).then(resolve).catch(reject);
          return;
        }

        // filter out node_modules - perhaps we'll need to filter out other things
        directories = directories
          .filter(dir => !ignores.reduce((acc, ignore) => acc ? acc : dir.indexOf(ignore) !== -1, false))
          .map(dir => `${filepath}/${dir}`);
        
        // recursive call to handle directories
        const dpromise = readFiles(directories, onFileContent, onError);
        Promise.all([...promises, dpromise]).then(resolve).catch(reject);
      });
    }
    else {
    // this is a single file - probably from a glob
      fs.readFile(filepath, 'utf-8', (err, content) => {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filepath, content);
        resolve();
      });
    }
  }))
  Promise.all(promises)
  .then(resolve)
  .catch(reject);
})

const data = [];
readFiles(
  filepaths,
  (filepath, content) => data.push({ filepath, content }),
  err => console.trace(err) 
)
.then(() => {
  // test for a match differently based on flags set
  const testForWords = (content, word) => (
      regExp        ? !!content.match(word)
    : caseSensitive ? content.includes(word)
    : content.toLowerCase().includes(word)
  )

  // for mapping over all words
  // searches in each file. If found in the file, adds it to the array
  // string => { string, [ string ]}
  const mapFn =
    word => ({
      word,
      foundIn : data.reduce((acc, { filepath, content }) => [...acc, ...(testForWords(content, word) ? [filepath] : [])], []),
    })

  const results = words
  .map(mapFn)
  .sort((a, b) => b.foundIn.length - a.foundIn.length);
  // print output
  console.log(`
Results: ${ results.map(({ word, foundIn }) => `
  ${ regExp ? word : `'${word}'` } ${ foundIn.length > 0 ? 'found in files:' : 'not found'}
    ${ [...new Set(foundIn)].join('\n    ') }`).join('\n  ')}
`)
});
