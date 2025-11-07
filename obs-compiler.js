const fs = require('fs').promises;
const path = require('path');

function camelCase(val) {
    let str = String(val)
    if(str.charAt(1).toUpperCase() == str.charAt(1))
        return str;
    return str.charAt(0).toLowerCase() + String(val).slice(1);
}

function pretty(val) {
    return val.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('String', 'string').replaceAll('Object','object').replaceAll('Number','number').replaceAll('Boolean','boolean');
}

const prot = require('./obs-prot.json');

function computeEnums() {
    const enums = prot.enums;
    console.log('module.exports.enums = {')
    enums.forEach((e) => {
        console.log(`    ${pretty(camelCase(e.enumType))}: {`)
        e.enumIdentifiers.forEach((s) => {
            console.log('        /**');
            console.log(`         * ${pretty(s.description.replaceAll('\n','\n         * '))}`);
            if(s.deprecated) {
                console.log(`         * @deprecated`);
            }
            console.log('         */');
            let value = s.enumValue;
            if(value == '(General | Config | Scenes | Inputs | Transitions | Filters | Outputs | SceneItems | MediaInputs | Vendors | Ui)') {
                value = 2047;
            }
            if(typeof value == 'string' && value.startsWith('(')) {
                value = new Function(`return ${value}`)();
            }
            if(value != s.enumIdentifier) {
                if(typeof value == 'string')
                    console.log(`        ${camelCase(pretty(s.enumIdentifier))}: "${pretty(value)}",`);
                else
                    console.log(`        ${camelCase(pretty(s.enumIdentifier))}: ${value},`);
            }
        });
        console.log('    },')
        console.log(`    ${pretty(camelCase(e.enumType))}Docs: {`)
        e.enumIdentifiers.forEach((s) => {
            let value = s.enumValue;
            if(value == '(General | Config | Scenes | Inputs | Transitions | Filters | Outputs | SceneItems | MediaInputs | Vendors | Ui)') {
                value = 2047;
            }
            if(typeof value == 'string' && value.startsWith('(')) {
                value = new Function(`return ${value}`)();
            }
            console.log(`        "${value}": "${pretty(s.description.replaceAll('\n','\\n').replaceAll('"','\\"'))}",`);
        });
        console.log('    },')
    });
    console.log('}');
}
computeEnums();

function computeEvents() {
    const events = [];
    prot.events.forEach((e) => {
        let idx = events.findIndex((a) => e.category == a.name);
        if(idx == -1) {
            idx = events.length;
            events.push({name:e.category, entries: []});
        }
        events[idx].entries.push({
            name: e.eventType, description: e.description, deprecated: e.deprecated, params: e.dataFields.map(e => {return {
                name: e.valueName, type: e.valueType, description: e.valueDescription
            }})
        });
    }) 
    events.forEach(eventCat => {
        eventCat.entries.forEach((event) => {
            console.log('/**');
            console.log(` * @callback ${pretty(event.name)} ${pretty(event.description.replaceAll('\n', '\n * '))}`)
            event.params.forEach((param) => {
                console.log(` * @param {${pretty(param.type)}} ${pretty(param.name)} ${pretty(param.description)}`)
            })
            console.log('**/');
        });
        console.log('\n/**');
        console.log(` * @typedef ${pretty(eventCat.name.replaceAll(' ', ''))}Event`);
        eventCat.entries.forEach((event) => {
            if(event.deprecated) {
                console.log(` * @deprecated`);
            }
            console.log(` * @prop {${pretty(event.name)}} ${pretty(event.name)} ${pretty(event.description.replaceAll('\n', '\n * '))}`);
        });
        console.log('**/\n');
    });
    console.log('\n/**');
    console.log(` * @typedef { ${events.map((a) => a.name.replaceAll(' ', '')+'Event').join(' & ')} } AllEvents`);
    console.log('**/\n');

    console.log('module.exports.eventParams = {');
    events.forEach(eventCat => {
        eventCat.entries.forEach((event) => {
            console.log(`    ${pretty(event.name)}: [`);
            event.params.forEach((param) => {
                console.log(`        "${pretty(param.name.replaceAll('"','\\"'))}",`);
            })
            console.log(`    ],`);
        });
    });
    console.log('}');
}
computeEvents();

