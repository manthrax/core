function MST(dim=3) {
  let wichmann_hill_rng = (s1 = 100, s2 = 100, s3 = 100) => () =>
    ((s1 = (171 * s1) % 30269) / 30269 +
      (s2 = (172 * s1) % 30307) / 30307 +
      (s3 = (170 * s1) % 30323) / 30323) %
    1;

  let rnd = wichmann_hill_rng();
  //for (let i = 0; i < 1000; i++) console.log(rnd())

  let nodes = [];
  let edges = [];
  let arnd = a => a[(a.length * rnd()) | 0];
  let addEdge = (na, nb) => {
    let nna = nodes[na];
    let nnb = nodes[nb];
    let dist = (na, nb) => {
      let x = na.x - nb.x,
        y = na.y - nb.y,
        z = na.z - nb.z;
      return x * x + y * y + z * z;
    };
    let e = {
      id: edges.length,
      a: na,
      b: nb,
      w: dist(nna, nnb)
    };
    edges.push(e);
    nna.edges.push(e);
    nnb.edges.push(e);
  };

  let addNode = (x, y, z = 0) => {
    let nd = {
      id: nodes.length,
      edges: [],
      x,
      y,
      z
    };
    nodes.push(nd);
    return nd;
  };
  let d2 = dim / 2;
  if (false) {
    for (let y = 0; y < dim; y++)
      //Make  dim * dim grid of points.. make an edge to each neighbor
      for (let x = 0; x < dim; x++) {
        let nd = addNode(x - d2, y - d2);
        if (x > 0) addEdge(nd.id, nd.id - 1);
        if (y > 0) addEdge(nd.id, nd.id - dim);
        //if((x > 0) && (y > 0))if(x&1) addEdge(nd.id, nd.id - dim - 1); else  addEdge(nd.id-1, nd.id - dim ) //Diagonal edges..
      }
  } else {
    let ndim = dim * dim * dim;
    //Build a random 3d node mesh .. connect all points to each other with edges...
    for (let y = 0; y < ndim; y++) addNode(rnd() * 50, rnd() * 50,1); //

    for (let y = 0; y < ndim; y++)
      for (let x = 0; x < ndim; x++) if (x != y) addEdge(x, y);
  }

  let start;
  let visited = {};
  let visitedList = [];
  let mstList = [];
  let front;
  let reset = () => {
    visited = ctx.visited = {};
    visitedList = ctx.visitedList = [];
    mstList = ctx.mstList = [];
  };
  /*
  let NBiterate = Ni => {
    if (ctx.done) return;
    if (!start) {
      reset();
      start = arnd(nodes);
      visitedList.push(start);
      visited[start.id] = true;
    }

    front = [];
    for (let i = 0, ct = visitedList.length; i < ct; i++)
      front = front.concat(visitedList[i].edges);
    front = front
      .filter(e => !(visited[e.a] && visited[e.b]))
      .sort((a, b) => a.w - b.w);
    if (!front.length) {
      ctx.done = true;
      return true;
    }
    let i;

    for (i = 0; i < front.length; i++) if (front[i].w > front[0].w) break;

    let e = front[(Math.random() * (i - 1)) | 0];
    //Pick a random edge of the lowest distance/weight edges (actual prims algo)
    //let e = arnd(front)   //Pick a random edge of the ALL edges..
    //let e = front[0]      //Pick the first edge always..
    if (!visited[e.a]) {
      visited[e.a] = true;
      visitedList.push(nodes[e.a]);
    }
    if (!visited[e.b]) {
      visited[e.b] = true;
      visitedList.push(nodes[e.b]);
    }
    mstList.push(e);
  };
*/
  function iterate() {
    if (ctx.done) return;

    if (!start) {
      reset();
      start = arnd(nodes);
      visitedList.push(start);
      visited[start.id] = true;
      ctx.idx = 0;
    }

    let i = ctx.idx++;

    if (i == 0) front = [];
    //console.log(visitedList.length)

    if (i < visitedList.length)
      return (front = front.concat(visitedList[i].edges));

    if (i == visitedList.length) {
      front = front
        .filter(e => !(visited[e.a] && visited[e.b]))
        .sort((a, b) => a.w - b.w);
      if (!front.length) {
        ctx.done = true;
        return true;
      }
    }
    i -= visitedList.length;

    if (i < front.length) {
      if (front[i].w <= front[0].w) return;
    }
    let e = front[(rnd() * (i - 1)) | 0]; //Pick a random edge of the lowest distance/weight edges (actual prims algo)
    //let e = arnd(front)   //Pick a random edge of the ALL edges..
    //let e = front[0]      //Pick the first edge always..
    if (!visited[e.a]) {
      visited[e.a] = true;
      visitedList.push(nodes[e.a]);
    }
    if (!visited[e.b]) {
      visited[e.b] = true;
      visitedList.push(nodes[e.b]);
    }
    mstList.push(e);

    ctx.idx = 0;
  }

  let ctx = {
    nodes,
    edges,
    mstList,
    iterate,
    addNode,
    addEdge,
    done: false
  };
  return ctx;
}

export default MST;
