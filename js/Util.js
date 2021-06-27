import*as THREE from "https://threejs.org/build/three.module.js";
//import {ConvexHull} from "../lib/three/module/ConvexHull.js"
import {ConvexHull} from 'https://threejs.org/examples/jsm/math/ConvexHull.js';
class Util {
    static onLoadFile(url){

    }

    static readFile(file,type,opt_encoding){
        return new Promise((resolve,reject)=>{
            type=type?type:'Text';
            var fr = new FileReader();
            fr.onload((thefile)=>resolve(thefile))
            fr.onerror((err)=>reject(err))
            fr['readAs'+type](file);
        })
    }

    static loadTexture(url, rep, filtered=true) {
        return new Promise((resolve,reject)=>{
            if(url.lastIndexOf('.png')>0){
                url = url.slice(0,url.length-4)+'.jpg';
            }
            Util.onLoadFile(url);
            
            var spaceTex = new THREE.TextureLoader().load(url, ()=>{
                spaceTex.repeat.set(rep, rep);
                spaceTex.wrapS = spaceTex.wrapT = THREE.RepeatWrapping;

                (!filtered) && (spaceTex.minFilter = spaceTex.magFilter = THREE.NearestFilter);
                resolve(spaceTex);
            },
            undefined,
            function ( err ) {
                console.error( 'An error happened:',err );
                reject(err);
            }
            );
        }
        )
    }

    static loadFileAsText(url) {
        return new Promise((resolve,reject)=>{
            var request = new XMLHttpRequest();
            Util.onLoadFile(url)
            request.open("GET", url, true);
            request.responseType = "text";
            request.onload = ()=>resolve(request.response);
            request.onerror = (err)=>{alert('StarLoader:loadFileAsText XHR error:',url);reject(err);}
            request.send();
        }
        );
    }

    static loadScript(pth) {
        return new Promise((resolve,reject)=>{
            var scr = document.createElement("script");
            document.body.appendChild(scr);
            scr.onload = (a,b,c)=>{
                resolve()
                };
            scr.onerror = (err)=>{
                alert('StarLoader: loadScript error:'+pth+err.toString(),);
                reject(err);}
            Util.onLoadFile(pth)

            scr.src = pth;
            
       
        }
        );
    }

    static async loadScriptsSync(paths, root='') {
        for (var i = 0; i < paths.length; i++)
            await Util.loadScript(root+paths[i]);
    }

    static async loadScriptsAsync(paths, root='') {
        return new Promise((resolve,reject)=>{
            var contents = {};
            var promises = [];
            var fullpaths = [];
            for (var i = 0; i < paths.length; i++) {
                var path = root + paths[i];
                fullpaths.push(path);
                promises.push(loadFileAsText(path).then(function(path) {
                    return function(content) {
                        contents[path] = content;
                    }
                }(path)));
            }

            function injectScript(text) {
                return new Promise((resolve,reject)=>{
                    var scr = document.createElement("script");
                    scr.type = 'text/javascript';
                    scr.text = text;
                    document.body.appendChild(scr);
                    resolve();
                }
                );
            }

            async function injectScripts(fullpaths) {
                //for (var i = 0; i < fullpaths.length; i++) await injectScript(contents[fullpaths[i]]);
                var mega = [];
                for (var i = 0; i < fullpaths.length; i++)
                    mega.push("//" + fullpaths[i] + "\n" + contents[fullpaths[i]]);
                await injectScript(mega.join(''));
            }

            Promise.all(promises).then(async()=>{
                await injectScripts(fullpaths);
                resolve();
            }
            );
        }
        );
    }

//----------------------------------------

    static init(){
        return new Promise((resolve,reject)=>{
            var request = indexedDB.open("nebula", Util.dbVersion);
            request.onupgradeneeded = (event)=> {
                Util.db = request.result;
                console.log("Upgrading objectStore")
                Util.db.createObjectStore("nebula_save");
            }
            request.onsuccess = (event)=>{
                console.log("Success creating/accessing IndexedDB database");
                Util.db = request.result;
                resolve(request);
            }
            request.onerror = (err)=>{
                console.log("Error creating/accessing IndexedDB database");
                reject(err);
            }
        })
    }