function computeRequests() {
    const requests = [];
    prot.requests.forEach((r) => {
        let idx = requests.findIndex((a) => r.category == a.name);
        if(idx == -1) {
            idx = requests.length;
            requests.push({name:r.category, entries: []});
        }
        const params = [];
        let a,b;
        while((a = r.requestFields.find((v) => v?.valueName?.endsWith('Name'))) && (b = r.requestFields.find((v) =>  v?.valueName == a.valueName.substring(0, a.valueName.length-4) + 'Uuid'))) {
            delete r.requestFields[r.requestFields.indexOf(a)];
            delete r.requestFields[r.requestFields.indexOf(b)];
            b.valueName = b.valueName.substring(0, b.valueName.length-4) + "Identifier";
            b.valueDescription = b.valueDescription.replaceAll('UUID', 'Name/UUID');
            r.requestFields.unshift(b);
        }
        r.requestFields.forEach(f => {
            if(f.valueName.includes('.')) {
                if(params[params.length-1].type.startsWith('Object'))
                    params[params.length-1].type = `{${f.valueName.split('.').pop()}: ${f.valueType + (f.valueOptional?'?':'')}}` + params[params.length-1].type.substring(6);
                else if(params[params.length-1].type.startsWith('{')) {
                    params[params.length-1].type = 
                        params[params.length-1].type.substring(0, params[params.length-1].type.length - 3) + 
                        `, ${f.valueName}: ${f.valueType.split('.').pop() + (f.valueOptional?'?':'')}` + 
                        params[params.length-1].type.substring(params[params.length-1].type.length - 3);
                }
                return;
            }
            params.push({name:f.valueName, description: f.valueDescription, type: f.valueType + (f.valueOptional?'?':'')});
        })
        const response = [];
        r.responseFields.forEach(f => {
            response.push({name:f.valueName, description: f.valueDescription, type: f.valueType});
        })
        requests[idx].entries.push({
            name: r.requestType, description: r.description, deprecated: r.deprecated, params, response
        });
    });
    requests.forEach(reqCat => {
        reqCat.entries.forEach(request => {
            if(request.response.length) {
                console.log('/**');
                console.log(` * @typedef ${pretty(request.name)}Response`);
                request.response.forEach(res => {
                    console.log(` * @prop {${pretty(res.type)}} ${pretty(res.name)} ${pretty(res.description.replaceAll('\n', '\n * '))}`);
                })
                console.log('**/');
            }
            console.log('/**');
            console.log(` * @callback ${pretty(request.name)} ${pretty(request.description.replaceAll('\n', '\n * '))}`);
            request.params.forEach(param => {
                console.log(` * @param {${pretty(param.type)}} ${pretty(param.name)} ${pretty(param.description.replaceAll('\n', '\n * '))}`);
            })
            if(request.response.length) {
                console.log(` * @returns {Promise<${pretty(request.name)}Response>}`);
            } else {
                console.log(` * @returns {Promise<void>}`);
            }
            console.log('**/');
        });
        console.log('\n/**');
        console.log(` * @typedef ${reqCat.name.replaceAll(' ', '')}Request`)
        reqCat.entries.forEach(request => {
            console.log(` * @prop {${pretty(request.name)}} ${camelCase(pretty(request.name))} ${pretty(request.description.replaceAll('\n', '\n * '))}`);
        });
        console.log('**/\n');
    });
    console.log('\n/**');
    console.log(' * @typedef RequestsObject');
    requests.forEach(reqCat => {
        console.log(` * @prop {${pretty(reqCat.name.replaceAll(' ', ''))}Request} ${pretty(camelCase(reqCat.name.replaceAll(' ', '')))}`);
    });
    console.log(` * @prop {${requests.map(a => a.name.replaceAll(' ', '') + 'Request').join('&')}} all`);
    console.log('**/\n');

    console.log('\n/**');
    console.log(' * @returns {RequestsObject}');
    console.log('**/');
    console.log('module.exports.createRequestObj = (callback) => {');
    console.log('    const returnobj = {');
    requests.forEach(reqCat => {
        console.log(`        ${camelCase(reqCat.name.replaceAll(' ', ''))}: {`);
        reqCat.entries.forEach(req => {
            console.log(`            ${camelCase(req.name)}: callback("${req.name.replaceAll('"','\\"')}"),`);
        })
        console.log('        },');
    });
    console.log('    }');
    console.log('    returnobj.all = {');
    requests.forEach(reqCat => {
        console.log(`        ...returnobj.${camelCase(reqCat.name.replaceAll(' ', ''))},`);
    });
    console.log('    }');
    console.log('    return returnobj;');
    console.log('}');

    console.log('module.exports.requestParams = {');
    requests.forEach(reqCat => {
        reqCat.entries.forEach((event) => {
            console.log(`    ${pretty(event.name)}: [`);
            event.params.forEach((param) => {
                console.log(`        "${pretty(param.name.replaceAll('"','\\"'))}",`);
            })
            console.log(`    ],`);
        });
    });
    console.log('}');
}
computeRequests();