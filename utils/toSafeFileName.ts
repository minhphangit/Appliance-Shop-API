import path from 'path';

export const toSafeFileName = (fileName: string) => {
  const fileInfo = path.parse(fileName);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const safeFileName = fileInfo.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + uniqueSuffix + fileInfo.ext;
  return safeFileName;
};