    static downloadFile(filename, href) {
      var element = document.createElement('a');
      element.setAttribute('href', href);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    static downloadBlob(filename, blob) {
        Util.downloadFile(filename,window.URL.createObjectURL(blob));
    }
    static downloadText(filename, text) {
        Util.downloadFile(filename,'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    }

    static queryDB(fn){
        return new Promise((resolve,reject)=>{
            var transaction = Util.db.transaction(["nebula_save"], "readwrite");
            var db = transaction.objectStore("nebula_save");
            var tx = fn(db);
            tx.onsuccess = function(event) {
                resolve(event.target.result);
            }
            tx.onerror = function(err) {
                console.log("Error starting transaction with image DB.");
                reject(err);
            }
        });
    }
    static async flushDB(path) {
        var transaction = Util.db.transaction(["nebula_save"], "readwrite");
        var tx = transaction.objectStore("nebula_save");
        tx.clear();
    }
    static async getSaveKeys(path){
        return await Util.queryDB((db)=>{
            return db.getAllKeys();
        })

    }
    static async downloadDB() {
        var db = await Util.queryDB((db)=>{
            return db.getAll();
        });
        var keys = await Util.queryDB((db)=>{
            return db.getAllKeys();
        });
        return {db,keys};
    }
    
    static async loadDB(path) {
        return await Util.queryDB((db)=>{
            return db.get(path);
        });
    }

    static async saveDB(saveData,path){
        return await Util.queryDB((db)=>{
            return db.put(saveData, path);
        });
    }


    static async loadTables(url,tables){
        var tables =tables?tables:{}; 
        var rsrctxt = await Util.loadFileAsText(url);
        var rows = rsrctxt.split("\n");
        var curTable;
        console.time('loadTable');
        for(var i=0;i<rows.length;i++){
           var r = rows[i];
           var vals = r.split(",");
           if(r.indexOf("#")==0){
                var rowHeader = vals;
                if(curTable){
                    tables[curTable.name] = curTable;
                }
                curTable = {}
                curTable.name = rowHeader[0].slice(1);
                var cols = curTable.columnNames = rowHeader.slice(1);
                var colParsers = [];
                for(var j=0;j<cols.length;j++){
                    var dt = cols[j].split(':');
                    var parser;
                    if(dt[1]=='n')parser = (str)=>parseFloat(str);
                    else if(dt[1]=='s')parser = (str)=>str;
                    colParsers.push(parser);
                }
                curTable.colParsers=colParsers;
                curTable.rows=[];
            }else{
                if(vals.length!=curTable.columnNames.length){
                    if((vals.length!=1)&&(vals[0]!==''))
                        console.log("Malformed table row:",r," at line:",i+1,":'"+r+"'")
                }else{
                    curTable.rows.push(vals);
                    for(var j=0;j<vals.length;j++)
                        vals[j]=curTable.colParsers[j](vals[j])
                }
            }
        }
        if(curTable){
            tables[curTable.name] = curTable;
        }
        console.timeEnd('loadTable');
        return tables;
    }
    static traverseMaterials(root, fn) {
        root.traverse((e)=>{
            if (e.material) {
                if (e.material.length)
                    for (var i = 0; i < e.material.length; i++)
                        fn(e, e.material[i], 0);
                else
                    fn(e, e.material, -1)
            }
        }
        )
    }
    static replaceMaterial(root, material, newMaterial) {
        if (root.material.length) {
            for (var i = 0; i < root.material.length; i++)
                if (root.material[i] === material)
                    root.material[i] = newMaterial;
        } else if (root.material === material)
            root.material = newMaterial;
    }

    static getHullGeometry (g){
        var qh = new ConvexHull();
        
        var p = g.attributes.position.array;
        var points = [];
        for (var i = 0; i < p.length; i += 3) {
            points.push(new THREE.Vector3(p[i],p[i + 1],p[i + 2]));
        }
        
        var hull = qh.setFromObject(new THREE.Mesh(g));
        var geometry = new THREE.Geometry();

        var faces = qh.faces;
        var uniquePoints = geometry.vertices;
        var uniqueMap = {};
        for (i = 0; i < faces.length; i += 1) {

            var edge = faces[i].edge;
            var pkey = (p)=>{
                return p.x + "," + p.y + "," + p.z
            }
            var getPIndex = (edge)=>{
                var idx;
                var vkey = pkey(edge.vertex.point);
                if (uniqueMap[vkey] === undefined) {
                    idx = uniqueMap[vkey] = uniquePoints.length;
                    uniquePoints.push(edge.vertex.point);
                } else {
                    idx = uniqueMap[vkey];
                }
                return idx;
            }

            var face = new THREE.Face3(getPIndex(edge),getPIndex(edge.next),getPIndex(edge.next.next));
            geometry.faces.push(face);
        }
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.verticesNeedUpdate = geometry.elementsNeedUpdate = true;
        
        Util.bloatGeometry(geometry,0.1);
        
        return geometry;
    }

    static bloatGeometry(geometry,expandDistance){        
        var vnByRef={};
        for(var i=0;i<geometry.faces.length;i++){
            var f = geometry.faces[i];
            vnByRef[f.a]=f.vertexNormals[0];
            vnByRef[f.b]=f.vertexNormals[1];
            vnByRef[f.c]=f.vertexNormals[2];
        }
        var tv0 = new THREE.Vector3();
        for(var i in vnByRef){
            geometry.vertices[i].add(tv0.copy(vnByRef[i]).multiplyScalar(expandDistance));
        }
        geometry.verticesNeedUpdate = geometry.elementsNeedUpdate = true;
    }
    static boxLineSegments(sz){
        var nv3=(x,y,z)=>new THREE.Vector3(x,y,z)
        var a0=nv3(-sz.x,-sz.y,-sz.z);
        var a1=nv3( sz.x,-sz.y,-sz.z);
        var a2=nv3( sz.x, sz.y,-sz.z);
        var a3=nv3(-sz.x, sz.y,-sz.z);
        var a4=nv3(-sz.x,-sz.y, sz.z);
        var a5=nv3( sz.x,-sz.y, sz.z);
        var a6=nv3( sz.x, sz.y, sz.z);
        var a7=nv3(-sz.x, sz.y, sz.z);
        var vts = [];
        vts.push(a0,a1,a1,a2,a2,a3,a3,a0, a4,a5,a5,a6,a6,a7,a7,a4, a0,a4,a1,a5,a2,a6,a3,a7);
        return vts;
    }
    static volumeRays(sz){

        var nv3=(x,y,z)=>new THREE.Vector3(x,y,z)
        var v = [];
        var step=sz.clone().multiplyScalar(0.2);
        var ez = step.clone().multiplyScalar(0.001).add(sz);
        for(var x=-sz.x;x<ez.x;x+=step.x)
        for(var y=-sz.y;y<ez.y;y+=step.y)
        for(var z=-sz.z;z<ez.z;z+=step.z)
        {
            v.push(nv3(x,y,-sz.z),nv3(x,y,sz.z))
            v.push(nv3(x,-sz.y,z),nv3(x,sz.y,z))
            v.push(nv3(-sz.x,y,z),nv3(sz.x,y,z))
        }
        return v;
    }
    static makeHullMesh(mesh){
        var ng = Util.getHullGeometry(mesh.geometry);
        var nm = new THREE.Mesh(ng);
        nm.material.wireframe = true;
        return nm;
    }
    static makeFlattenedMeshHierarchy(mesh){
        var merged = new THREE.Geometry();
        var cp = mesh.clone();
        cp.position.set(0,0,0);
        cp.scale.set(1,1,1);
        cp.rotation.set(0,0,0,"XYZ");
        cp.traverse(function(m){
            if(m.type=="Mesh"&&m.geometry){
                m.updateMatrixWorld();
                if(m.geometry.type=="BufferGeometry")m.geometry = new THREE.Geometry().fromBufferGeometry(m.geometry);
                    merged.merge(m.geometry, m.matrixWorld);
            }
        });
        cp.position.copy(mesh.position);
        cp.rotation.copy(mesh.rotation);
        cp.scale.copy(mesh.scale);
        cp.geometry = new THREE.BufferGeometry().fromGeometry(merged);
        cp.updateMatrixWorld();
        while(cp.children.length)cp.remove(cp.children[0]);
        return cp;
    }

    static makeWireSegMesh(segs){
        if(!Util.lineMat)Util.lineMat = new THREE.LineBasicMaterial({transparent:true,opacity:0.05,depthTest:false})
        var tm = new THREE.LineSegments(new THREE.Geometry(),Util.lineMat);
        var g = tm.geometry;
        g.vertices.push.apply(g.vertices,segs);
        g.verticesNeedUpdate = true;
        return tm;
    }

    static makeWireBBox(bbox){
        var sz = new THREE.Vector3();
        bbox.getSize(sz);
        sz.multiplyScalar(0.5);
        var step=sz.clone().multiplyScalar(0.2);

        var m = Util.makeWireSegMesh(Util.volumeRays(sz));
        //var m = Util.makeWireSegMesh(Util.boxLineSegments(sz));
        

        //m.geometry = new THREE.QuickHull().setFromObject(m);

        bbox.getCenter(m.position); 
        return m;

//        var v = Util.volumeRays(sz);
        //var tm = new THREE.Mesh(new THREE.BoxGeometry(sz.x,sz.y,sz.z));
        //sz.multiplyScalar(0.5);
    }


    static boxUnwrapUVs(geometry) {
        for (var i = 0; i < geometry.faces.length; i++) {
            var face = geometry.faces[i];
            var faceUVs = geometry.faceVertexUvs[0][i]
            var va = geometry.vertices[geometry.faces[i].a]
            var vb = geometry.vertices[geometry.faces[i].b]
            var vc = geometry.vertices[geometry.faces[i].c]
            var vab = new THREE.Vector3().copy(vb).sub(va)
            var vac = new THREE.Vector3().copy(vc).sub(va)
            //now we have 2 vectors to get the cross product of...
            var vcross = new THREE.Vector3().copy(vab).cross(vac);
            //Find the largest axis of the plane normal...
            vcross.set(Math.abs(vcross.x), Math.abs(vcross.y), Math.abs(vcross.z))
            var majorAxis = vcross.x > vcross.y ? (vcross.x > vcross.z ? 'x' : vcross.y > vcross.z ? 'y' : vcross.y > vcross.z) : vcross.y > vcross.z ? 'y' : 'z'
            //Take the other two axis from the largest axis
            var uAxis = majorAxis == 'x' ? 'y' : majorAxis == 'y' ? 'x' : 'x';
            var vAxis = majorAxis == 'x' ? 'z' : majorAxis == 'y' ? 'z' : 'y';
            faceUVs[0].set(va[uAxis], va[vAxis])
            faceUVs[1].set(vb[uAxis], vb[vAxis])
            faceUVs[2].set(vc[uAxis], vc[vAxis])
        }
        geometry.elementsNeedUpdate = geometry.verticesNeedUpdate = true;
    }

/*//boxunwrap test
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(10,16,16),new THREE.MeshBasicMaterial({
            map: this.skyDome.material.map
        }))
        boxUnwrapUVs(mesh.geometry);
*/
    static addDragAndDrop(domElement){
        function removeDragData(ev) {
          console.log('Removing drag data')
          if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to remove the drag data
            ev.dataTransfer.items.clear();
          } else {
            // Use DataTransfer interface to remove the drag data
            ev.dataTransfer.clearData();
          }
        }
        function dropHandler(ev) {
          console.log('File(s) dropped');
          ev.preventDefault();
          if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
              // If dropped items aren't files, reject them
              if (ev.dataTransfer.items[i].kind === 'file') {
                var file = ev.dataTransfer.items[i].getAsFile();
                console.log('... file[' + i + '].name = ' + file.name);
              }
            }
          } else {
            // Use DataTransfer interface to access the file(s)
            for (var i = 0; i < ev.dataTransfer.files.length; i++) {
              console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
            }
          } 
          // Pass event to removeDragData for cleanup
          removeDragData(ev)
        }

        function dragOverHandler(ev) {
          console.log('File(s) in drop zone'); 
          // Prevent default behavior (Prevent file from being opened)
          ev.preventDefault();
        }
        domElement.ondrop = dropHandler;
        domElement.ondragover = dragOverHandler;
    }

    static makeEventable(ctx){

        ctx.eventListeners = {}

        ctx.addEventListener = function(evt, fn) {
            (ctx.eventListeners[evt] ? ctx.eventListeners[evt] : ctx.eventListeners[evt] = []).push(fn);
        }

        ctx.removeEventListener = function(evt, fn) {
            console.log("Not implements!")
            ctx.eventListeners[evt].splice(ctx.eventListeners[evt].indexOf(fn),1);
        }
        ctx.fireEvent = function(evt, param, param1, param2) {
            var e = ctx.eventListeners[evt];
            if (e)
                for (var i = 0; i < e.length; i++)
                    e[i](param, param1, param2);
        }
    }
}

Util.dbVersion = 2;
//Util.db;

export default Util;
