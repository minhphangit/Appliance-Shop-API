import { JSDOM } from 'jsdom';
export const stripTags = (original: any) => {
  let { document } = new JSDOM(original).window;
  //return all text content from the document
  return document.body.textContent || '';
};

export const stripContent = (content: any, length: number) => {
  if (!content) return null;
  if (content.length <= length) return content;
  return content.substring(0, content.lastIndexOf(' ', length)) + '...';
};
