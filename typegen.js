const fs = require('fs');
const { typesBundlePre900 } = require('moonbeam-types-bundle');
fs.writeFileSync('chaintypes.json', JSON.stringify({typesBundle: typesBundlePre900}, undefined, 2));
