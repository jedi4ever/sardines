var fs = require('fs'),
path = require('path'),
combine = require('./combine'),
mu = require('./utils/mu'),
uglify = require('uglify-js'),
parser = uglify.parser;


exports.package = function(ops, callback)
{
	var inputs = ops.input instanceof Array ? ops.input : [ops.input],
		output = ops.output,
		include = ops.include || [];
	
	var body = fs.readFileSync(__dirname + '/wrappers/pre.js','utf8') + '\n\n' +
	fs.readFileSync(__dirname + '/wrappers/require.js','utf8') + '\n\n';
	
	var ops = {
		
		//entry points
		entries: inputs,
		
		//files to include that aren't necessarily required
		include: include
	};
	
	
	var combiner = combine(ops);
	
	//on module - chunk for combining
	combiner.on('data', function(chunk) {
		body += chunk + '\n\n';
	});
	
	
	combiner.on('end', function(entries) {

		var entryBuffer = [];
		
		for(var i = entries.length; i--;)
		{
			entryBuffer.push('_sardines.require("'+entries[i]+'")');
		}
		

		body += mu.load({ entries: '['+entryBuffer.toString()+']' }, __dirname + '/wrappers/footer.js')+'\n\n';
		


		//replace none-ascii characters
		(body.match(/[^\x00-\x7F]/g) || []).forEach(function(uc) {
			body = body.replace(uc,'\\u'+new Buffer(uc).toString('hex'));
		});


		
		body = mu.load({ body: body, name: ops.name || 'sardines' }, __dirname + '/wrappers/body.js');
		
		//body = uglify.uglify.gen_code(parser.parse(body, false, false), { beautify: true });
		
		fs.writeFileSync(output, body);   
		
		if(callback) callback();
	});
}


exports.findLastPackageDir = combine.findLastPackageDir;
exports.toModule = combine.toModule;