function getVector(a, b){
	return [
		b[0] - a[0], 
		b[1] - a[1], 
		b[2] - a[2]
	]
}
function getVectorXYZ(a, b){
	return [
		b.x - a.x, 
		b.y - a.y, 
		b.z - a.z
	]
}

function crossVec2(a, b){
	return a[0] * b[1] - a[1] * b[0]
}

function rgbaString(color){
	return 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + color[3] + ')'
}

function areaByCross(a, b){
	return Math.abs(a[0] * b[1] - a[1] * b[0])
}

function vecByDir(sideLength, dir){
	var a = sideLength, 
		b = sideLength / 2, 
		c = sideLength * Math.sqrt(3) / 2

	if(dir == 0)
		return [ 0, -2 * c ]
	if(dir == 1)
		return [ a + b, -c ]

	if(dir == 2)
		return [ a + b, c ]
	if(dir == 3)
		return [ 0, 2 * c ]

	if(dir == 4)
		return [ -a - b, c ]
	if(dir == 5)
		return [ -a -b, -c ]

	return [ 0, 0 ]
}

function backDir(direction){
	return (direction + 3) % 6
}

function isInsideHexagon(hexagon, sideLength, p){
	var a = sideLength, 
		b = sideLength / 2, 
		c = sideLength * Math.sqrt(3) / 2

	p[0] -= hexagon.originX
	p[1] -= hexagon.originY

	var v = [], area = 0.0
	v.push([ -p[0] + a, -p[1] + 0 ])
	v.push([ -p[0] + b, -p[1] + c ])
	v.push([ -p[0] - b, -p[1] + c ])

	v.push([ -p[0] - a, -p[1] + 0 ])
	v.push([ -p[0] - b, -p[1] - c ])
	v.push([ -p[0] + b , -p[1] - c ])

	for(var i = 0;i < 6;i++)
		area += areaByCross(v[i], v[(i + 1) % 6])

	var diff = Math.abs(sideLength * c * 6.0 - area)

	if(diff < 1e-3)
		return true

	return false
}

function loadSavedLevel(scale){
	if(scale == undefined)
		scale = 1.0
	return new Promise(function (resolve, reject){
		$.ajax({
			url: '/loadLevel', 
			method: 'post', 
			success: function (level){
				var data = JSON.parse(level)
				/*data.sideLength = parseFloat(data.sideLength) / scale

				for(var i = 0;i < data.graph.length;i++){
					data.graph[i].originX = parseFloat(data.graph[i].originX) / scale
					data.graph[i].originY = parseFloat(data.graph[i].originY) / scale

					for(var j = 0;j < 4;j++)
						data.graph[i].color[j] = parseFloat(data.graph[i].color[j])

					for(var j = 0;j < 6;j++)
						data.graph[i].dirs[j] = parseFloat(data.graph[i].dirs[j])
				}*/

				resolve(data)
			}, 
			error: function(){
				alert('Error while loading level')
			}
		})
	})
}

function loadModel(name){
	return new Promise(function(resolve, reject){
		$.ajax({
			url: '/loadModel', 
			method: 'post', 
			data: { name: name }, 
			success: function(model){
				resolve(model)
			}
		})
	})
}

function loadResource(name){
	return new Promise(function(resolve, reject){
		$.ajax({

			url: '/res', 
			method: 'post', 
			data: { name: name }, 
			success: function(data){
				resolve(data)
			}

		})
	})
}

