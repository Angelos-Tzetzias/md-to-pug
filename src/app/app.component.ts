import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  FormControl,
  FormGroup,
  UntypedFormControl,
  Validators,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// import { md } from './myMdText'

import MarkdownToPug from 'markdown-to-pug';
// const md2pug = new (require('markdown-to-pug'))()
@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = 'md-to-dug';

  fileContent: string | null = null;
  md2pug = new MarkdownToPug();

  isOpen = false;
  isFileSelected = false;

  pug = ' ';
  markdown = 'new markdown';

  preferenciesForm = new FormGroup({
    title: new FormControl(true),
    squareVariables: new FormControl(true),
    curlyVariables: new FormControl(true),
    // include #{} or @referencies ....
    imports: new FormControl(true),
    footer: new FormControl(true),
    noStrong: new FormControl(true),
  });

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  async selectFile(event: any) {
    this.isFileSelected = true;
    this.markdown = await this.convertFileToString(event.target.files[0]);
  }

  async convertFileToString(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // FileReader's `result` contains the file content as a string
        this.fileContent = e.target?.result as string;
        resolve(this.fileContent);
      };

      reader.onerror = (e) => {
        reject('error reading file');
      };

      reader.readAsText(file);
    });
  }

  convertStringToPuG() {
    let myPug = this.md2pug.render(this.markdown);
    // myPug = this.md2pug.render(md);
    myPug = this.modifyPug(myPug);
    this.pug = myPug;
    this.downloadFile(myPug);
  }

  removeStrongTags(pug: string) {
    return pug.replace(/\n\s*strong/g, ''); // probably makes sense to replace with **<nextword>**
  }

  modifyPug(myPug: string) {
    if (this.preferenciesForm.value.noStrong) {
      myPug = this.removeStrongTags(myPug);
    }

    if (this.preferenciesForm.value.title) {
      myPug = this.insertOurTitle(myPug);
    }

    myPug = this.insertSetUpVariables(myPug);

    if (this.preferenciesForm.value.imports) {
      myPug = this.insertOurImports(myPug);
    }
    if (this.preferenciesForm.value.footer) {
      myPug = this.insertFooter(myPug);
    }

    return myPug;
  }

  insertOurTitle(pug: string) {
    pug = this.indendForTitle(pug);
    return this.titleText + pug;
  }

  indendForTitle(pug: string) {
    let lines = pug.split('\n');
    let indentedLines = lines.map((line) => {
      return '    ' + line;
    });
    return indentedLines.join('\n');
  }

  insertSetUpVariables(pug: string) {
    const extractedObj = this.extractVariables(pug);
    return extractedObj.variables + extractedObj.mypug;
  }

  insertOurImports(pug: string) {
    return this.importsText + pug;
  }

  insertFooter(pug: string) {
    return (
      pug +
      `
      +footer('2024-10-01')`
    );
  }

  extractVariables(pug: string) {
    // implement variable extraction and replacemnet with {{ variableName }}

    const regexSquare = /\[[^\[\]]{1,40}\]/g; // /\[([^\]]{1,30})\]/g; // Matches content within square brackets of 1-40 characters
    const regexCurly = /\{\{[^\{\}]{1,30}\}\}/g;
    let variableCount = 1;
    const variableMap: { [key: string]: string } = {};
    let modifiedString1 = pug;
    if (this.preferenciesForm.value.curlyVariables) {
      modifiedString1 = pug.replace(regexCurly, (match) => {
        const myMatch = match.replace(/{/g, '(').replace(/}/g, ')');
        const existingKey = this.findKeyByValue(variableMap, myMatch);
        const variableName = existingKey ? existingKey : `variable${variableCount}`;
        if ( !existingKey ) {
          variableMap[variableName] = myMatch; // Store the mapping
          variableCount++;
        }
        
        return `{{ ${variableName} }}`; // Replace with {{ variableN }}
      });
    }
    let modifiedString2 = modifiedString1;
    if (this.preferenciesForm.value.squareVariables) {
      modifiedString2 = modifiedString1.replace(regexSquare, (match) => {
        const existingKey = this.findKeyByValue(variableMap, match);
        const variableName = existingKey ? existingKey : `variable${variableCount}`;
        if ( !existingKey ) {
          variableMap[variableName] = match; // Store the mapping
          variableCount++;
        } 

        return `{{ ${variableName} }}`; // Replace with {{ variableN }}
      });
    }

    let variableDefinitions = '';
    for (const [variableName, stringValue] of Object.entries(variableMap)) {
      variableDefinitions += `- var ${variableName} = \`${stringValue}\`\n`;
    }

    return { variables: variableDefinitions.trim(), mypug: modifiedString2 };
  }

  findKeyByValue(obj: Record<string, string>, value: string): string | false {
    for (const [key, val] of Object.entries(obj)) {
      if (val === value) {
        return key;
      }
    }
    return false; // Return false if the value is not found
  }

  downloadFile(myPug: string) {
    const blob = new Blob([myPug], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'Converted.pug';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  titleText = `
doctype strict
html
  head
    link(href='classpath:styles/main.css', rel='stylesheet', type='text/css', media='print')
  body
    .front-page
      include HEADER-BANNER
      .company-name=company.fullName
      .document-type
        | 'title PLace holder'
       `;

  importsText = `
include includes/ROUND_VARIABLES3
include utils/UTILS
`;
}
