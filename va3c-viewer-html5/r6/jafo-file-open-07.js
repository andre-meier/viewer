// all code here derived from https://github.com/mrdoob/three.js/blob/master/editor/js/Loader.js

// see the file opening matrix here: https://docs.google.com/spreadsheets/d/1pGRTFDm0RPjWJTilqxk9NgnezEsaxKmMRtsG_IdbBAY/edit#gid=0

// 2014-09-03 ~ this file is still very messy and unnecessarily complex. Slimming and simplifying it down is a current WIP

	var JAFO = {} || JAFO;
//	var xmlhttp;

	if ( window.location.origin === 'http://' ) {
		JAFO.loadersBase = '../../../three.js/examples/';
	} else {

// If you are working locally, you will probably need to change this path setting... 

		JAFO.loadersBase = '../../../../three.js/examples/';

	}

	JAFO.basePath = window.location.href.substr( 0, window.location.href.indexOf( 'viewer') );
//console.log( 'basepath', JAFO.basePath );
	JAFO.template = JAFO.basePath + 'viewer/va3c-viewer-html5/r6/template-basic.html';

	JAFO.addFileOpenTab = function() {

		var tab = JA.menu.appendChild( document.createElement( 'div' ) );
		tab.title = 'Open a file';
		tab.innerHTML =
			'<a id=tabFileOpen title="Select a file to load or start a new file" ><p class=buttonFile >' +
				'<i class="fa fa-files-o"></i> File Open...' +
			'</p></a>';
		tabFileOpen.onclick = function() { JA.toggleTab( JAFO.FileOpenTab ); };

		JAFO.FileOpenTab = tab.appendChild( document.createElement( 'div' ) );
		JAFO.FileOpenTab.style.cssText = 'cursor: auto; display: none; ' ;
		JAFO.FileOpenTab.innerHTML =
			'<p title="Adjust size of incoming object" >Scale: <input type=number id=inpScale value=1.000 max=1000 min=0.001 step=1 /></p>' +
			'<p>Open & overwrite current scene: <input type=file id=inpOpenFile ></p>' +
			'<p title="WIP: combine with regular Open command" >Open binary JSON file: <input type=file id=inpOpenBinaryFile ></p>' +
			'<p>Insert into current scene: <input type=file id=inpAppendFile ></p>' +
			'<p><a href=JavaScript:JAFO.openUrl(JAFO.template); >Create new empty scene</a></p>' +
			'<p>Notes: files that are scenes overwrite the current scene. ' +
				'Local files cannot be used to create permalinks. Best to reload page between opens.' +
			'</p>' +
		'';

		inpOpenFile.onchange = function() { JAFO.openFile ( this ); };
		inpOpenBinaryFile.onchange = function() { JAFO.openFileBinary ( this ); };
		inpAppendFile.onchange = function() { JAFO.appendFile ( this ); };

	};

// permalinks are collections of permalinks

	JAFO.openPermalinks = function ( permalinks ) {
//console.log( 'openPermalinks', permalinks[1].src );

		var iframes = document.getElementsByTagName( 'iframe' ) ;

		for ( var i = 0, len = iframes.length; i < len; i++ ) {
			iframes[0].parentNode.removeChild( iframes[ 0 ] );
		}

		JAFO.ifr = document.body.appendChild( document.createElement( 'iframe' ) );
		JAFO.ifr.height = window.innerHeight;
		JAFO.ifr.width = window.innerWidth;
		JAFO.ifr.style.cssText = 'border-width: 0; position: absolute; ';

		JAFO.ifr.onload = function() {

			JAFO.updateIframe( permalinks );

			for ( var i = 1, len = V3PL.permalinks.length; i < len; i++ ) {

				JAFO.switchType( permalinks[i] );

			}

// if autocrapdeedle, set up rotations animation for autocrapdoodle

			if ( location.hash.toLowerCase().indexOf('auto') >  0 ){  

				JAFO.ifr.contentWindow.animate3 = function () {
					var cnt = 0;
					var camRadius = 250;
					JAFO.ifr.contentWindow.requestAnimationFrame( JAFO.ifr.contentWindow.animate3 );
					for (var i = 0, len = scene.children.length; i < len; i++) {
						if ( scene.children[i].geometry ) {
							scene.children[i].rotation.y += 0.001;
							scene.children[i].rotation.z += 0.001;
						}
					}
					cnt += 0.001;
					camera.position.set( Math.sin( cnt * 0.7 ) * camRadius, Math.cos( cnt * 0.3 ) * camRadius,  Math.sin( cnt * 0.2 ) * camRadius );
				};

				JAFO.ifr.contentWindow.animate3();

			}

		};

		JAFO.ifr.src = permalinks[1].src;

	};

