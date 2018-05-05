var express = require('express'), 
	colors = require('colors'), 
	fs = require('fs'), 
	bParser = require('body-parser')

var app = express()

app.set('view engine', 'pug')

app.use(bParser.json())
app.use(bParser.urlencoded({extended: true}))

app.use(function(req, res, next){

	console.log('[' + req.method + '] ' + req.url.cyan)

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

app.post('/res', function(req, res){
	var name = req.body.name
	if(fs.existsSync(__dirname + '/resources/' + name)){
		res.sendFile(__dirname + '/resources/' + name)
	} else {
		res.send('404')
	}
})

app.post('/saveData', function(req, res){
	var level = req.body.level
	level = JSON.stringify(level)

	fs.writeFileSync('currentLevel.json', level, 'utf-8')
	fs.writeFileSync((Date.now()) + '.json', level, 'utf-8')

	res.send('updated')
})

app.post('/loadLevel', function(req, res){
	res.sendFile(__dirname + '/currentLevel.json')
})

var stored = []

function parseModel(data){
	var res = { vertices: [], indecies: [], isInvalid: false }

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

	return res
}

app.post('/loadModel', function(req, res){
	var name = req.body.name

	if(name == 'model.ply' || name == 'enemy.ply' || 
		name == 'cube.ply' || name == 'sphere.ply' || 
		name == 'hex.ply' || name == 'hexPlate.ply'){
		if(!stored[name]){
			var data = fs.readFileSync(__dirname + '/models/' + name, 'utf-8')
			stored[name] = parseModel(data)
		}
		res.send(stored[name])
	}
})

app.listen(80, function(err){
	if(!err)
		console.log('Running'.green)
	else
		console.log((err + '').red)
})