function createShaderProgram(vertexShaderText, fragmentShaderText){
	var vShader = gl.createShader(gl.VERTEX_SHADER)
	var fShader = gl.createShader(gl.FRAGMENT_SHADER)

	gl.shaderSource(vShader, vertexShaderText)
	gl.shaderSource(fShader, fragmentShaderText)

	gl.compileShader(vShader)
	gl.compileShader(fShader)

	if(!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)){
		console.error('Vertex shader compilation error')
		console.error(gl.getShaderInfoLog(vShader))
	}

	if(!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)){
		console.error('Fragment shader compilation error')
		console.error(gl.getShaderInfoLog(fShader))
	}

	var program = gl.createProgram()

	gl.attachShader(program, vShader)
	gl.attachShader(program, fShader)

	gl.linkProgram(program)
	gl.validateProgram(program)

	if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
		console.error('Error in program')
		console.error(gl.getProgramInfoLog(program))
	}

	gl.deleteShader(vShader)
	gl.deleteShader(fShader)

	return { 
		id: program, 
		uniforms: [], 
		start: function(){
			gl.useProgram(this.id)
		}, 
		stop: function(){
			gl.useProgram(undefined)
		}, 
		getAttributeLocation(name){
			return gl.getAttribLocation(this.id, name)
		}, 
		initUniforms(arrayUniforms){
			for(var i = 0;i < arrayUniforms.length;i++){
				var uniformName = arrayUniforms[i]
				this.uniforms[uniformName] = gl.getUniformLocation(this.id, uniformName)
			}
		}, 
		setUniform: function(name, value, type){
			if(type == 'f')
				gl.uniform1f(this.uniforms[name], value)
			else
			if(type == 'i')
				gl.uniform1i(this.uniforms[name], value)
			else
			if(type == 'v2')
				gl.uniform2fv(this.uniforms[name], value)
			else
			if(type == 'v3')
				gl.uniform3fv(this.uniforms[name], value)
			else
			if(type == 'mat4')
				gl.uniformMatrix4fv(this.uniforms[name], gl.FALSE, value)
			else
				console.error('Unknown type: ' + type)
		}
	}
}

function createVBO(){
	var vbo = gl.createBuffer()

	return {
		vbo: vbo, 
		bind: function(){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		}, 
		unbind: function(){
			gl.bindBuffer(gl.ARRAY_BUFFER, undefined)
		}, 
		setData: function(array){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW)
		}
	}
}

function createIBO(){
	var ibo = gl.createBuffer()

	return {
		ibo: ibo, 
		bind: function(){
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		}, 
		unbind: function(){
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, undefined)
		}, 
		setData: function(array){
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(array), gl.STATIC_DRAW)
		}
	}
}

function createTexture(width, height){
	var id = gl.createTexture()

	gl.bindTexture(gl.TEXTURE_2D, id)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

	return id
}

function createFramebuffer(textureId){
	var id = gl.createFramebuffer()

	gl.bindFramebuffer(gl.FRAMEBUFFER, id)
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureId, null)

	return id
}

function formatFloat(val){
	return (val * 100. | 0) / 100.
}

function createCamera(position, direction, up){
	if(!position)
		position = [ 0, 0, 0 ]
	if(!direction)
		direction = [ 0, 0, 1 ]
	if(!up)
		up = [ 0, 1, 0 ]

	var eyeMatrix = new Float32Array(16)

	mat4.lookAt(eyeMatrix, position, [position[0] + direction[0], position[1] + direction[1], position[2] + direction[2]], up)

	return {
		bufferMatrix: eyeMatrix, 
		position: position, 
		direction: direction, 
		up: up, 
		lookAt: function(){
			return [
				this.position[0] + this.direction[0], 
				this.position[1] + this.direction[1], 
				this.position[2] + this.direction[2]
			]
		}, 
		moveForward: function(distance){
			this.position[0] += this.direction[0] * distance
			this.position[1] += this.direction[1] * distance
			this.position[2] += this.direction[2] * distance
		}, 
		reset: function(){
			this.direction = [ 0, 0, 1 ]
			this.up = [ 0, 1, 0 ]
		},
		rotateHorizontal: function(angle){
			vec3.rotateY(this.direction, this.direction, [ 0, 0, 0 ], angle)
			vec3.rotateY(this.up, this.up, [ 0, 0, 0 ], angle)
			/*mat4.identity(this.bufferMatrix)
			this.bufferMatrix[15] = 0
			mat4.rotate(this.bufferMatrix, this.bufferMatrix, angle, this.up)
			vec3.transformMat4(this.direction, this.direction, this.bufferMatrix)*/
		}, 
		rotateVertical: function(angle){
			angle = -angle
			mat4.identity(this.bufferMatrix)
			this.bufferMatrix[15] = 0

			var right = [ 0, 0, 0 ]
			vec3.cross(right, this.up, this.direction)

			mat4.rotate(this.bufferMatrix, this.bufferMatrix, angle, right)

			vec3.transformMat4(this.direction, this.direction, this.bufferMatrix)
			vec3.transformMat4(this.up, this.up, this.bufferMatrix)
		}, 
		getPosition: function() {
			return this.position
		}, 
		getEyeMatrix: function(){
			mat4.lookAt(this.bufferMatrix, this.position, this.lookAt(), this.up)
			return this.bufferMatrix
		}
	}
}