/*

Following functions deal with:

Using the operating systen file dialog box to open or append files

Using Drag and Drop to open files

inpFile: what is returned after using the OS' file dialog box
- usually includes the contents of the file


*/

	JAFO.openFile = function ( inpFile ) {
// console.log( 'OpenFile', inpFile, inpFile.files[0] );

		if ( !inpFile.files ) return;

		V3PL.permalinks = [];
		V3PL.permalinks.push( V3PL.setDefaults( V3PL.defaultScene ) );

		var scale = inpScale.value;
		var fileName = inpFile.files[0].name;
		var permalink = V3PL.buildPermalink( fileName, scale );
		var extension = fileName.split( '.' ).pop().toLowerCase();

		if ( extension === 'html' ) {

			var reader = new FileReader();
			reader.addEventListener( 'load', function ( event ) {

				var contents = reader.result;
				JAFO.ifr.onload = function() {

					JAFO.updateIframe( V3PL.permalinks );
					JAFO.switchType( permalink, contents, scale );

				};

				JAFO.ifr.srcdoc = contents;

			}, false );

			reader.readAsText( inpFile.files[0] );

		} else if ( extension === 'dae' ) {

			alert( 'Opening a .dae file with the file dialog is still under construction. \n' +
					'Opening a .dae file is possible, but prevents any further interaction the Viewer. \n' +
					'Currently .dae files are best viewed using URLs and permalinks.' +
			'');

			JAFO.ifr.onload = function() {

				JAFO.updateIframe( V3PL.permalinks );
				JAFO.openFileParseDAE( permalink, inpFile );

			};

			JAFO.ifr.src = JAFO.template;

		} else {

			JAFO.ifr.onload = function() {

//console.log( 'openFile Object', permalink );
				JAFO.updateIframe( V3PL.permalinks );
				JAFO.getFileReaderContents( permalink, inpFile );

			};

			JAFO.ifr.src = JAFO.template;

		}

	};

// ToDo: figure out if a file is ASCII or binary...

	JAFO.openFileBinary = function ( inpFile ) {
		alert( 'Coming soon! Maybe...' );
	};

	JAFO.appendFile = function ( inpFile ) {

		if ( !inpFile.files ) return;

		var scale = inpScale.value;  // in FileOpen tab
		var permalink = V3PL.buildPermalink( inpFile.files[0].name, scale );
		var extension = inpFile.files[0].name.split( '.' ).pop().toLowerCase();

		if ( extension === 'dae' ) {

			JAFO.openFileParseDAE( permalink, inpFile );

		} else {

			JAFO.getFileReaderContents( permalink, inpFile );

		}
	};

	JAFO.getFileReaderContents = function ( permalink, inpFile ) {

		var reader = new FileReader();

		reader.addEventListener( 'load', function ( event ) {

			var contents = reader.result;

			JAFO.switchType( permalink, contents );

		}, false );

		if ( reader.readAsBinaryString !== undefined ) {

//console.log( 'reader.readAsBinaryString', reader.readAsBinaryString );

			reader.readAsBinaryString( inpFile.files[0] );

		} else {

//console.log( 'getFileReaderContents - ASCII', contents );

			reader.readAsText( inpFile.files[0] );

		}

	};

