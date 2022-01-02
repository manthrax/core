const {abs, min, max, PI, sin, cos} = Math;
function SinRNG(seed) {
    return {
        seed: (seed === undefined) ? (+new Date() + Math.random()) : seed,
        random: function() {
            this.seed = Math.sin(this.seed) * 10000;
            return this.seed - Math.floor(this.seed);
        }
    }
}


let meshes;
let planeMesh;

let makeNodes = (config={})=>{
    let d3 = config.d3;
    let THREE = config.THREE;
    let scene = config.scene;
    let width = config.width ? parseFloat(config.width) : 960
      , height = config.height ? parseFloat(config.height) : 500
      , padding = (config.padding!==undefined) ? parseFloat(config.padding) : 3 //6.5   : separation between same-color nodes
      , clusterPadding = (config.clusterPadding!==undefined) ? parseFloat(config.clusterPadding) : 0 //6 :separation between different-color nodes
      , maxRadius = config.maxRadius ? parseFloat(config.maxRadius) : 8;
    let n = config.count?parseInt(config.count) : 20 // total number of nodes
      , m = config.clusterCount?parseInt(config.clusterCount) : 1;// number of distinct clusters
    let color = d3.scaleSequential(d3.interpolateRainbow).domain(d3.range(m));
    // The largest node for each cluster.
    let clusters = new Array(m);
    let nodes;
    let simulation
    let links;


    let rng = SinRNG(config.seed || 1234);
    let random = rng.random.bind(rng);
    let rnd = (min,max)=>(random() * (max - min)) + min
if(config.boxes)n=config.boxes.length
    

    links = d3.range(n).map(lnk=>{
        let r1 = (random() * n) | 0;
        let r2 = (random() * n) | 0;
        if (r1 == r2)
            (r1 = r2 + 1) % n
        return [r1, r2]
    }
    )
    nodes = d3.range(n).map(function(e,idx) {
        var i = Math.floor(random() * m)
          , r = Math.sqrt((i + 1) / m * -Math.log(random())) * maxRadius
          , d = {
            cluster: i,
            radius: r,
            width: r * 1.5,
            height: r,
            //x: (random()-.5),
            //y: (random()-.5)
            //x: Math.cos(i / m * 2 * Math.PI * Math.random()) * 500 + width / 2 + Math.random(),
            //y: Math.sin(i / m * 2 * Math.PI * Math.random()) * 500 + height / 2 + Math.random()
        };
        if(config.boxes){
            d.width = config.boxes[idx].width;
            d.height = config.boxes[idx].height;
        } 

        if (!clusters[i] || (r > clusters[i].radius))
            clusters[i] = d;
        return d;
    });
    if (meshes){
        meshes.forEach(m=>m.parent.remove(m))
        meshes=undefined
    }
    if (scene)
        meshes = nodes.map(r=>{
            (!planeMesh) && (planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial()));
            let m = planeMesh.clone();
            scene.add(m)
            return m;
        }
        )

    simulation = d3.forceSimulation()// keep entire simulation balanced around screen center
    .force('center', d3.forceCenter(0, 0))// cluster by section
    .force('cluster', d3.forceCluster().centers(function(d) {
        return clusters[d.cluster];
    }).strength(.5))
    // apply collision with padding
    //simulation.force('collide', d3.forceCollide(function(d) {return d.radius *.5;})) //+ padding  --- sphere collision
    simulation.force('collision', rectCollide().size(function(d) {
        return [d.width + padding, d.height + padding]
    }))
    //--- box collision
    simulation.on('tick', layoutTick).nodes(nodes)
    //.links(links)

    function layoutTick(e) {
        nodes.forEach((n,i)=>{
            if (meshes) {
                let m = meshes[i]
                if(m){
                    m.scale.set(n.width,n.height,1)
                    //m.position.set(r.x, r.y, 0)
                    m.position.set(n.x, n.y, 0);
                }
            }
        }
        )
    }
    if (config.startIterations) {
        for (let i = 0; i < config.startIterations; i++)
            simulation && simulation.tick()
    }
    layoutTick()

    function rectCollide() {
        var nodes, sizes, masses, size
        //var size = constant([0, 0])
        var strength = 1
        var iterations = 1

        function force() {
            var node, size, mass, xi, yi
            var i = -1
            while (++i < iterations) {
                iterate()
            }

            function iterate() {
                var j = -1
                var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

                while (++j < nodes.length) {
                    node = nodes[j]
                    size = sizes[j]
                    mass = masses[j]
                    xi = xCenter(node)
                    yi = yCenter(node)

                    tree.visit(apply)
                }
            }

            function apply(quad, x0, y0, x1, y1) {
                var data = quad.data
                var xSize = (size[0] + quad.size[0]) / 2
                var ySize = (size[1] + quad.size[1]) / 2
                if (data) {
                    if (data.index <= node.index) {
                        return
                    }

                    var x = xi - xCenter(data)
                    var y = yi - yCenter(data)
                    var xd = Math.abs(x) - xSize
                    var yd = Math.abs(y) - ySize

                    if (xd < 0 && yd < 0) {
                        var l = Math.sqrt(x * x + y * y)
                        var m = masses[data.index] / (mass + masses[data.index])

                        if (Math.abs(xd) < Math.abs(yd)) {
                            node.vx -= (x *= xd / l * strength) * m
                            data.vx += x * (1 - m)
                        } else {
                            node.vy -= (y *= yd / l * strength) * m
                            data.vy += y * (1 - m)
                        }
                    }
                }

                return x0 > xi + xSize || y0 > yi + ySize || x1 < xi - xSize || y1 < yi - ySize
            }

            function prepare(quad) {
                if (quad.data) {
                    quad.size = sizes[quad.data.index]
                } else {
                    quad.size = [0, 0]
                    var i = -1
                    while (++i < 4) {
                        if (quad[i] && quad[i].size) {
                            quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                            quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                        }
                    }
                }
            }
        }

        function xCenter(d) {
            return d.x + d.vx
            //+ sizes[d.index][0] / 2 }  --- if upper left, not center
        }
        function yCenter(d) {
            return d.y + d.vy
            //+ sizes[d.index][1] / 2 } --- if upperleft, not center
        }

        force.initialize = function(_) {
            sizes = (nodes = _).map(size)
            masses = sizes.map(function(d) {
                return d[0] * d[1]
            })
        }

        force.size = function(_) {
            return (arguments.length ? (size = typeof _ === 'function' ? _ : constant(_),
            force) : size)
        }

        force.strength = function(_) {
            return (arguments.length ? (strength = +_,
            force) : strength)
        }

        force.iterations = function(_) {
            return (arguments.length ? (iterations = +_,
            force) : iterations)
        }

        return force
    }

    return {
        nodes,
        simulation
    }
}

