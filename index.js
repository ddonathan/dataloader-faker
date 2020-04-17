const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -t templateFile.csv -o outputFile.csv -c 1000', 'generates 1000 lines of fake data into the outputFile based on the templateFile')
    .example('$0 --template templateFile.csv --output outputFile.csv --rows 50', 'generates 50 lines of fake data into the outputFile based on the templateFile')
    .alias('t', 'template')
    .alias('o', 'output')
    .alias('r', 'rows')
    .nargs('t', 1)
    .nargs('o', 1)
    .nargs('r', 1)
    .describe('t', 'the template file which describes what data is to be faked')
    .describe('o', 'the output file which points to the file to create as the output of this script')
    .describe('r', 'the number of records to fake')
    .demandOption(['t', 'o', 'r'])
    .help('h')
    .alias('h', 'help')
    .argv;
const csv = require('fast-csv');
const faker = require('faker');

let template = null;
csv.parseFile(argv.t, { headers: true, strictColumnHandling: true, trim: true })
    .on('data', (row) => {
        if (!template) {
            template = row;
        }
    })
    .on('end', () => {
        generate(template);
    })
    .on('error', (err) => {
        console.error(err);
    });

function generate(template) {
    let output = [];
    for (let i = 0; i < argv.r; i++) {
        const row = {};
        // Replace row number, options and faker
        Object.keys(template).forEach(key => {
            row[key] = template[key]
                .replace(/\{\{i\}\}/ig, i + 1)
                .replace(/\{\{.+\}\}/ig, (match) => faker.fake(match))
                .replace(/^\[\[(.+)\]\]$/ig, (match, $1) => {
                    const options = $1.split('|');
                    return options[i % options.length];
                });
        });
        // Replace column names with values of other columns
        Object.keys(row).forEach(key => {
            row[key] = row[key].replace(/\$\{(.+)\}/ig, (match, $1) => row[$1] ? row[$1] : '');
        });
        output.push(row);
    }
    csv.writeToPath(argv.o, output, { headers: true });
    console.log('Wrote', argv.r, 'lines to:', argv.o);
}
