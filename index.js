const { dir } = require('console');
var fs = require('fs');

let args = process.argv.slice(2);

let directory = './';
let words = [
  'ELO_ELOCTATEInstructions_for_use.pdf',
  'ELO-US-0496-Spanish-IFU.pdf',
  'elo-us-1208-doctor-discussion-guide-for-website.pdf',
  'ELO-US-1213-ELOCTATE-Free-Trial-Plus-Form-Electronic(HCP-Version)-BIVV.pdf',
  'ELO-US-1474-ELOCTATE-Consent-Authorization-Form-Print-BIVV.pdf',
  'ELO-US-1503-MyELOCTATE-General-Enrollment-Form-Web-BIVV.pdf',
  'ELOConversationStarterGuide-Digital.pdf',
  'Eloctate Reconstitution Video.pdf',
  'ELOCTATE_PI_January2017.pdf',
  'ELOCTATE_PI.pdf',
  'eloctate-count-on-prospect-brochure-spanish.pdf',
  'ELOCTATE-digital-quick-guide-spanish.pdf',
  'Eloctate-Financial-Services-Brochure-Digital-Spanish.pdf',
  'eloctateinstructions-for-use_09.19.pdf',
  'ELODigitalCountOnQuickGuide.pdf',
  'HCP.pdf',
  'HEM-US-6194-SanofiGenzyme-Enrollment-Form.pdf',
  'sano-9007_patient-enrollment-form__v4_live6_10_19.pdf',
];
let extensions = [
  '.aspx'
];
let ignores = [
  'node_modules',
  '.git',
];

const data = [];

console.log(args);
// get directory out of args
if(args.includes('-d')) {
  let index = args.indexOf('-d');
  directory = args[index+1];
  args.splice(index, 2);
}
if(args.includes('--directory')) {
  let index = args.indexOf('--directory');
  directory = args[index+1];
  args.splice(index, 2);
}

if(args.includes('-w')) {
  let index = args.indexOf('-w');
  let endIndex = args.slice(index+1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  console.log(endIndex);
  words = args.slice(index+1, endIndex === -1 ? args.length : endIndex+1);
  args.splice(index, words.length+1);
}
if(args.includes('--words')) {
  let index = args.indexOf('--words');
  let endIndex = args.slice(index+1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  words = args.slice(index+1, endIndex === -1 ? args.length : endIndex+1);
  args.splice(index, words.length+1);
}

if(args.includes('-e')) {
  let index = args.indexOf('-e');
  let endIndex = args.slice(index+1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  extensions = args.slice(index+1, endIndex === -1 ? args.length : endIndex+1);
  args.splice(index, extensions.length+1);
}
if(args.includes('--extensions')) {
  let index = args.indexOf('--extensions');
  let endIndex = args.slice(index+1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  extensions = args.slice(index+1, endIndex === -1 ? args.length : endIndex+1);
  args.splice(index, extensions.length+1);
}

if(args.includes('-i')) {
  let index = args.indexOf('-i');
  let endIndex = args.slice(index+1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  ignores = args.slice(index+1, endIndex === -1 ? args.length : endIndex+1);
  args.splice(index, ignores.length+1);
}
if(args.includes('--ignores')) {
  let index = args.indexOf('--ignores');
  let endIndex = args.slice(index+1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  ignores = args.slice(index+1, endIndex === -1 ? args.length : endIndex+1);
  args.splice(index, ignores.length+1);
}

console.log('post args', args);
console.log('directory', directory);
console.log('words', words)
console.log('extensions', extensions)
console.log('ignores', ignores)

// make sure there is a / at the end of the directory
if(directory && directory[directory.length - 1] !== '/') directory += '/';

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

    if(extensions.length > 0) 
    files = files.filter(file => extensions.reduce((acc, ext) => acc ? acc : file.indexOf(ext) !== -1, false))

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
    // filter out node_modules - perhaps we'll need to filter out other things
    directories = directories.filter(dir => !ignores.reduce((acc, ignore) => acc ? acc : dir.indexOf(ignore) !== -1, false));
    
    // recursive call to handle directories
    const dpromises = directories.map(dir => readFiles(`${dirname}/${dir}`, onFileContent, onError));
    Promise.all([...promises, ...dpromises]).then(resolve).catch(reject);
  });
})

readFiles(directory, (filename, content) => data.push(content), (err) => { throw err })
.then(() => {
  const result = words.map(TEXT => TEXT.toLowerCase())
    .filter(
      text => data.reduce((acc, content) => acc ? acc : content.toLowerCase().includes(text), false)
    )
  console.log('found instances of:', result);
});