export default class BoxForceLayout {
    constructor(config={}) {
        this.layout = makeNodes(config);
    }

}

/*

var force = d3.forceSimulation()
.nodes(nodes)
//.links(links)
.size([width, height])
//.linkStrength(0.1)
//.friction(0.9)
//.linkDistance(20)
.charge(-30)
.gravity(0.1)
.theta(0.8)
.alpha(0.1)
.start();
*/
/*

force.on('tick', function(e) {

node
.each(calcBorderDistance)
.attr('transform', function(d) {
d.x -= e.alpha*(1/Math.pow(d.borderDistance.x,2);
d.y -= e.alpha*(1/Math.pow(d.borderDistance.y,2);
return 'translate(' + d.x + ',' + d.y + ')'; // Move node
});
});

function calcBorderdistance(d) {
// Insert code here to calculate the distance to the nearest border of your shape
var x = ..., y = ...;
d.borderDistance = {'x':x,'y':y};
}
*/


let simulation;
let test = ({renderer,THREE,d3})=>{

    renderer.setAnimationLoop(()=>{
        simulation&&simulation.tick()
        renderer.render(scene, camera)
    }
    )

    let makeNodes=()=>{
        let count = rnd(3,100)|0
        let boxes=[]

        let maxBox = 20;
        for(let i=0;i<count;i++)
            boxes.push({width:rnd(maxBox*.5,maxBox),height:rnd(maxBox*.25,maxBox*.75)})
        let layout = new BoxForceLayout({
            THREE,
            d3,
            scene,
            //count,
            seed:123+(Math.random()*300)|0,
            boxes,
            padding:1,
            startIterations:1000,
            maxRadius:maxBox*.25
        })

        simulation = layout.simulation;
    }
    makeNodes()
    document.addEventListener('keydown',e=>(e.code=="KeyR")&&makeNodes())

}