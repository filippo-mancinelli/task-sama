import fs from 'fs';
import path from 'path';

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrayOfFiles;
};

const filterVueAndJsFiles = (files) =>
  files.filter((file) => {
    const ext = path.extname(file);
    return ext === '.vue' || ext === '.js';
  });

const readAndConcatenate = (files) => {
  let result = '';

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    result += `\n\n/* File: ${file} */\n\n${content}`;
  });

  return result;
};

const writeToFile = (filename, content) => {
  fs.writeFileSync(filename, content, 'utf-8');
};

const main = () => {
  const allFiles = getAllFiles('../src');
  const vueAndJsFiles = filterVueAndJsFiles(allFiles);
  const concatenatedContent = readAndConcatenate(vueAndJsFiles);
  writeToFile('conca.txt', concatenatedContent);
};

main();