function createFollowCamera(position, direction, up) {
	if(!position)
		position = [ 0, 0, 0 ]
	if(!direction)
		direction = [ 0, 0, 1 ]
	if(!up)
		up = [ 0, 1, 0 ]

	var eyeMatrix = new Float32Array(16)

	mat4.lookAt(eyeMatrix, position, [position[0] + direction[0], position[1] + direction[1], position[2] + direction[2]], up)

	return {
		bufferMatrix: eyeMatrix, 
		position: position, 
		direction: direction, 
		up: up, 
		followPoint: [ 0, 0, 0 ], 
		distance: 1, 
		lookAt: function(){
			return [
				this.position[0] + this.direction[0], 
				this.position[1] + this.direction[1], 
				this.position[2] + this.direction[2]
			]
		}, 
		moveForward: function(distance){
			this.distance += distance
			this.distance = this.distance < 1 ? 1 : this.distance
		},
		rotateHorizontal: function(angle){
			mat4.identity(this.bufferMatrix)
			this.bufferMatrix[15] = 0
			mat4.rotate(this.bufferMatrix, this.bufferMatrix, angle, this.up)
			vec3.transformMat4(this.direction, this.direction, this.bufferMatrix)
		}, 
		rotateVertical: function(angle){
			angle = -angle
			mat4.identity(this.bufferMatrix)
			this.bufferMatrix[15] = 0

			var right = [ 0, 0, 0 ]
			vec3.cross(right, this.up, this.direction)

			mat4.rotate(this.bufferMatrix, this.bufferMatrix, angle, right)

			vec3.transformMat4(this.direction, this.direction, this.bufferMatrix)
			vec3.transformMat4(this.up, this.up, this.bufferMatrix)
		}, 
		getPosition: function(){
			var Position = [this.followPoint[0] - this.direction[0] * this.distance, 
				this.followPoint[1] - this.direction[1] * this.distance, 
				this.followPoint[2] - this.direction[2] * this.distance]
			return Position
		}, 
		getEyeMatrix: function(){
			var Position = this.getPosition()
			mat4.lookAt(this.bufferMatrix, Position, 
				[ 
					Position[0] + this.direction[0], 
					Position[1] + this.direction[1], 
					Position[2] + this.direction[2] 
				], this.up)
			return this.bufferMatrix
		}, 
		setFollowPoint: function(point){
			for(var i = 0;i < 3;i++)
				this.followPoint[i] = point[i]
		}
	}
}

function createDataWithNormals(vertices, indecies){
	var data = []
	var index = []

	var n = [ 0, 0, 0 ]

	for(var i = indecies.length - 1;i >= 0;i--){
		var a, b, c
		a = indecies[i][0]
		b = indecies[i][1]
		c = indecies[i][2]

		var l = getVectorXYZ(vertices[a], vertices[b]), 
			r = getVectorXYZ(vertices[a], vertices[c])

		vec3.cross(n, l, r)

		var first = data.length / 6

		data.push(vertices[a].x, vertices[a].y, vertices[a].z)
		data.push(n[0], n[1], n[2])
		data.push(vertices[b].x, vertices[b].y, vertices[b].z)
		data.push(n[0], n[1], n[2])
		data.push(vertices[c].x, vertices[c].y, vertices[c].z)
		data.push(n[0], n[1], n[2])

		index.push(first, first + 1, first + 2)
	}

	return { vertices: data, indecies: index }
}

function createRenderBuffer(width, height, frameBufferID){
	var id = gl.createRenderbuffer()

	gl.bindRenderbuffer(gl.RENDERBUFFER, id)

	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferID)
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, id)

	return id
}

/*
	mapping: [
		{ layoutPosition, componentLength, stride, offset }
	]
*/