/*

Following functions deal with:

A URL to the source file has been provided
- usually via a link on a web page.
- content not supplied

*/

	JAFO.openUrl = function ( source, scale ) {
// console.log( 'openUrl', source );
		var contents;
		var scl = scale  ? scale : 1;

		V3PL.permalinks = [];
		V3PL.permalinks.push( V3PL.setDefaults( V3PL.defaultScene ) );
		var permalink = V3PL.buildPermalink( source, scale );

		var extension = source.split( '.' ).pop().toLowerCase();

		if ( extension === 'html' ) {

//console.log( 'open source HTML ', V3PL.permalinks );

			JAFO.ifr.onload = function() {

				JAFO.updateIframe( V3PL.permalinks );
				JAFO.loadHtml = ( permalink );

			};

			JAFO.ifr.src = source;

		} else {

			JAFO.ifr.onload = function() {

				JAFO.updateIframe( V3PL.permalinks );
				JAFO.switchType( permalink, contents, scale );

			};
			JAFO.ifr.src = JAFO.template;
		}

	};

	JAFO.appendUrl = function ( source, scale ) {

		var scl = scale ? scale : 1 ;
		var permalink = V3PL.buildPermalink( source, scl );
		JAFO.switchType( permalink );

	};

	JAFO.openUrlBinary = function ( source, scale ) {
console.log( 'openUrlBinary', source, scale );

		V3PL.permalinks = [];
		V3PL.permalinks.push( V3PL.setDefaults( V3PL.defaultScene ) );

		var scl = scale ? scale : 1;
		var permalink = V3PL.buildPermalink( source, scale );

		JAFO.ifr.onload = function() {

console.log( 'openFile Object', permalink );
			JAFO.loadBinaryFile( permalink );

		};
		JAFO.ifr.src = JAFO.template;

	};

	JAFO.appendUrlBinary = function ( source, scale ) {

		var scl = scale ? scale : 1 ;

		var permalink = V3PL.buildPermalink( source, scl );

		JAFO.loadBinaryFile( permalink );

	};

// Things to do after a new iframe is created

	JAFO.updateIframe = function( permalinks ) {

		var permalink = permalinks[0];

// Connect to Three.js
		app = JAFO.ifr.contentWindow;
		THREE = app.THREE;
		renderer = app.renderer;
		scene = app.scene;
		camera = app.camera;
		controls = app.controls;
		material = app.material;

// Add or reset scene things
		JALI.initLights();

		JATH.addObjectClickEvent();

		JAFO.targetList = [];

// update parent screen
		JAPR.setRandomGradient();

		JATH.attributesDiv.innerHTML = geoMsg.innerHTML = permalink.name;

		divMsg1.innerHTML = 'Base: ' + permalink.name + '<br>';

// Inform the user know what they have
		if ( JAFO.ifr.contentDocument.title ) {
			permalink.name = JAFO.ifr.contentDocument.title;
			document.title = V3.titleBase + ' ~ ' + permalink.name;
		}

	};

/*

The files above give us either the data or a link to the data

Now let us figure out where to send that information

The exception is binary files.
- Since we can't tell if a file is binary, the user has to know/decide/select...

*/

	JAFO.switchType = function ( permalink, contents ) {

		var extension = permalink.src.split( '.' ).pop().toLowerCase();

		switch ( extension ) {

			case 'html':

//console.log('switchType html', permalink );
				JAFO.loadHTML( permalink, contents );


				break;

			case 'dae':

// console.log('switchType dae', permalink );
				JAFO.loadDAE( permalink, contents );

				break;

			case 'js':
			case 'json':

			case '3geo':
			case '3mat':
			case '3obj':
			case '3scn':

// console.log('switchType json', permalink );
				JAFO.loadJSON( permalink, contents );

				break;

			case 'obj':

				JAFO.loadOBJ( permalink, contents );

				break;

			case 'stl':

//console.log('switchType stl', permalink );
				JAFO.loadSTL( permalink, contents, null );

				break;

			case 'vtk':

				JAFO.loadVTK( permalink, contents );
				break;

			case 'wrl':

				JAFO.loadVRML( permalink, contents );
				break;

			default:

				alert( 'Unsupported file format.' );
				break;

		}
	};


