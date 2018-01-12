//kendall's lib
//most of this information is from webglfundamentals.org
//I just put it all together
//note: need gl in the name of "gl"


var ambLight = [0.3,0.3,0.3];

function kgl(vertexSource, fragmentSource)
{

//v-shader
var vertexShaderSource = document.getElementById(vertexSource).text;
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);
console.log( gl.getShaderInfoLog( vertexShader ) );

//f-shader
var fragmentShaderSource = document.getElementById(fragmentSource).text;
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);
console.log( gl.getShaderInfoLog(fragmentShader) );

//gl program
var program = gl.createProgram();
gl.attachShader( program, vertexShader );
gl.attachShader( program, fragmentShader );
gl.linkProgram( program );

var worldMatrix;
var viewProjectionMatrix;

var worldViewProjetionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
var reverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");

var ambLightLocation = gl.getUniformLocation(program, "u_amb");


var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
//var positionBuffer = gl.createBuffer();

var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

var normalLocation = gl.getAttribLocation(program, "a_normal");

var camera = [0,10, 120];
var cameraTarget = [0, 5, 0];
var cameraUp = [0, -1, 0];

return{
	vertexShader:vertexShader,
	fragmentShader:fragmentShader,
	program:program,
	worldMatrix:worldMatrix,
	viewProjectionMatrix:viewProjectionMatrix,
	
	worldViewProjetionLocation:worldViewProjetionLocation,
	worldInverseTransposeLocation:worldInverseTransposeLocation,
	positionAttributeLocation:positionAttributeLocation,
	texcoordLocation:texcoordLocation,
	normalLocation:normalLocation,
	reverseLightDirectionLocation:reverseLightDirectionLocation,
	camera:camera,
	cameraTarget:cameraTarget,
	cameraUp,cameraUp,
	ambLightLocation,ambLightLocation,

};
}


function glStaticObject(kl, data, textureFile)
{
//first models, this was used to load my first models.
//I am using toast's library now

	var textureBuffer;
	var texture = gl.createTexture();

	var image = new Image();

	positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( data ), gl.STATIC_DRAW);

	textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));

	image.src = textureFile;	
	image.addEventListener('load', function() {
	// texture callback
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	});

	var size = data.length / 8;


	return{
	textureBuffer:textureBuffer,
	positionBuffer:positionBuffer,
	size:size,
	texture:texture,
	};
}


function drawStaticObject(object)
{
//first models, this was used to load my first models.
//I am using toast's library now
	var step = Float32Array.BYTES_PER_ELEMENT;

	//set matrix
	var worldViewProjectionMatrix = m4.multiply(kl.viewProjectionMatrix, kl.worldMatrix);
	var worldInverseMatrix = m4.inverse(kl.worldMatrix);
	var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

	gl.uniformMatrix4fv(kl.worldViewProjetionLocation, false, worldViewProjectionMatrix);
	gl.uniformMatrix4fv(kl.worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

	//light
	//gl.uniform3fv(kl.reverseLightDirectionLocation, m4.normalize([0.0, 1.0, 1]));
	gl.uniform3fv(kl.reverseLightDirectionLocation, m4.normalize([0.0, guiParams.lightY, guiParams.lightZ]));

	//bind texture
	gl.bindTexture(gl.TEXTURE_2D, object.texture);

	//bind buffer and draw
	gl.enableVertexAttribArray(kl.positionAttributeLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, object.positionBuffer);
	//gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
	gl.vertexAttribPointer(kl.positionAttributeLocation, 3, gl.FLOAT, false, step*8, 0);
	//gl.drawArrays(primitiveType, offset, count);
	gl.enableVertexAttribArray(kl.texcoordLocation);
	gl.vertexAttribPointer(kl.texcoordLocation, 2, gl.FLOAT, false, step*8, step*3);
	gl.enableVertexAttribArray(kl.normalLocation);
	gl.vertexAttribPointer(kl.normalLocation, 3, gl.FLOAT, true, step*8, step*5);

	gl.drawArrays(gl.TRIANGLES, 0, object.size);

}

function bindMeshTexture(mesh, textureFile)
{
	var image = new Image();
	mesh.texture = gl.createTexture();

	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
	gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
	//if not found the texture will be blue
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));

	image.src = textureFile;	
	image.addEventListener('load', function() {
	// texture callback
	gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //WHY!!! <-NIGHTMARE!!!

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	});
}

function drawMesh(mesh)
{
//using the frenchtost loader
//https://github.com/frenchtoast747/webgl-obj-loader

	var step = Float32Array.BYTES_PER_ELEMENT;

	//set matrix
	var worldViewProjectionMatrix = m4.multiply(kl.viewProjectionMatrix, kl.worldMatrix);
	var worldInverseMatrix = m4.inverse(kl.worldMatrix);
	var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

	gl.uniformMatrix4fv(kl.worldViewProjetionLocation, false, worldViewProjectionMatrix);
	gl.uniformMatrix4fv(kl.worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

	//amb light
	gl.uniform3fv(kl.ambLightLocation, mesh.ambLight);

	//set light
	//gl.uniform3fv(kl.reverseLightDirectionLocation, m4.normalize([0.0, 1.0, 1]));
	gl.uniform3fv(kl.reverseLightDirectionLocation, m4.normalize([0.0, guiParams.lightY, guiParams.lightZ]));
	
	//bind vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
	gl.vertexAttribPointer(kl.positionAttributeLocation, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	//bind texture cords if any
	if(!mesh.textures.length){
	  gl.disableVertexAttribArray(kl.texcoordLocation);
	}
	else{
	// if the texture vertexAttribArray has been previously
	// disabled, then it needs to be re-enabled
	gl.enableVertexAttribArray(kl.texcoordLocation);
	//bind texture
	gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
	gl.vertexAttribPointer(kl.texcoordLocation, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}

	//normals
	gl.enableVertexAttribArray(kl.normalLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
	gl.vertexAttribPointer(kl.normalLocation, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	//draw
	gl.enableVertexAttribArray(kl.positionAttributeLocation);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
	gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

}


function loadMesh(modelName, location, textureFile, meshArray)
{
//http request to get mesh
	var xhttp = new XMLHttpRequest();
	xhttp.overrideMimeType('text/plain; charset=x-user-defined');
	xhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		var newmesh = new OBJ.Mesh( xhttp.responseText );
		newmesh['modelName'] = modelName;
		newmesh['ambLight'] = ambLight;
 		OBJ.initMeshBuffers(gl, newmesh);
		bindMeshTexture(newmesh,textureFile);
		meshes.push ( newmesh );
	    }
	};
	xhttp.open("GET", location, true);
	xhttp.send();
}