function createModel(data, mapping){
	var vbo = createVBO(), ibo = createIBO()

	vbo.setData(data.vertices)
	ibo.setData(data.indecies)
	
	var vao = createVAO()

	vao.bind()

	vbo.bind()
	ibo.bind()

	for(var i = 0;i < mapping.length;i++){
		gl.enableVertexAttribArray(mapping[i].layoutPosition)

		gl.vertexAttribPointer(mapping[i].layoutPosition, 
			mapping[i].componentLength, gl.FLOAT, gl.FALSE, 
			mapping[i].stride * Float32Array.BYTES_PER_ELEMENT, 
			mapping[i].offset * Float32Array.BYTES_PER_ELEMENT)
	}

	vao.unbind()

	return {
		vao: vao, 
		size: data.indecies.length, 
		render: function(type){
			if(!type)
				type = gl.TRIANGLES
			vao.bind()
			gl.drawElements(type, this.size, gl.UNSIGNED_SHORT, 0)
			vao.unbind()
		}
	}
} 

function createVAO(){
	var id = gl.createVertexArray()

	return {
		vao: id, 
		bind: function(){
			gl.bindVertexArray(this.vao)
		}, 
		unbind: function(){
			gl.bindVertexArray(null)
		}
	}
}

function hexPoint(size, index){
	var a = size / 2.
	var b = Math.sqrt(size * size - a * a)

	if(index == 0)
		return [ size, 0 ]
	if(index == 1)
		return [ a, b ]
	if(index == 2)
		return [ -a, b ]
	if(index == 3)
		return [ -size, 0 ]
	if(index == 4)
		return [ -a, -b ]
	if(index == 5)
		return [ a, -b ]
}

function createHexPlate(){
	var ret = {
		vertices: [], 
		indecies: []
	}

	var normal = [ 0, 1, 0 ]
	var vrtx = []

	for(var i = 0;i < 6;i++){
		let x = 0, y = 0, z = 0
		x = hexPoint(1., i)[0]
		z = hexPoint(1., i)[1]
		vrtx.push(x, y, z)
		vrtx = vrtx.concat(normal)
	}

	ret.vertices = vrtx

	ret.indecies.push(0, 1, 2, 0, 4, 5, 2, 3, 4, 0, 2, 4)

	console.log(ret)

	return ret
}

function createGrid(size){
	var ret = {
		vertices: [], 
		indecies: []
	}

	for(var i = -size + 1;i < size;i++){
		var ptr = ret.vertices.length / 3
		ret.vertices.push(i, 0, size)
		ret.vertices.push(i, 0, -size)
		ret.indecies.push(ptr, ptr + 1)

		ret.vertices.push(i - .1, 0, size - .3)
		ret.indecies.push(ptr, ptr + 2)

		ret.vertices.push(i + .1, 0, size - .3)
		ret.indecies.push(ptr, ptr + 3)
	}

	for(var i = -size + 1;i < size;i++){
		var ptr = ret.vertices.length / 3
		ret.vertices.push(size, 0, i)
		ret.vertices.push(-size, 0, i)
		ret.indecies.push(ptr, ptr + 1)
		
		ret.vertices.push(size -.3, 0, i - .1)
		ret.indecies.push(ptr, ptr + 2)

		ret.vertices.push(size -.3, 0, i + .1)
		ret.indecies.push(ptr, ptr + 3)
	}

	return ret
}

function toRadians(deg){
	return Math.PI * deg / 180.0
}