/*

Each of the following functions should be enhanced to take advantage of the special features and unique characteristics of each file type...

File types are in alphabetical order

*/

	JAFO.loadBinaryFile = function ( permalink ) {

		var script = document.body.appendChild( document.createElement( 'script' ) );
		script.onload = function() {

			loader = new THREE.BinaryLoader( true );
			loader.load( permalink.src, function ( geometry, materials ) {

console.log( 'loadBinaryFile' );

				if ( materials ) {
					material =  new THREE.MeshFaceMaterial( materials );

					for (var i = 0, len = material.materials.length; i < len; i++) {
						material.materials[i].side = 2;
						material.materials[i].needsUpdate = true;
					}

				} else {
					material = new THREE.MeshPhongMaterial( { color: 0x888888, shading: THREE.SmoothShading, side: 2 } );
				}

				mesh = new THREE.Mesh( geometry, material );

				scene.add( mesh );

//				scene.select = mesh;
				JAFO.updateObject ( mesh, permalink );
				JAFO.targetList.push( mesh );
//				JATH.zoomExtents();

			} );
		};
		script.src = JAFO.loadersBase + 'js/loaders/BinaryLoader.js';
	};


	JAFO.loadHTML = function ( permalink ) {
//console.log( 'load HTML', permalink );

//		scene.select = scene.children[0];
		JAFO.updateObject ( scene.children[0], permalink );
		JAFO.updateTargetList( permalink.src );
//		JATH.resetCamera( V3PL.permalinks[0] );

	};

// look into getDataUrl...

	JAFO.openFileParseDAE = function ( permalink, file ) {

		var reader = new FileReader();

		var script = document.body.appendChild( document.createElement( 'script' ) );
		script.onload = function() {

			reader.addEventListener( 'load', function ( event ) {
				var contents = event.target.result;

				var parser = new DOMParser();
				var xml = parser.parseFromString( contents, 'text/xml' );

				loader = new THREE.ColladaLoader();
				loader.options.convertUpAxis = true;
				loader.parse( xml, function ( collada ) {

					collada.scene.traverse( function ( child ) {

						if ( child instanceof THREE.Mesh && child.material instanceof THREE.MeshFaceMaterial ) {

							child.material = new THREE.MeshPhongMaterial();
							child.material.needsUpdate = true;
						}
					} );

console.log( 'openFileDAE', permalink );
					scene.add( collada.scene );

//					scene.select = collada.scene;
					JAFO.updateObject ( scene.select, permalink );
					JAFO.updateTargetList( permalink.src );
//					JATH.zoomExtents();

				}, permalink.src );

			}, false );

			reader.readAsText( file.files[0] );
		};
		script.src = JAFO.loadersBase + 'js/loaders/ColladaLoader.js';
	};

