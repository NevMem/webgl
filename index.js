var express = require('express'), 
	colors = require('colors'), 
	fs = require('fs'), 
	bParser = require('body-parser'), 
	url = require('url')

var app = express()

app.set('view engine', 'pug')

app.use(bParser.json())
app.use(bParser.urlencoded({extended: true}))

app.use(function(req, res, next){
	var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(",")[0];
	console.log(req.headers['x-forwarded-for'], 
		(req.connection ? req.connection.remoteAddress : 'none'), 
		(req.socket ? req.socket.remoteAddress : 'none'), 
		(req.connection && req.connection.socket ? req.connection.socket.remoteAddress : 'none'))
	console.log('[' + req.method + '] ' + ip + ' ' + req.url.cyan)

	next()
})

app.use(express.static('files'))

app.get('/', function(req, res){
	res.render('main')
})

app.get('/dev', function(req, res){
	res.render('next')
})

app.get('/level', function(req, res){
	res.render('level')
})

app.get('/webgpgpu', function(req, res){
	res.render('webgpgpu')
})

app.get('/color', function(req, res){
	res.render('color')
})

function resourceHandler(name, res){
	if(fs.existsSync(__dirname + '/resources/' + name)){
		res.sendFile(__dirname + '/resources/' + name)
	} else {
		res.send('404')
	}
}

app.post('/res', function(req, res){
	var name = req.body.name
	resourceHandler(name, res)
})

app.get('/res', function(req, res){
	var name = url.parse(req.url, true).query.name
	resourceHandler(name, res)
})

app.post('/saveData', function(req, res){
	var level = req.body.level
	level = JSON.stringify(level)

	fs.writeFileSync('currentLevel.json', level, 'utf-8')
	//fs.writeFileSync((Date.now()) + '.json', level, 'utf-8')

	res.send('updated')
})

app.post('/loadLevel', function(req, res){
	res.sendFile(__dirname + '/currentLevel.json')
})

var stored = []

function parseModelPly(data){
	var start = process.hrtime()

	var res = { format: 'v1', vertices: [], indecies: [], isInvalid: false }

	data = data.split(/\n/g)

	var parseStart = -1

	var vertexCount = 0, 
		faceCount = 0, 
		currentElement = undefined, 
		propertyName = {  }

	for (var i = 0;i < data.length;i++){
		if(data[i] == 'end_header'){
			parseStart = i + 1
			break
		}

		var line = data[i].split(/ /)

		if(line[0] == 'element' && line[1] == 'vertex'){
			vertexCount = parseInt(line[2])
			currentElement = 'vertex'
		} else if(line[0] == 'element' && line[1] == 'face'){
			faceCount = parseInt(line[2])
			currentElement = 'face'
		} else if(line[0] == 'property'){
			if(!propertyName[currentElement])
				propertyName[currentElement] = []

			propertyName[currentElement].push(line[2])
		}
	}

	if(parseStart == -1){
		res.isInvalid = true
		return res
	}

	for(var i = parseStart;i < data.length;i++){
		if(vertexCount != 0){
			vertexCount--

			var line = data[i].split(/ /)
			var vertex = {}
			for(var j = 0;j < line.length;j++)
				vertex[propertyName['vertex'][j]] = parseFloat(line[j])

			res.vertices.push(vertex)

		} else if(faceCount != 0){
			faceCount--

			var line = data[i].split(/ /)
			var index = []

			if(parseInt(line[0]) != 3){
				res.isInvalid = true
			} else {
				index.push(parseInt(line[1]), parseInt(line[2]), parseInt(line[3]))
			}

			res.indecies.push(index)
		}
	}

	var finish = process.hrtime(start)
	console.log('Parsed file')
	console.log('Time: ' + ((finish[0] * 1e9 + finish[1]) / 1e6) + ' ms')

	return res
}

function parseModelObj(data){
	var start = process.hrtime()

	var res = { format: 'v2', vertices: [], indecies: [], isInvalid: false }

	data = data.split('\n')

	var vrtx = []
	var nrmls = []

	for (var i = 0;i < data.length;i++){
		var line = data[i].split(' ')
		if(line.length == 0 || line[0] == '#' || line == 'o')
			continue

		if(line[0] == 'v'){
			vrtx.push([ parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3]) ])
		} else if(line[0] == 'vn') {
			nrmls.push([ parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3]) ])
		} else if(line[0] == 'f') {
			if(line.length != 4)
				res.isInvalid = true
			for(var j = 1;j < line.length;j++){
				var vertex, normal, buffer = line[j].split('//')
				vertex = parseInt(buffer[0]) - 1
				normal = parseInt(buffer[1]) - 1

				for(var k = 0;k < 3;k++)
					res.vertices.push(vrtx[vertex][k])
				for(var k = 0;k < 3;k++)
					res.vertices.push(nrmls[normal][k])
				res.indecies.push(res.vertices.length / 6 - 1)
			}
		}
	}

	var finish = process.hrtime(start)

	console.log('Parsed file')
	console.log('Time: ' + ((finish[0] * 1e9 + finish[1]) / 1e6) + ' ms')

	return res
}

var loadModelHandler = function(req, res){
	var name

	if(req.method == 'POST')
		name = req.body.name
	else
		name = url.parse(req.url, true).query.name

	if(name == 'model.ply' || name == 'enemy.ply' || 
		name == 'cube.ply' || name == 'sphere.ply' || 
		name == 'hex.ply' || name == 'hexPlate.ply'){
		if(!stored[name]){
			var data = fs.readFileSync(__dirname + '/models/' + name, 'utf-8')
			stored[name] = parseModelPly(data)
		}
		res.send(stored[name])
	} else 
	if(name == 'monkey.obj' || name == 'bridge.obj' || name == 'hex.obj'){
		if(!stored[name]){
			var data = fs.readFileSync(__dirname + '/models/' + name, 'utf-8')
			stored[name] = parseModelObj(data)
		}
		res.send(stored[name])	
	} else 
		res.send('model with name: ' + name + ' not found')
}

app.post('/loadModel', loadModelHandler)
app.get('/loadModel', loadModelHandler)

app.get('/models', function(req, res){
	res.render('models', { models: stored })
})

app.get('/reloadModel', function(req, res){
	var name = url.parse(req.url, true).query.modelName

	if(name == 'model.ply' || name == 'enemy.ply' || 
		name == 'cube.ply' || name == 'sphere.ply' || 
		name == 'hex.ply' || name == 'hexPlate.ply'){
		if(!stored[name]){
			var data = fs.readFileSync(__dirname + '/models/' + name, 'utf-8')
			stored[name] = parseModelPly(data)
		}
		res.send(stored[name])
	} else 
	if(name == 'monkey.obj' || name == 'bridge.obj' || name == 'hex.obj'){
		if(!stored[name]){
			var data = fs.readFileSync(__dirname + '/models/' + name, 'utf-8')
			stored[name] = parseModelObj(data)
		}
		res.send(stored[name])	
	} else 
		res.send('model with name: ' + name + ' not found')
})

app.listen(80, function(err){
	if(!err)
		console.log('Running'.green)
	else
		console.log((err + '').red)
})