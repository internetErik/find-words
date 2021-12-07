
const argProcessorFactory = (short, long, processor) => args => (
  (args.includes(short)) ? processor(args, short)
    : (args.includes(long)) ? processor(args, long)
      : null
)

const genericSingleArgProcessor = (args, flag) => {
  const index = args.indexOf(flag);
  const result = args[index + 1];
  args.splice(index, 2);
  return result;
}

const multiArgNoFlag = args => {
  const endIndex = args.reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  const result = args.slice(0, endIndex === -1 ? args.length : endIndex);
  args.splice(0, result.length);
  return result;
}

const genericMultiArgProcessor = (args, flag) => {
  const index = args.indexOf(flag);
  const endIndex = args.slice(index + 1).reduce((acc, arg, i) => acc !== -1 ? acc : (arg.indexOf('-') === 0 ? i : -1), -1)
  const result = args.slice(index + 1, endIndex === -1 ? args.length : endIndex + 1);
  args.splice(index, result.length + 1);
  return result;
}

module.exports = {
  multiArgNoFlag,
  argProcessorFactory,
  genericSingleArgProcessor,
  genericMultiArgProcessor,
}
