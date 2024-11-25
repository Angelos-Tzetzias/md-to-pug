declare module 'markdown-to-pug' {
  class MarkdownToPug {
    constructor(options?: any);
    render(markdown: string, options?: any): string;
  }
  export default MarkdownToPug;
}