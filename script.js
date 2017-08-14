const siteFields = ['number', 'facility_name', 'country', 'address'];
const personFields = ['external_identifier', 'email', 'first_name', 'last_name', 'role'];


const convertFile = (inputFile) => {
  // remove all previously output html
  if (!window.FileReader) {
    return alert('FileReader not supported');
  }
  document.getElementById("output").innerHTML = "";

  const file = inputFile[0];
  if (file.name.split(".")[1].toUpperCase() != "CSV"){
    return alert('Invalid csv file');
  }
	var reader = new FileReader();
	reader.onload = loadHandler;
	reader.onerror = errorHandler;    
	reader.readAsText(file);
}

const loadHandler = (event) => {
	var csv = event.target.result;
	parseFile(csv);             
}

const errorHandler = (evt) => {
	if(evt.target.error.name == "NotReadableError") {
		alert("Error reading file");
	}
}

const parseFile = (csv) => {
  // split the csv by line
  var splitFileByLine = csv.split(/\r\n|\n/);
  var data = [];
  // split the csv by commas within a line
  while (splitFileByLine.length > 1) {
    data.push(splitFileByLine.shift().split(','));
  }

	let sites = data.map((elem) =>  elem.slice(0, 7));
  let people = data.map((elem) => elem.slice(7, elem.length));

  const siteHeaders = _.map(sites[0], (header) => _.snakeCase(header.replace('Site', '')));
  const peopleHeaders = _.map(people[0], (header) => _.snakeCase(header.replace('Person', '')));

  // remove first header column from data
  people = people.slice(1, people.length);
  sites = sites.slice(1, sites.length);

  // get all indexes to combine address fields into one address
  const addressIdx = siteHeaders.indexOf('address');
  const cityIdx = siteHeaders.indexOf('city');
  const stateCountyIdx = siteHeaders.indexOf('state_county');
  const zipIdx = siteHeaders.indexOf('zip');

  // replace address with full address
  sites.forEach((site) => {
    site[addressIdx] = `${_.trim(site[addressIdx])}, ${_.trim(site[cityIdx])}, ${_.trim(site[stateCountyIdx])}, ${_.trim(site[zipIdx])}`;
  });

  //change surname field to last_name
  const surnameIdx = peopleHeaders.indexOf('surname');
  peopleHeaders[surnameIdx] = 'last_name';
  
  // construct the api calls
  convertToAPICalls(sites, siteHeaders, '/sites', siteFields);
  convertToAPICalls(people, peopleHeaders, '/people', personFields);
}

const convertToAPICalls = (data, dataHeaders, endpoint, fields) => {
  // use this counter var to increment the external_identifier
  let count = 1;

  const APICalls = data.map((elem, i) => {
    var headerDiv = document.createElement("div");
    const headerNode = document.createTextNode(`POST ${endpoint}`);
    addNode(headerDiv, headerNode);
    // since external_identifier is not in the csv, check separately and autoincrement
    if(fields.indexOf('external_identifier') !== -1) {
      const listNode = document.createElement("li"); 
      const textNode = document.createTextNode(`external_identifier: ${count++}`);
      addNode(listNode, textNode);
    }
    // only include required fields
    for(let i = 0; i < elem.length; i++) {
      if(fields.indexOf(dataHeaders[i]) !== -1) {
        const listNode = document.createElement("li"); 
        const textNode = document.createTextNode(`${dataHeaders[i]}: ${elem[i]}`);
        addNode(listNode, textNode);
      }
    }
  });
}

const addNode = (parentNode, childNode) => {
  parentNode.appendChild(childNode);
  document.getElementById("output").appendChild(parentNode);
}
