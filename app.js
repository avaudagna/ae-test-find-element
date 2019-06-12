const bunyan = require('bunyan');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const defaultElementId = "make-everything-ok-button";
const logger = bunyan.createLogger({ name: "elementFinder" });

class Parser {
	findById(file, elementId ) {
		const dom = new JSDOM(file);
		const element = dom.window.document.getElementById(elementId);
		try {
      return Element.createElement(element);
    } catch {
      throw Error(`Element with id ${elementId} not found`);
    }
	}
	findByQuery(file, cssQuery) {
    const dom = new JSDOM(file);
    return Element.createElement(dom.window.document.querySelector(cssQuery));
	}
}


class Element {
	constructor(domElement) {
		this.domElement = domElement;
	}
	static createElement(possibleElement) {
		if(possibleElement === null || possibleElement === undefined ) {
      throw new Error('Element not found');
    }  
    return new Element(possibleElement);
	}
	getCssQuery() {
    const elementName = this.domElement.nodeName.toLowerCase();
    const attrsArray = Array.prototype.slice.apply(this.domElement.attributes);
    return attrsArray.map(function(attr) { 
      return `${elementName}[${attr.name}="${attr.value}"]`
    }).join(', ');
  }
}

const main = () => {
  const parseArguments = () => {
    if(process.argv.length < 4) {
      throw Error("Invalid number of arguments, needs at least 4: <platform> <program_path> <input_origin_file_path> <input_other_sample_file_path> [<target_id>]")
    }
    return {
      'originFilePath': process.argv[2],
      'targetFilePath': process.argv[3],
      'originalElementId': process.argv.length === 5 ? process.argv[3] : defaultElementId
    }
  }
  const arguments = parseArguments();
  const originalFile = fs.readFileSync(arguments.originFilePath);
  const targetFile = fs.readFileSync(arguments.targetFilePath);
  const parser = new Parser();
  const originalElement = parser.findById(originalFile, arguments.originalElementId);
  try {
    const possibleMatchElement = parser.findByQuery(targetFile, originalElement.getCssQuery());
    logger.info('Found matching element');
    return possibleMatchElement.domElement;
  } catch {
    logger.info('No matching element found');
    return null;
  }
}

try {
  const matchingElement = main();
} catch (err) {
  logger.error(err);
}