class MapUnit{
	constructor(id){
		this.id = id
		this.type = 'unknown'
		this.color = [ 0, 192, 0, 255 ]
		this.setColor = (color) => { this.color = color }
	}
}
class Cell extends MapUnit{
	constructor(id, x, y){
		super(id)

		if (x == undefined || y == undefined)
			console.error('X and Y undefined')

		this.type = 'cell'
		this.connection = []
		this.x = x
		this.y = y

		for(var i = 0;i < 6;i++)
			this.connection.push(undefined)
	}
}
class Bridge extends MapUnit{
	constructor(id, first, second){
		super(id)
		this.connect = [ first, second ]
		this.type = 'bridge'
	}
}
class MapContainer {
	constructor(){
		this.data = []
		this.idLength = 10	
		this.sideLength = 20
		this.paintColor = [ 10, 10, 10, 255 ]

		let a = this.sideLength / 2, 
			b = this.sideLength * Math.sqrt(3) / 2.0, 
			c = this.sideLength

		this.cellPoints = [
			[ a, b ], 
			[ -a, b ], 
			[ -c, 0 ], 
			[ -a, -b ], 
			[ a, -b ], 
			[ c, 0 ]
		]

		this.getId = function() {
			var id = ''
			for(var i = 0;i < this.idLength;i++)
				id += (Math.random() < .3 ? 
					String.fromCharCode('0'.charCodeAt(0) + (Math.random() * 10. | 0)) : 
					String.fromCharCode('a'.charCodeAt(0) + (Math.random() * 26. | 0)))
			return id
		}

		this.addNewCell = function(x, y) {
			var id = this.getId()
			var cell = new Cell(id, x, y)
			cell.color = this.paintColor
			this.data.push(cell)
			return id
		}

		this.get = function(id) {
			for(var i = 0;i < this.data.length;i++)
				if(this.data[i].id == id)
					return this.data[i]
		}

		this.delete = function(id) {
			for(var i = 0;i < this.data.length;i++)
				if(this.data[i].id == id){
					this.data.splice(i, 1)
					break
				}
			for(var i = 0;i < this.data.length;i++)
				if(this.data[i].type == 'cell')
					for(var j = 0;j < 6;j++)
						if(this.data[i].connection[j] == id)
							this.data[i].connection[j] = undefined
		}

		this.renderCell = function(g, cell){
			g.translate(cell.x, cell.y)

			g.fillStyle = rgbaString(cell.color)
			
			g.beginPath()
			g.moveTo(this.cellPoints[0][0], this.cellPoints[0][1])
			for(var i = 1;i < 6;i++)
				g.lineTo(this.cellPoints[i][0], this.cellPoints[i][1])
			g.closePath()
			g.fill()

			g.translate(-cell.x, -cell.y)
		}

		this.getCellCoords = function(direction) {
			var ret = [ 
				this.cellPoints[direction][0] + this.cellPoints[(direction + 1) % 6][0],
				this.cellPoints[direction][1] + this.cellPoints[(direction + 1) % 6][1] 
			]
			return ret
		}

		this.updateConnectionsBy = function(cell){
			for(var i = 0;i < this.data.length;i++){
				if(this.data[i].id != cell.id){
					var vc = [ cell.x - this.data[i].x, cell.y - this.data[i].y ]
					for(var j = 0;j < 6;j++){
						if(crossVec2(vc, this.cellPoints[j]) < 0 && 
							crossVec2(this.cellPoints[(j + 1) % 6], vc) < 0)
							this.data[i].connection[j] = cell.id
					}
				}
			}
		}

		this.colorClick = function(x, y) {
			for(var i = 0;i < this.data.length;i++){
				if(this.data[i].type == 'cell'){
					x -= this.data[i].x 
					y -= this.data[i].y

					if(x * x + y * y <= this.sideLength * this.sideLength * 3 / 4) {
						this.data[i].color = this.paintColor
						return
					}

					x += this.data[i].x
					y += this.data[i].y
				} else if(this.data[i].type == 'bridge') {

				}
			}
		}

		this.getIdInPos = function(x, y) {
			for(var i = 0;i < this.data.length;i++){
				if(this.data[i].type == 'cell'){
					x -= this.data[i].x 
					y -= this.data[i].y
					if(x * x + y * y <= this.sideLength * this.sideLength * 3 / 4)
						return this.data[i].id
					x += this.data[i].x
					y += this.data[i].y
				}
			}
			return undefined
		}

		this.createClick = function(x, y) {
			for(var i = 0;i < this.data.length;i++){
				if(this.data[i].type == 'cell'){
					x -= this.data[i].x 
					y -= this.data[i].y
					
					if (x * x + y * y <= this.sideLength * this.sideLength * 2) {
						var vc = [ x, y ]
						for(var j = 0;j < 6;j++){
							if(crossVec2(vc, this.cellPoints[j]) < 0 && 
								crossVec2(this.cellPoints[(j + 1) % 6], vc) < 0 && 
								this.data[i].connection[j] == undefined){

								let nPoint = this.getCellCoords(j)

								this.data[i].connection[j] = this.addNewCell(this.data[i].x + nPoint[0], this.data[i].y + nPoint[1])
								this.updateConnectionsBy(this.get(this.data[i].connection[j]))

								return
							}
						}
					}

					x += this.data[i].x
					y += this.data[i].y
				} 
			}
		}

		this.bridge = function(firstId, secondId){
			console.log(firstId, secondId)

			let cell1 = this.get(firstId), 
				cell2 = this.get(secondId)

			var bridgeId = this.getId()

			this.data.push(new Bridge(bridgeId, firstId, secondId))
		}

		this.deleteClick = function(x, y){
			for(var i = 0;i < this.data.length;i++){
				if(this.data[i].type == 'cell'){
					x -= this.data[i].x 
					y -= this.data[i].y

					if(x * x + y * y <= this.sideLength * this.sideLength * 3 / 4) {
						this.delete(this.data[i].id)
						return
					}

					x += this.data[i].x
					y += this.data[i].y
				} else if(this.data[i].type == 'bridge') {

				}
			}
		}

		this.click = function(x, y){ // Deprecated
			for(var i = 0;i < this.data.length;i++){
				if(this.data[i].type == 'cell'){
					x -= this.data[i].x 
					y -= this.data[i].y

					if(x * x + y * y <= this.sideLength * this.sideLength * 3 / 4) {
						this.data[i].color = this.paintColor
						return
					} else if (x * x + y * y <= this.sideLength * this.sideLength * 2) {
						var vc = [ x, y ]
						for(var j = 0;j < 6;j++){
							if(crossVec2(vc, this.cellPoints[j]) < 0 && 
								crossVec2(this.cellPoints[(j + 1) % 6], vc) < 0 && 
								this.data[i].connection[j] == undefined){

								let nPoint = this.getCellCoords(j)

								this.data[i].connection[j] = this.addNewCell(this.data[i].x + nPoint[0], this.data[i].y + nPoint[1])
								this.updateConnectionsBy(this.get(this.data[i].connection[j]))

								return
							}
						}
					}

					x += this.data[i].x
					y += this.data[i].y
				} else if(this.data[i].type == 'bridge') {

				}
			}
		}

		this.renderBridge = function(g, bridge) {
			let cell1 = this.get(bridge.connect[0]), 
				cell2 = this.get(bridge.connect[1])

			g.lineWidth = 10

			let vc = [ cell2.x - cell1.x, cell2.y - cell1.y ]
			vec2.normalize(vc, vc)
			vc[0] *= 13
			vc[1] *= 13

			g.strokeStyle = rgbaString(bridge.color)
			g.beginPath()
			g.moveTo(cell1.x + vc[0], cell1.y + vc[1])
			g.lineTo(cell2.x - vc[0], cell2.y - vc[1])
			g.stroke()
		}
 
		this.render = function(g){
			for (let unit of this.data){
				if(unit.type == 'cell') {
					this.renderCell(g, unit)
				} else {
					this.renderBridge(g, unit)
				}
			}
		}
	}
}

class MatrixStack {
	constructor() {
		this.stack = []
		this.pointer = 1
		this.MAX_SIZE = 32
		for(var i = 0;i < this.MAX_SIZE;i++){
			this.stack.push(new Float32Array(16))
			mat4.identity(this.stack[i])
		}
		this.translate = function(v3) {
			mat4.translate(this.stack[this.pointer], this.stack[this.pointer - 1], v3)
			this.pointer++
		}
		this.get = function() { 
			return this.stack[this.pointer - 1]
		}
		this.scale = function(s3) { 
			mat4.scale(this.stack[this.pointer], this.stack[this.pointer - 1], s3)
			this.pointer++
		}
		this.back = function() { 
			this.pointer--
		}
		this.rotateX = function(angle) {
			mat4.rotateX(this.stack[this.pointer], this.stack[this.pointer - 1], angle)
		}
		this.rotateY = function(angle) {
			mat4.rotateY(this.stack[this.pointer], this.stack[this.pointer - 1], angle)
		}
		this.rotateZ = function(angle) {
			mat4.rotateZ(this.stack[this.pointer], this.stack[this.pointer - 1], angle)
		}
	}
}