/*
  This class computes "surface IDs" for a given mesh.

  A "surface" is defined as a set of triangles that share vertices.

  Inspired by Ian MacLarty, see:
    https://twitter.com/ianmaclarty/status/1499494878908403712
*/

// NOTE 2024-02-16 jeremboo: It should be like an enum. From 0 to X without jumping numbers
export const DEDICATED_SURFACE_IDS = {
  transparent: 0,
};

// TODO 2024-01-04 jeremboo: Improve this
class SurfaceFinder {
  constructor() {
    // This identifier, must be globally unique for each surface
    // across all geometry rendered on screen
    // NOTE 2024-01-08 jeremboo: It starts add ids after the dedicated ids numbers
    this.surfaceId = Object.keys(DEDICATED_SURFACE_IDS).length;
  }

  /*
   * Returns the surface Ids as a Float32Array that can be inserted as a vertex attribute
   */
  getSurfaceIdAttribute(mesh, forcedSurfaceId) {
    const bufferGeometry = mesh.geometry;
    const numVertices = bufferGeometry.attributes.position.count;
    const bufferArray = new Float32Array(numVertices);

    if (forcedSurfaceId !== undefined) {
      for (let i = 0; i < numVertices; i++) {
        bufferArray[i] = forcedSurfaceId;
      }
    } else {
      const vertexIdToSurfaceId = this._generateSurfaceIds(mesh);
      for (let i = 0; i < numVertices; i++) {
        bufferArray[i] = vertexIdToSurfaceId[i];
      }
    }

    return bufferArray;
  }

  /*
   * Returns a `vertexIdToSurfaceId` map
   * given a vertex, returns the surfaceId
   */
  _generateSurfaceIds(mesh) {
    const bufferGeometry = mesh.geometry;
    const numVertices = bufferGeometry.attributes.position.count;
    const numIndices = bufferGeometry.index.count;
    const indexBuffer = bufferGeometry.index.array;
    const vertexBuffer = bufferGeometry.attributes.position.array;
    // For each vertex, search all its neighbors
    const vertexMap = {};
    for (let i = 0; i < numIndices; i += 3) {
      const i1 = indexBuffer[i + 0];
      const i2 = indexBuffer[i + 1];
      const i3 = indexBuffer[i + 2];

      add(i1, i2);
      add(i1, i3);
      add(i2, i3);
    }
    function add(a, b) {
      if (vertexMap[a] == undefined) vertexMap[a] = [];
      if (vertexMap[b] == undefined) vertexMap[b] = [];

      if (vertexMap[a].indexOf(b) == -1) vertexMap[a].push(b);
      if (vertexMap[b].indexOf(a) == -1) vertexMap[b].push(a);
    }

    // Find cycles
    const frontierNodes = Object.keys(vertexMap).map(v => Number(v));
    const exploredNodes = {};
    const vertexIdToSurfaceId = {};

    while (frontierNodes.length > 0) {
      const node = frontierNodes.pop();
      if (exploredNodes[node]) continue;

      // Get all neighbors recursively
      const surfaceVertices = getNeighborsNonRecursive(node);
      // Mark them as explored
      for (let v of surfaceVertices) {
        exploredNodes[v] = true;
        vertexIdToSurfaceId[v] = this.surfaceId;
      }

      this.surfaceId += 1;
    }
    function getNeighbors(node, explored) {
      const neighbors = vertexMap[node];
      let result = [node];
      explored[node] = true;

      for (let n of neighbors) {
        if (explored[n]) continue;
        explored[n] = true;
        const newNeighbors = getNeighbors(n, explored);
        result = result.concat(newNeighbors);
      }

      return result;
    }

    function getNeighborsNonRecursive(node) {
      const frontier = [node];
      const explored = {};
      const result = [];

      while (frontier.length > 0) {
        const currentNode = frontier.pop();
        if (explored[currentNode]) continue;
        const neighbors = vertexMap[currentNode];
        result.push(currentNode);

        explored[currentNode] = true;

        for (let n of neighbors) {
          if (!explored[n]) {
            frontier.push(n);
          }
        }
      }

      return result;
    }

    return vertexIdToSurfaceId;
  }
}

const surfaceFinder = new SurfaceFinder();
export default surfaceFinder;