//var coll;

	JAFO.loadDAE = function ( permalink, contents ) {
console.log( 'loadDAE', permalink );

		var script = document.body.appendChild( document.createElement( 'script' ) );
		script.onload = function() {

			var loader = new THREE.ColladaLoader();
//			loader.options.centerGeometry = true;  // does this work?
			loader.options.convertUpAxis = true;
			loader.load( permalink.src, function colladaReady( collada ) {

//coll = collada;
//console.log( collada.dae.materials );
//console.log( collada );

				collada.scene.traverse( function ( child ) {

					if ( child instanceof THREE.Mesh && child.material instanceof THREE.MeshFaceMaterial ) {

						child.material = new THREE.MeshPhongMaterial();
						child.material.needsUpdate = true;
					}
				} );

				scene.add( collada.scene );
//				scene = collada.scene;  // does not compute

//				scene.select = collada.scene;
				JAFO.updateObject ( scene.select, permalink );
				JAFO.updateTargetList( permalink.src );
//				JATH.zoomExtents();

			} );
		};
		script.src ='http://mrdoob.github.io/three.js/examples/js/loaders/ColladaLoader.js' ;

	};

	JAFO.handleSON = function ( permalink, contents ) {
console.log( 'loadJSON', contents );

		contents = contents ? contents : JAFO.requestFile( permalink.src );

// the following code is from the Three.js Editor
// Not everybody understands it. Leave it out if you wish...

		if ( contents && contents.indexOf( 'postMessage' ) !== -1 ) {
console.log( 'worker did some work!', src );
			var blob = new Blob( [ contents ], { type: 'text/javascript' } );
			var src = URL.createObjectURL( blob );
			var worker = new Worker( src );
			worker.onmessage = function ( event ) {
				event.data.metadata = { version: 2 };
				JAFO.handleJSON( event.data, src, scale );
			};
			worker.postMessage( Date.now() );
			return;
		}

		// >= 3.0
		try {
			contents = JSON.parse( contents );
		} catch ( error ) {
			alert( error );
			return;
		}
		JAFO.handleJSON( permalink, contents );

	};

	JAFO.loadOBJ = function ( permalink, contents ) {

		contents = contents ? contents : JAFO.requestFile( permalink.src );

		var script = document.body.appendChild( document.createElement( 'script' ) );
		script.onload = function() {

			var object = new THREE.OBJLoader().parse( contents );

			mesh = object.children[0];

			scene.add( mesh );

//			scene.select = mesh;
			JAFO.updateObject ( mesh, permalink );
			JAFO.targetList.push( mesh );

		};
		script.src = JAFO.loadersBase + 'js/loaders/OBJLoader.js';

	};

	JAFO.loadSTL = function ( permalink, contents, inpFile ) {

		var script = document.body.appendChild( document.createElement( 'script' ) );
		script.src = JAFO.loadersBase + 'js/wip/TypedGeometry.js';

		var reader = new FileReader();
		script = document.body.appendChild( document.createElement( 'script' ) );
		script.onload = function() {
//console.log( 'loadSTL', permalink,  inpFile, contents );
			if ( contents  ) {

//				reader.addEventListener( 'load', function ( event ) {
//console.log( 'got here' );
//					var contents = event.target.result;
					geometry = new THREE.STLLoader().parse( contents );
					material = new THREE.MeshPhongMaterial();

					mesh = new THREE.Mesh( geometry, material );
//					material = new THREE.MeshNormalMaterial();

//					mesh.material = new THREE.MeshNormalMaterial();

					mesh.geometry.verticesNeedUpdate = true;

					mesh.geometry.normalsNeedUpdate = true;
					mesh.geometry.computeFaceNormals();
					mesh.geometry.computeVertexNormals();
			//		mesh.geometry.computeTangents();
			//		mesh.geometry.computeMorphNormals();
					mesh.geometry.buffersNeedUpdate = true;
					mesh.geometry.uvsNeedUpdate = true;
					mesh.material.needsUpdate = true;

					scene.add( mesh );

//					scene.select = mesh;
					JAFO.updateObject ( mesh, permalink );
					JAFO.targetList.push( mesh );

//					JATH.zoomExtents();
//console.log( mesh );

			} else if ( inpFile ) {

				reader.addEventListener( 'load', function ( event ) {
//console.log( 'got here', inpFile.files[0] );
					var contents = event.target.result;
					geometry = new THREE.STLLoader().parse( contents );
					material = new THREE.MeshPhongMaterial();

					mesh = new THREE.Mesh( geometry, material );
//					material = new THREE.MeshNormalMaterial();

//					mesh.material = new THREE.MeshNormalMaterial();

					mesh.geometry.verticesNeedUpdate = true;

					mesh.geometry.normalsNeedUpdate = true;
					mesh.geometry.computeFaceNormals();
					mesh.geometry.computeVertexNormals();
			//		mesh.geometry.computeTangents();
			//		mesh.geometry.computeMorphNormals();
					mesh.geometry.buffersNeedUpdate = true;
					mesh.geometry.uvsNeedUpdate = true;
					mesh.material.needsUpdate = true;

					scene.add( mesh );

//					scene.select = mesh;
					JAFO.updateObject ( mesh, permalink );
					JAFO.targetList.push( mesh );

//					JATH.zoomExtents();
//console.log( mesh );

				}, false );

				if ( reader.readAsBinaryString !== undefined ) {
//console.log( 'reader.readAsBinaryString', reader.readAsBinaryString );

					reader.readAsBinaryString( inpFile.files[0] );

				} else {

					reader.readAsText( inpFile.files[0] );
				}

			} else {

//console.log( 'loadStl loader' );
				var loader = new THREE.STLLoader();
				loader.addEventListener( 'load', function ( event ) {

					geometry = event.content;
					material = new THREE.MeshPhongMaterial();
					var mesh = new THREE.Mesh( geometry, material );

					mesh.rotation.set( - Math.PI / 2, 0, 0 );
					scene.add( mesh );

//					scene.select = mesh;
					JAFO.updateObject ( mesh, permalink );
					JAFO.targetList.push( mesh );

//					JATH.zoomExtents();

				} );
				loader.load( permalink.src );
			}

		};
		script.src = JAFO.loadersBase + 'js/loaders/STLLoader.js';

	};

	JAFO.loadVTK = function ( permalink, contents ) {
//console.log( 'JAFO.loadVTK', permalink );

		contents = contents ? contents : JAFO.requestFile( permalink.src );

		var script = document.body.appendChild( document.createElement( 'script' ) );
		script.onload = function() {

			geometry = new THREE.VTKLoader().parse( contents );
			material = new THREE.MeshPhongMaterial();

			mesh = new THREE.Mesh( geometry, material );

			scene.add( mesh );

//			scene.select = mesh;
			JAFO.updateObject ( mesh, permalink );
			JAFO.targetList.push( mesh );

		};
		script.src = JAFO.loadersBase + 'js/loaders/VTKLoader.js';
	};

	JAFO.loadVRML = function ( permalink, contents ) {

		contents = contents ? contents : JAFO.requestFile( permalink.src );

		var script = document.body.appendChild( document.createElement( 'script' ) );
		script.onload = function() {

			object = new THREE.VRMLLoader().parse( contents );

// needs work...
			mesh = object.children[0];
			scene.add( object );

//			scene.select = mesh;
			JAFO.updateObject ( mesh, permalink );
			JAFO.targetList.push( mesh );

		};
		script.src = JAFO.loadersBase + 'js/loaders/VRMLLoader.js';
	};

	JAFO.loadJSON = function ( permalink, contents ) {

		var loader;
		var mesh;

		contents = contents ? contents : JAFO.requestFile( permalink.src );

		contents = JSON.parse( contents );

//console.log( 'handleJSON', permalink, contents );


		if ( contents.metadata === undefined ) { // 2.0
			contents.metadata = { type: 'Geometry' };
		}
		if ( contents.metadata.type === undefined ) { // 3.0
			contents.metadata.type = 'Geometry';
		}
		if ( contents.metadata.version === undefined ) {
			contents.metadata.version = contents.metadata.formatVersion;
		}
		if ( contents.metadata.type.toLowerCase() === 'geometry' ) {
// console.log( 'found geometry' );

/*
//3DS Version

			loader = new THREE.ObjectLoader();
			loader.load( 'file:///C:/Users/theo/Dropbox/Public/git-repos/va3c.github.io/json/3dsmax/TransamericaPyramid2.js', function( result ){
				scene = result;
				JAFO.updateScene( permalink, result );
			} );
*/

// JSONLoader loads all revs of geometry...

			var texturePath = permalink.src.substr( 0, 1 + permalink.src.lastIndexOf('/') );

			loader = new THREE.JSONLoader();
			contents = loader.parse( contents, texturePath );

			var geometry = contents.geometry;

			if ( contents.materials !== undefined ) {
//console.log( 'found geometry', contents.materials );
				if ( contents.materials.length > 1 ) {
					material = new THREE.MeshFaceMaterial( contents.materials );

					for (var i = 0, len = contents.materials.length; i < len; i++) {
						contents.materials[i].side = 2;
						contents.materials[i].needsUpdate = true;
					}

				} else {
					material = contents.materials[ 0 ];
				}
			} else if ( permalink ){
				material = JAMA.materials[ permalink.mat ].set();
			} else {
				material = JAMA.materials.NormalSmooth.set();
			}

			geometry.sourceFile = permalink.src;

			mesh = new THREE.Mesh( geometry, material );
			scene.add( mesh );

//			scene.select = mesh;
			JAFO.updateObject ( mesh, permalink );

		} else if ( contents.metadata.type.toLowerCase() === 'object' ) {

			loader = new THREE.ObjectLoader();
			contents = loader.parse( contents );

			if ( contents instanceof THREE.Scene ) {
//console.log( 'found scene' );

				JAFO.loadScene( permalink, contents );

			} else {
//console.log( 'found object', contents );

				scene.add( contents );
//				scene = contents;

//				scene.select = contents;
				JAFO.updateObject ( contents, permalink );
//				JAFO.targetList.push( contents );

			}
		} else if ( contents.metadata.type.toLowerCase() === 'scene' ) {

console.log( 'found deprecated');

// DEPRECATED
			loader = new THREE.SceneLoader();
			loader.load( permalink.src, function ( contents ) {
				JAFO.loadScene( permalink, contents );
			}, '' );

		} else {

console.log( 'found a whoopsie');

		}
	};

	JAFO.loadScene = function( permalink, contents ) {
console.log( 'updateScene', permalink );

		scene = contents;

// Update Three.js
		app.scene = scene;

		JALI.checkLights();

// where is scale coming from?
		for (var i = 0, len = contents.children.length; i < len; i++) {
			if ( contents.children[i].geometry ) {
				contents.children[i].geometry.applyMatrix( new THREE.Matrix4().multiplyScalar( permalink.scl ) );
			}
			for (var j = 0, lenJ = contents.children[i].length; j < lenJ; j++) {
				if ( contents.children[i].children[j] && contents.children[i].children[j].geometry ) {
					contents.children[i].children[j].geometry.applyMatrix( new THREE.Matrix4().multiplyScalar( permalink.scl ) );
				}
			}
		}

		JATH.resetCamera( V3PL.permalinks[0] );

		scene.select = contents.children[0];
		scene.name = scene.select.name = permalink.name;
		scene.src = scene.select.src = permalink.src;
		scene.select.materialKey = V3PL.mat;

		JAFO.updateTargetList( permalink.src );

// Update parent
		JATH.attributesDiv.innerHTML = geoMsg.innerHTML = permalink.name + '<br>';
		divMsg1.innerHTML = 'Base: ' + permalink.name;

	};

	JAFO.updateObject = function ( obj, permalink ) {
		
		scene.select = obj;

		obj.position.set( permalink.posx, permalink.posy, permalink.posz );
		obj.rotation.set( permalink.rotx, permalink.roty, permalink.rotz );
		obj.scale.set( permalink.sclx * permalink.scl, permalink.scly * permalink.scl, permalink.sclz * permalink.scl);
		obj.name = permalink.name;
		obj.scale = permalink.scl;
		obj.src = permalink.src;

		if ( permalink.mat ) {
			obj.material = JAMA.materials[ permalink.mat ].set();
		}
		obj.materialKey = permalink.mat;

		obj.castShadow = true;
		obj.receiveShadow = true;

	};

	JAFO.updateTargetList = function( src ) {

		if ( src.indexOf( '.rvt.js' ) > -1 ) {
			JAFO.targetList = [];
			for ( var i = 0; i < scene.children.length; i++ ){
				for ( var k = 0; k < scene.children[i].children.length; k++){
						JAFO.targetList.push( scene.children[i].children[k] );
						scene.children[i].children[k].userData = scene.children[i].userData;
				}
			}
		} else {
			JAFO.targetList = scene.children;
		}
// console.log( 'updateTargetList', JAFO.targetList );

			JATH.zoomExtents();

	};

	JAFO.requestFile = function( fname ) {

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.crossOrigin = "Anonymous";
		xmlhttp.open( 'GET', fname, false );
		xmlhttp.send( null );
		return xmlhttp.responseText;

	};

	JAFO.requestFileBinary = function( permalink ) {

		JAFO.xmlhttp = new XMLHttpRequest();
		JAFO.xmlhttp.permalink = permalink;
		JAFO.xmlhttp.crossOrigin = "Anonymous";
		JAFO.xmlhttp.responseType = "arraybuffer";
		JAFO.xmlhttp.open( 'GET', permalink.src, true );
		JAFO.xmlhttp.onreadystatechange = JAFO.callbackBinaryFile;
		JAFO.xmlhttp.send( null );

	};

	JAFO.callbackBinaryFile = function() {

		if ( JAFO.xmlhttp.readyState == 4  ) {

			JAFO.switchType( JAFO.xmlhttp.permalink, JAFO.xmlhttp.response  );

		} else {

console.log('waiting...');

		}

	};
