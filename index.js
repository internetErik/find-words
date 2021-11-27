const fs = require('fs');
const path = require('path');

let args = process.argv.slice(2);

const argProcessorFactory = (short, long, processor) => args => (
  (args.includes(short)) ? processor(args, short)
: (args.includes(long))  ? processor(args, long)
: null
)

const genericSingleArgProcessor = (args, flag) => {
  const index = args.indexOf(flag);
  const result = args[index + 1];
  args.splice(index, 2);
  return result;
}

const genericMultiArgProcessor = (args, flag) => {
  const index = args.indexOf(flag);
  const endIndex = args.slice(index + 1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  const result = args.slice(index + 1, endIndex === -1 ? args.length : endIndex + 1);
  args.splice(index, result.length + 1);
  return result;
}

const processDirectory = argProcessorFactory('-d', '--directory', genericSingleArgProcessor)
const processWords = argProcessorFactory('-w', '--words', genericMultiArgProcessor)
const processExtensions = argProcessorFactory('-e', '--extensions', genericMultiArgProcessor)
const processIgnores = argProcessorFactory('-i', '--ignores', genericMultiArgProcessor)
const processRecursive = argProcessorFactory('-r', '--recursive', (args, flag) => true)
const processCaseSensitive = argProcessorFactory('-c', '--case-sensitive', (args, flag) => true)
const defaultDirectory = './';
const defaultWords = [];
const defaultExtensions = [];
const defaultIgnores = [
  'node_modules',
  '.git',
];
const defaultRecursive = false;
const defaultCaseSensitive = false;

const data = [];

// get directory out of args
let directory = processDirectory(args) || defaultDirectory;
let words = processWords(args) || defaultWords;
const extensions = processExtensions(args) || defaultExtensions;
const ignores = processIgnores(args) || defaultIgnores;
const recursive = processRecursive(args) || defaultRecursive;
const caseSensitive = processCaseSensitive(args) || defaultCaseSensitive;

// make sure there is a / at the end of the directory
if (directory && directory[directory.length - 1] !== '/') directory += '/';

if(caseSensitive)
  words = words.map(word => word.toLowerCase());

console.log('searching:', directory, `(${ recursive ? '' : 'not'} recursively)`);
console.log('only checking files with extensions:', extensions.length > 0 ? extensions : 'all');
console.log('looking for words:', words, `(Case-${ caseSensitive ? 'S' : 'Ins' }ensitive)`)
console.log('ignoring directories:', ignores.length > 0 ? ignores : 'none');

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
      fs.readFile(`${dirname}/${name}`, 'utf-8', (err, content) => {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(name, content);
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

readFiles(directory, (filename, content) => data.push(content), (err) => { throw err })
.then(() => {
  const filterFn = caseSensitive
    ? text => data.reduce((acc, content) => acc ? acc : content.toLowerCase().includes(text), false)
    : text => data.reduce((acc, content) => acc ? acc : content.includes(text), false)
  const foundWords = words.filter(filterFn)
  const notFoundWords = words.filter(word => !foundWords.includes(word.toLowerCase()))
  console.log(`found instances of:`, foundWords);
  console.log(`didn't find instances of:`, notFoundWords);
});
